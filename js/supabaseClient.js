// Supabase Client SDK Initialization

const SUPABASE_URL = 'https://veaxrryzxmvngtwpwfko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYXhycnl6eG12bmd0d3B3ZmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDcxNTcsImV4cCI6MjEwMjEyMzE1N30.KcekxUbaBMMaPMR_prGfx6a3IeySu-FpM5n-bb2mcug';

// Create Supabase Client instance from CDN SDK
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  try {
    const [teamRes, serviceRes] = await Promise.all([
      supabase.from('team_members').select('name'),
      supabase.from('services').select('name')
    ]);

    let teams = (teamRes.data || []).map(t => t.name);
    let services = (serviceRes.data || []).map(s => s.name);

    // Fallback to local JSON files if database tables are empty
    if (!teams.length) {
      const jsonRes = await fetch('data/employees.json').then(r => r.json()).catch(() => []);
      teams = jsonRes.map(e => e.name);
    }

    if (!services.length) {
      const jsonRes = await fetch('data/services.json').then(r => r.json()).catch(() => []);
      services = jsonRes.map(s => s.name);
    }

    return {
      statuses: ['لم تبدأ بعد', 'جزئي', 'تم بالكامل'],
      sources: ['WhatsApp', 'FaceBook'],
      teams: teams.length ? teams : ['مهند', 'إسلام', 'عمرو'],
      services: services.length ? services : ['المعاصر 1', 'المعاصر 2', 'باقة 800 سلايد']
    };
  } catch (err) {
    console.error('Error fetching bootstrap data:', err);
    return {
      statuses: ['لم تبدأ بعد', 'جزئي', 'تم بالكامل'],
      sources: ['WhatsApp', 'FaceBook'],
      teams: ['مهند', 'إسلام', 'عمرو'],
      services: ['المعاصر 1', 'المعاصر 2', 'باقة 800 سلايد']
    };
  }
}
