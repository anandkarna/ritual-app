const { createClient } = require('@supabase/supabase-js');

const DEFAULT_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 3650;

function readRetentionDays() {
  const parsed = Number.parseInt(process.env.ACTIVITY_RETENTION_DAYS || '', 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_RETENTION_DAYS;
  }
  return Math.min(Math.max(parsed, 1), MAX_RETENTION_DAYS);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL
    || process.env.EXPO_PUBLIC_SUPABASE_URL
    || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Missing server configuration' });
  }

  const retentionDays = readRetentionDays();
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.rpc('cleanup_old_activity', {
    retention_days: retentionDays,
  });

  if (error) {
    console.error('Activity cleanup failed', {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return res.status(500).json({ ok: false, error: 'Cleanup failed' });
  }

  const summary = Array.isArray(data) && data[0] ? data[0] : {};
  return res.status(200).json({
    ok: true,
    retentionDays,
    cutoffDate: summary.cutoff_date ?? null,
    deletedCount: summary.deleted_count ?? 0,
    aggregatedMonths: summary.aggregated_months ?? 0,
  });
};
