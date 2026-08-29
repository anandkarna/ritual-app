import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  const apiKey = Deno.env.get('NVIDIA_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ error: 'Missing Supabase environment' }, { status: 500, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const ritual = body?.ritual ?? {};
  const reason = typeof body?.reason === 'string' ? body.reason : '';
  const tone = body?.tone === 'coach' || body?.tone === 'direct' || body?.tone === 'gentle' ? body.tone : 'gentle';
  const hasPattern = Boolean(body?.hasPattern);

  const fallback = localFloCheckinReply({
    name: typeof ritual.name === 'string' ? ritual.name : 'your ritual',
    reminderTime: typeof ritual.reminderTime === 'string' ? ritual.reminderTime : null,
    why: typeof ritual.why === 'string' ? ritual.why : '',
  }, reason, tone, hasPattern);

  if (!apiKey) {
    return Response.json(fallback, { headers: corsHeaders });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k3',
        max_tokens: 600,
        temperature: 0.7,
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'You are Flo, the companion inside a ritual habit app. A user missed a scheduled ritual and gave a reason. Respond briefly in 2-4 sentences, warm and curious, never a scold. Return strict JSON with message, category, protect_streak, suggested_action. Category must be aligned_tradeoff, circumstantial, drift, or pattern.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              ritual_name: ritual.name,
              scheduled_window: ritual.reminderTime ?? 'unscheduled',
              ritual_why: ritual.why ?? '',
              user_reason: reason,
              recent_pattern: hasPattern ? 'This is the 3rd+ similar miss this week.' : undefined,
              tone_setting: tone,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json(fallback, { headers: corsHeaders });
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    const parsed = typeof content === 'string'
      ? JSON.parse(content.replace(/^```json\s*|\s*```$/g, ''))
      : null;

    if (
      parsed
      && typeof parsed.message === 'string'
      && ['aligned_tradeoff', 'circumstantial', 'drift', 'pattern'].includes(parsed.category)
      && typeof parsed.protect_streak === 'boolean'
    ) {
      return Response.json({
        message: parsed.message,
        category: parsed.category,
        protect_streak: parsed.protect_streak,
        suggested_action: typeof parsed.suggested_action === 'string' ? parsed.suggested_action : null,
      }, { headers: corsHeaders });
    }
  } catch {
    // fall back below
  }

  return Response.json(fallback, { headers: corsHeaders });
});

function localFloCheckinReply(
  ritual: { name: string; reminderTime?: string | null; why?: string },
  reason: string,
  tone: 'coach' | 'direct' | 'gentle',
  hasPattern: boolean,
) {
  const lower = reason.toLowerCase();
  const aligned = /chose|family|friend|rest|sleep|work|study|health|needed/i.test(lower) && Boolean(ritual.why);
  const circumstantial = /came up|traffic|sick|ill|urgent|emergency|late|travel|meeting/i.test(lower);
  const category = hasPattern ? 'pattern' : aligned ? 'aligned_tradeoff' : circumstantial ? 'circumstantial' : 'drift';
  const protect = category === 'aligned_tradeoff' || category === 'circumstantial';
  const suggestedAction = category === 'drift' || category === 'pattern'
    ? tone === 'coach' && ritual.reminderTime ? 'Move to mornings?' : 'Make it smaller tomorrow?'
    : null;
  const whyLine = ritual.why ? ` You started this because it ${ritual.why.replace(/\.$/, '')}.` : '';
  const toneLine = tone === 'direct'
    ? ' Be honest about whether this was a real tradeoff or just drift.'
    : tone === 'coach'
      ? ' Let us make the next version easier to start.'
      : ' That is useful information, not a failure.';
  const patternLine = hasPattern ? ' This same reason has shown up a few times this week, so it may be a pattern worth adjusting.' : '';

  return {
    message: `Thanks for naming it.${whyLine}${patternLine}${toneLine}`,
    category,
    protect_streak: protect,
    suggested_action: suggestedAction,
  };
}
