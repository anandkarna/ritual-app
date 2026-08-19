import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  frequency: string | null;
  reminder_time: string | null;
};

type LogRow = {
  habit_id: string;
  log_date: string;
  completed_at: string | null;
  freeze_used: boolean | null;
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
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Missing Supabase service environment' }, { status: 500, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const end = dateToIso(new Date());
  const start = dateToIso(addDays(new Date(), -29));
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const userIds = await getTargetUsers(supabase, typeof body.userId === 'string' ? body.userId : null);
  let processed = 0;

  for (const userId of userIds) {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id,user_id,name,frequency,reminder_time')
      .eq('user_id', userId)
      .eq('is_archived', false);

    if (habitsError) {
      console.error(`habits query failed for ${userId}`, habitsError);
      continue;
    }

    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id,log_date,completed_at,freeze_used')
      .eq('user_id', userId)
      .gte('log_date', start)
      .lte('log_date', end);

    if (logsError) {
      console.error(`logs query failed for ${userId}`, logsError);
      continue;
    }

    const summary = buildSummary(habits ?? [], logs ?? [], start, end);
    const { error: upsertError } = await supabase.from('coach_summaries').upsert(
      {
        user_id: userId,
        summary_window_start: start,
        summary_window_end: end,
        summary,
      },
      { onConflict: 'user_id,summary_window_start,summary_window_end' },
    );

    if (upsertError) {
      console.error(`summary upsert failed for ${userId}`, upsertError);
      continue;
    }

    await queueAtRiskNudges(supabase, userId, summary, end);
    processed += 1;
  }

  return Response.json({ ok: true, processed, window: { start, end } }, { headers: corsHeaders });
});

async function getTargetUsers(
  supabase: ReturnType<typeof createClient>,
  requestedUserId: string | null,
) {
  if (requestedUserId) {
    return [requestedUserId];
  }

  const { data, error } = await supabase.from('habits').select('user_id').eq('is_archived', false);
  if (error) {
    throw error;
  }
  return [...new Set((data ?? []).map((row: { user_id: string }) => row.user_id).filter(Boolean))];
}

function buildSummary(habits: HabitRow[], logs: LogRow[], start: string, end: string) {
  const days = eachDay(start, end);
  const today = days[days.length - 1];
  const logsByHabit = new Map<string, LogRow[]>();

  logs
    .filter((log) => !log.freeze_used)
    .forEach((log) => {
      logsByHabit.set(log.habit_id, [...(logsByHabit.get(log.habit_id) ?? []), log]);
    });

  const rituals = habits.map((habit) => {
    const habitLogs = logsByHabit.get(habit.id) ?? [];
    const completedDates = new Set(habitLogs.map((log) => log.log_date));
    const completionRate = Math.round((completedDates.size / days.length) * 100);
    const longestStreak = calculateLongestStreak(days, completedDates);
    const currentStreak = calculateCurrentStreak(days, completedDates);
    const streakBeforeToday = calculateCurrentStreak(days.slice(0, -1), completedDates);

    return {
      ritualId: habit.id,
      name: habit.name,
      frequency: habit.frequency,
      reminderTime: habit.reminder_time,
      completionRate,
      completions: completedDates.size,
      totalDays: days.length,
      longestStreak,
      currentStreak,
      streakBeforeToday,
      completedToday: completedDates.has(today),
      dayOfWeekPattern: dayOfWeekPattern(habitLogs),
      timeOfDayDistribution: timeOfDayDistribution(habitLogs),
      last7Days: days.slice(-7).map((day) => (completedDates.has(day) ? 1 : 0)),
    };
  });

  const recentlyBrokenStreaks = rituals
    .filter((ritual) => !ritual.completedToday && ritual.streakBeforeToday >= 2)
    .map((ritual) => ({
      ritualId: ritual.ritualId,
      name: ritual.name,
      previousStreak: ritual.streakBeforeToday,
      brokenOn: today,
    }));

  return {
    generatedAt: new Date().toISOString(),
    window: { start, end, days: days.length },
    rituals,
    recentlyBrokenStreaks,
  };
}

async function queueAtRiskNudges(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  summary: ReturnType<typeof buildSummary>,
  today: string,
) {
  const atRisk = summary.rituals.filter((ritual) => !ritual.completedToday && ritual.streakBeforeToday >= 3);

  for (const ritual of atRisk) {
    const { error } = await supabase.from('coach_nudges').upsert(
      {
        user_id: userId,
        habit_id: ritual.ritualId,
        title: `${ritual.name} streak is at risk`,
        body: `${ritual.name} had a ${ritual.streakBeforeToday}-day streak before today. Ask Coach for the smallest next step.`,
        nudge_date: today,
        scheduled_for: `${today}T20:00:00.000Z`,
        deep_link_context: {
          screen: 'coach',
          prompt: `Why did I break my ${ritual.name} streak?`,
          ritualId: ritual.ritualId,
        },
      },
      { onConflict: 'user_id,habit_id,nudge_date' },
    );

    if (error) {
      console.error(`nudge upsert failed for ${userId}/${ritual.ritualId}`, error);
    }
  }
}

function calculateLongestStreak(days: string[], completedDates: Set<string>) {
  let longest = 0;
  let current = 0;
  days.forEach((day) => {
    if (completedDates.has(day)) {
      current += 1;
      longest = Math.max(longest, current);
      return;
    }
    current = 0;
  });
  return longest;
}

function calculateCurrentStreak(days: string[], completedDates: Set<string>) {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (!completedDates.has(days[index])) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function dayOfWeekPattern(logs: LogRow[]) {
  const labels = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const counts = labels.reduce<Record<string, number>>((acc, label) => {
    acc[label] = 0;
    return acc;
  }, {});

  logs.forEach((log) => {
    const day = new Date(`${log.log_date}T00:00:00.000Z`).getUTCDay();
    counts[labels[day]] = (counts[labels[day]] ?? 0) + 1;
  });

  return counts;
}

function timeOfDayDistribution(logs: LogRow[]) {
  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  logs.forEach((log) => {
    if (!log.completed_at) {
      return;
    }
    const hour = new Date(log.completed_at).getUTCHours();
    if (hour >= 5 && hour < 12) buckets.morning += 1;
    else if (hour >= 12 && hour < 17) buckets.afternoon += 1;
    else if (hour >= 17 && hour < 20) buckets.evening += 1;
    else buckets.night += 1;
  });
  return buckets;
}

function eachDay(start: string, end: string) {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);

  while (cursor <= last) {
    days.push(dateToIso(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function dateToIso(date: Date) {
  return date.toISOString().slice(0, 10);
}
