// Supabase Client SDK Initialization

const SUPABASE_URL = 'https://veaxrryzxmvngtwpwfko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYXhycnl6eG12bmd0d3B3ZmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDcxNTcsImV4cCI6MjEwMjEyMzE1N30.KcekxUbaBMMaPMR_prGfx6a3IeySu-FpM5n-bb2mcug';

let dbClient = null;

function getDb() {
  if (!dbClient) {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }
  return dbClient;
}

// Global accessor object named db
var db = {
  from: function(table) {
    const client = getDb();
    if (!client) throw new Error('Supabase client failed to connect');
    return client.from(table);
  }
};

/**
 * Generate Next Auto ID (N001, N002, etc.)
 */
async function generateNextClientId() {
  try {
    const { data, error } = await db
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
      db.from('team_members').select('name'),
      db.from('services').select('name')
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

/**
 * Universal Global Notification Bell & Modal System
 */
document.addEventListener('DOMContentLoaded', () => {
  initNotificationBell();
});

async function initNotificationBell() {
  const bellBtn = document.getElementById('reminderBellBtn');
  const modal = document.getElementById('reminderModal');
  const closeBtn = document.getElementById('closeReminderModal');

  if (!bellBtn || !modal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  bellBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  // Fetch reminders due tomorrow with open statuses
  try {
    const { data: clients, error } = await db
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const openStatuses = ['لم تبدأ بعد', 'جزئي'];
    const matchingRows = (clients || []).filter(c => {
      return c.delivery_date && c.delivery_date <= tomorrowStr && openStatuses.includes(c.delivery_status);
    });

    // Sort by delivery_date ascending (oldest/overdue first)
    matchingRows.sort((a, b) => (a.delivery_date || '').localeCompare(b.delivery_date || ''));

    const badge = document.getElementById('bellBadgeCount');
    const tbody = document.getElementById('reminderModalTbody');

    if (matchingRows.length > 0) {
      if (badge) {
        badge.textContent = matchingRows.length;
        badge.style.display = 'inline-block';
      }

      if (tbody) {
        tbody.innerHTML = matchingRows.map(client => {
          const whatsappClean = (client.whatsapp || '').replace(/[^0-9]/g, '');
          const whatsappLink = whatsappClean ? `https://wa.me/${whatsappClean.startsWith('0') ? '2' + whatsappClean : whatsappClean}` : '#';

          let pendingServicesList = [];
          if (Array.isArray(client.service_items) && client.service_items.length > 0) {
            pendingServicesList = client.service_items
              .filter(item => item.delivery_status === 'متسلمش')
              .map(item => item.name || item.service);
          } else {
            const rawSpecs = String(client.service_specs || '');
            const markerIndex = rawSpecs.lastIndexOf('\n\n[NASKLY_SERVICE_ITEMS]\n');
            if (markerIndex !== -1) {
              try {
                const parsed = JSON.parse(rawSpecs.slice(markerIndex + 26).trim());
                if (Array.isArray(parsed)) {
                  pendingServicesList = parsed
                    .filter(item => item.delivery_status === 'متسلمش')
                    .map(item => item.name || item.service);
                }
              } catch (e) {}
            }
          }

          if (pendingServicesList.length === 0 && client.delivery_status !== 'تم بالكامل') {
            const fallbackName = client.service_type || 'جميع الخدمات';
            pendingServicesList = [fallbackName];
          }

          const pendingHtml = pendingServicesList.length > 0
            ? pendingServicesList.map(s => `<span class="badge" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; font-size: 0.75rem; margin: 2px;">${s}</span>`).join(' ')
            : '<span style="color: #10b981; font-size: 0.8rem;">كل الخدمات مستلمة</span>';

          return `
            <tr>
              <td><strong>${client.id || ''}</strong></td>
              <td>${client.client_name || ''}</td>
              <td>${client.delivery_date || '-'}</td>
              <td><span class="badge badge-pending">${client.delivery_status || ''}</span></td>
              <td>${pendingHtml}</td>
              <td>
                <a href="${whatsappLink}" target="_blank" style="color: var(--palette-gold); text-decoration: none;">
                  ${client.whatsapp || ''} 📲
                </a>
              </td>
              <td style="color: #ef4444; font-weight: bold;">${Math.round(parseFloat(client.remaining) || 0).toLocaleString()} ج.م</td>
            </tr>
          `;
        }).join('');
      }

      // Auto popup once if not seen today
      const todayKey = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem('naskly_seen_reminder_date') !== todayKey) {
        modal.style.display = 'flex';
        localStorage.setItem('naskly_seen_reminder_date', todayKey);
      }

    } else {
      if (badge) badge.style.display = 'none';
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:15px; color:var(--palette-ice-muted);">
              🎉 لا يوجد عملاء مستحق تسليمهم حالياً.
            </td>
          </tr>
        `;
      }
    }

  } catch (err) {
    console.warn('Error loading bell notifications:', err);
  }
}
