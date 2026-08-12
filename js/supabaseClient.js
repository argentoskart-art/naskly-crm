// Supabase Client SDK Initialization

const SUPABASE_URL = 'https://veaxrryzxmvngtwpwfko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYXhycnl6eG12bmd0d3B3ZmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDcxNTcsImV4cCI6MjEwMjEyMzE1N30.KcekxUbaBMMaPMR_prGfx6a3IeySu-FpM5n-bb2mcug';

// Standard Supabase v2 CDN global instance getter
function getSupabaseClient() {
  if (window._supabaseInstance) return window._supabaseInstance;
  const createFn = (window.supabase && window.supabase.createClient) || (window.Supabase && window.Supabase.createClient);
  if (typeof createFn === 'function') {
    window._supabaseInstance = createFn(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window._supabaseInstance;
  }
  return null;
}

const supabase = {
  from: (table) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase SDK لم يتم تحميله بعد في المتصفح!');
    return client.from(table);
  }
};

/**
 * Generate Next Auto ID (N001, N002, etc.)
 */
async function generateNextClientId() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let maxNum = 0;
    if (data && data.length > 0) {
      data.forEach(item => {
        if (item.id) {
          const match = String(item.id).trim().match(/^N(\d+)$/i);
          if (match) {
            maxNum = Math.max(maxNum, parseInt(match[1], 10));
          }
        }
      });
    }
    return `N${String(maxNum + 1).padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating ID:', err);
    return 'N001';
  }
}

/**
 * Fetch initial options (Team Members and Services)
 */
async function getBootstrapData() {
  let teams = ['مهند', 'إسلام', 'عمرو'];
  let services = ['المعاصر 1', 'المعاصر 2', 'باقة 800 سلايد'];

  try {
    const [teamRes, serviceRes] = await Promise.all([
      supabase.from('team_members').select('name'),
      supabase.from('services').select('name')
    ]);

    if (teamRes.data && teamRes.data.length > 0) {
      teams = teamRes.data.map(t => t.name).filter(Boolean);
    }
    
    if (serviceRes.data && serviceRes.data.length > 0) {
      services = serviceRes.data.map(s => s.name).filter(Boolean);
    }
  } catch (err) {
    console.warn('Using default employee & service lists:', err);
  }

  return {
    statuses: ['لم تبدأ بعد', 'جزئي', 'تم بالكامل'],
    sources: ['WhatsApp', 'FaceBook'],
    teams: teams,
    services: services
  };
}
