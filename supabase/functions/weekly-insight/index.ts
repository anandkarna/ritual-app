import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InsightResponse = {
  summary_text: string;
  strongest_habit_id: string | null;
  weakest_habit_id: string | null;
  suggestion: string;
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ error: 'Missing Supabase environment' }, { status: 500 });
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
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weekStart = startOfWeek(new Date()).toISOString().slice(0, 10);
  const { data: cached } = await supabase
    .from('weekly_insights')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (cached) {
    return Response.json(cached);
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: habits } = await supabase.from('habits').select('id,name,frequency,reminder_time').eq('user_id', user.id).eq('is_archived', false);
  const { data: logs } = await supabase.from('habit_logs').select('habit_id,log_date,freeze_used').eq('user_id', user.id).gte('log_date', since.toISOString().slice(0, 10));

  const fallback = deriveInsight(habits ?? [], logs ?? []);
  const insight = anthropicKey ? await generateWithClaude(anthropicKey, habits ?? [], logs ?? [], fallback).catch(() => fallback) : fallback;

  const { data, error } = await supabase
    .from('weekly_insights')
    .insert({
      user_id: user.id,
      week_start: weekStart,
      summary_text: insight.summary_text,
      strongest_habit_id: insight.strongest_habit_id,
      weakest_habit_id: insight.weakest_habit_id,
      suggestion: insight.suggestion,
    })
    .select('*')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
});

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function deriveInsight(habits: Array<{ id: string; name: string }>, logs: Array<{ habit_id: string }>): InsightResponse {
  const counts = new Map<string, number>();
  logs.forEach((log) => counts.set(log.habit_id, (counts.get(log.habit_id) ?? 0) + 1));
  const sorted = [...habits].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  const strongest = sorted[0] ?? null;
  const weakest = [...sorted].reverse()[0] ?? null;

  return {
    summary_text: `${strongest?.name ?? 'Your strongest ritual'} is creating the most momentum. ${weakest?.name ?? 'One ritual'} needs a tighter cue this week.`,
    strongest_habit_id: strongest?.id ?? null,
    weakest_habit_id: weakest?.id ?? null,
    suggestion: `Stack ${weakest?.name ?? 'your weakest ritual'} immediately after ${strongest?.name ?? 'your strongest ritual'} for three days.`,
  };
}

async function generateWithClaude(
  anthropicKey: string,
  habits: unknown[],
  logs: unknown[],
  fallback: InsightResponse,
): Promise<InsightResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: 'Return only valid JSON with summary_text, strongest_habit_id, weakest_habit_id, suggestion.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ habits, logs, fallback }),
        },
      ],
    }),
  });

  if (!response.ok) {
    return fallback;
  }

  const payload = await response.json();
  const text = payload.content?.[0]?.text;
  return text ? JSON.parse(text) : fallback;
}
