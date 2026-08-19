import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ConversationItem = {
  role: 'assistant' | 'user';
  text: string;
};

type CoachAction = {
  id: string;
  label: string;
  type: 'reschedule_reminder' | 'suggest_new_ritual' | 'generate_weekly_recap';
  payload?: Record<string, unknown>;
};

type RitualSummary = {
  ritualId: string;
  name: string;
  completionRate: number;
  completions: number;
  totalDays: number;
  longestStreak: number;
  currentStreak: number;
  streakBeforeToday: number;
  completedToday: boolean;
  last7Days?: number[];
  timeOfDayDistribution?: Record<string, number>;
  dayOfWeekPattern?: Record<string, number>;
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ error: 'Missing Supabase environment' }, { status: 500, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const conversationHistory = Array.isArray(body.conversationHistory)
    ? body.conversationHistory.filter((item: ConversationItem) => item?.text && (item.role === 'assistant' || item.role === 'user'))
    : [];

  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400, headers: corsHeaders });
  }

  const authorization = req.headers.get('Authorization') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const { data: cachedSummary } = await supabase
    .from('coach_summaries')
    .select('summary,summary_window_start,summary_window_end')
    .eq('user_id', user.id)
    .order('summary_window_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: rituals } = await supabase
    .from('habits')
    .select('id,name,icon,color,frequency,reminder_time')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  const coachData = {
    summary: cachedSummary?.summary ?? null,
    summaryWindow: cachedSummary ? { start: cachedSummary.summary_window_start, end: cachedSummary.summary_window_end } : null,
    rituals: rituals ?? [],
  };

  const fallback = buildFallbackReply(message, coachData.summary);

  if (!anthropicKey) {
    return Response.json(fallback, { headers: corsHeaders });
  }

  const claudeReply = await callClaude(anthropicKey, message, conversationHistory, coachData, fallback).catch((error) => {
    console.error('Claude request failed', error);
    return fallback;
  });

  return Response.json(claudeReply, { headers: corsHeaders });
});

async function callClaude(
  anthropicKey: string,
  message: string,
  conversationHistory: ConversationItem[],
  coachData: unknown,
  fallback: ReturnType<typeof buildFallbackReply>,
) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      system: [
        'You are Rituals Coach, a calm habit coach.',
        'Only reason from the provided cached 30-day summary and ritual list.',
        'Never invent streaks, rates, times, or counts.',
        'Every claim must name the specific ritual and metric behind it.',
        'If the data does not support an answer, say what data is missing.',
        'You may request actions only through the provided tools. Never say an action was already applied.',
      ].join(' '),
      tools: [
        {
          name: 'reschedule_reminder',
          description: 'Request a reminder time change after user confirmation.',
          input_schema: {
            type: 'object',
            properties: {
              ritualId: { type: 'string' },
              ritualName: { type: 'string' },
              reminderTime: { type: 'string', description: '24-hour HH:mm time' },
            },
            required: ['ritualId', 'ritualName', 'reminderTime'],
          },
        },
        {
          name: 'suggest_new_ritual',
          description: 'Suggest one tiny new ritual after user confirmation.',
          input_schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              icon: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['name', 'reason'],
          },
        },
        {
          name: 'generate_weekly_recap',
          description: 'Request a weekly recap from the provided metrics.',
          input_schema: {
            type: 'object',
            properties: {},
          },
        },
      ],
      messages: [
        ...conversationHistory.slice(-8).map((item) => ({ role: item.role, content: item.text })),
        {
          role: 'user',
          content: JSON.stringify({
            userMessage: message,
            coachData,
            responseContract: {
              returnPlainTextForChatBubble: true,
              ifUsingTool: 'Use a tool call. The app will show a one-tap confirmation before writing to Supabase.',
            },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    return fallback;
  }

  const payload = await response.json();
  const content = Array.isArray(payload.content) ? payload.content : [];
  const text = content
    .filter((item: { type: string }) => item.type === 'text')
    .map((item: { text: string }) => item.text)
    .join('\n')
    .trim();
  const suggestedActions = content
    .filter((item: { type: string }) => item.type === 'tool_use')
    .map((item: { id: string; name: string; input?: Record<string, unknown> }) => toolUseToAction(item))
    .filter(Boolean) as CoachAction[];

  return {
    text: text || fallback.text,
    insightCard: buildInsightCard(message, (coachData as { summary?: unknown }).summary) ?? fallback.insightCard,
    suggestedActions: suggestedActions.length ? suggestedActions : fallback.suggestedActions,
  };
}

function toolUseToAction(toolUse: { id: string; name: string; input?: Record<string, unknown> }): CoachAction | null {
  const input = toolUse.input ?? {};
  if (toolUse.name === 'reschedule_reminder') {
    const ritualName = typeof input.ritualName === 'string' ? input.ritualName : 'ritual';
    const reminderTime = typeof input.reminderTime === 'string' ? input.reminderTime : '19:00';
    return {
      id: toolUse.id,
      type: 'reschedule_reminder',
      label: `Move ${ritualName} reminder to ${reminderTime}`,
      payload: input,
    };
  }

  if (toolUse.name === 'suggest_new_ritual') {
    const name = typeof input.name === 'string' ? input.name : 'New ritual';
    return {
      id: toolUse.id,
      type: 'suggest_new_ritual',
      label: `Add ${name}`,
      payload: input,
    };
  }

  if (toolUse.name === 'generate_weekly_recap') {
    return {
      id: toolUse.id,
      type: 'generate_weekly_recap',
      label: 'Generate weekly recap',
      payload: input,
    };
  }

  return null;
}

function buildFallbackReply(message: string, rawSummary: unknown) {
  const rituals = getSummaryRituals(rawSummary);
  if (!rituals.length) {
    return {
      text: 'I do not have ritual metrics yet. Create and track a ritual, then I can coach from the cached 30-day summary.',
    };
  }

  const strongest = [...rituals].sort((a, b) => b.completionRate - a.completionRate)[0];
  const weakest = [...rituals].sort((a, b) => a.completionRate - b.completionRate)[0];
  const lower = message.toLowerCase();
  const broken = getRecentlyBroken(rawSummary)[0];

  if ((lower.includes('break') || lower.includes('streak')) && broken) {
    const ritual = rituals.find((item) => item.ritualId === broken.ritualId) ?? weakest;
    return {
      text: `${ritual.name} is the ritual to inspect. It had a ${broken.previousStreak}-day streak before ${broken.brokenOn}, and its 30-day completion rate is ${ritual.completionRate}%.`,
      insightCard: buildInsightCard(message, rawSummary),
      suggestedActions: [{
        id: `reschedule-${ritual.ritualId}`,
        type: 'reschedule_reminder' as const,
        label: `Move ${ritual.name} reminder to 7pm`,
        payload: { ritualId: ritual.ritualId, reminderTime: '19:00' },
      }],
    };
  }

  if (lower.includes('suggest')) {
    return {
      text: `${strongest.name} is your strongest anchor at ${strongest.completionRate}% over the cached 30-day window. Add one tiny ritual immediately after it.`,
      suggestedActions: [{
        id: 'suggest-breathing',
        type: 'suggest_new_ritual' as const,
        label: 'Add 2-minute breathing',
        payload: { name: '2-minute breathing', icon: 'B' },
      }],
    };
  }

  return {
    text: `${strongest.name} is strongest at ${strongest.completionRate}% over 30 days. ${weakest.name} is lowest at ${weakest.completionRate}%, so that is the best place to tighten the cue.`,
    insightCard: buildInsightCard(message, rawSummary),
    suggestedActions: [{
      id: 'weekly-recap',
      type: 'generate_weekly_recap' as const,
      label: 'Generate weekly recap',
    }],
  };
}

function buildInsightCard(message: string, rawSummary: unknown) {
  const rituals = getSummaryRituals(rawSummary);
  if (!rituals.length) {
    return null;
  }

  const lower = message.toLowerCase();
  const broken = getRecentlyBroken(rawSummary)[0];
  const selected = lower.includes('break') && broken
    ? rituals.find((ritual) => ritual.ritualId === broken.ritualId) ?? rituals[0]
    : [...rituals].sort((a, b) => b.completionRate - a.completionRate)[0];

  return {
    headline: `${selected.name}: ${selected.completionRate}% completion`,
    body: `${selected.name} has ${selected.completions}/${selected.totalDays} completions, a ${selected.currentStreak}-day current streak, and a ${selected.longestStreak}-day longest streak in the cached window.`,
    bars: selected.last7Days ?? [],
    metric: `${selected.completions}/${selected.totalDays} completed`,
  };
}

function getSummaryRituals(rawSummary: unknown): RitualSummary[] {
  const summary = rawSummary as { rituals?: RitualSummary[] } | null;
  return Array.isArray(summary?.rituals) ? summary.rituals : [];
}

function getRecentlyBroken(rawSummary: unknown): Array<{ ritualId: string; name: string; previousStreak: number; brokenOn: string }> {
  const summary = rawSummary as { recentlyBrokenStreaks?: Array<{ ritualId: string; name: string; previousStreak: number; brokenOn: string }> } | null;
  return Array.isArray(summary?.recentlyBrokenStreaks) ? summary.recentlyBrokenStreaks : [];
}
