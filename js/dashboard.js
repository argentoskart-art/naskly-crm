// Dashboard & GridView Logic with Supabase Data Sync

let allClientsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadClientsData();

  // Filter Listeners
  document.getElementById('gridSearchInput').addEventListener('input', applyFilters);
  document.getElementById('filterDeliveryStatus').addEventListener('change', applyFilters);
  document.getElementById('filterPaymentStatus').addEventListener('change', applyFilters);
  
  // Export CSV
  document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
});

async function loadClientsData() {
  try {
    const { data, error } = await db
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allClientsData = data || [];
    renderDashboardKPIs(allClientsData);
    renderGridTable(allClientsData);

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    document.getElementById('gridTbody').innerHTML = `
      <tr>
        <td colspan="12" style="text-align: center; color: #ef4444; padding: 20px;">
          حدث خطأ أثناء تحميل البيانات من Supabase
        </td>
      </tr>
    `;
  }
}

function renderDashboardKPIs(clients) {
  let totalRevenue = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  clients.forEach(c => {
    totalRevenue += parseFloat(c.total_price) || 0;
    totalPaid += parseFloat(c.paid) || 0;
    totalRemaining += parseFloat(c.remaining) || 0;
  });

  const sessionUserJson = sessionStorage.getItem('naskly_auth_user');
  let isAdmin = false;
  try {
    if (sessionUserJson) {
      const user = JSON.parse(sessionUserJson);
      isAdmin = (user.role === 'admin');
    }
  } catch (e) {}

  document.getElementById('kpiTotalClients').textContent = clients.length;
  
  const revenueCard = document.getElementById('kpiTotalRevenue')?.closest('.kpi-card');
  const paidCard = document.getElementById('kpiTotalPaid')?.closest('.kpi-card');
  const remainingCard = document.getElementById('kpiTotalRemaining')?.closest('.kpi-card');

  if (isAdmin) {
    if (revenueCard) revenueCard.style.display = 'block';
    if (paidCard) paidCard.style.display = 'block';
    if (remainingCard) remainingCard.style.display = 'block';
    document.getElementById('kpiTotalRevenue').textContent = `${Math.round(totalRevenue).toLocaleString()} ج.م`;
    document.getElementById('kpiTotalPaid').textContent = `${Math.round(totalPaid).toLocaleString()} ج.م`;
    document.getElementById('kpiTotalRemaining').textContent = `${Math.round(totalRemaining).toLocaleString()} ج.م`;
  } else {
    if (revenueCard) revenueCard.style.display = 'none';
    if (paidCard) paidCard.style.display = 'none';
    if (remainingCard) remainingCard.style.display = 'none';
  }
}

function renderGridTable(clients) {
  const tbody = document.getElementById('gridTbody');
  
  if (!clients || clients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد بيانات متاحة</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clients.map(client => {
    const whatsappClean = (client.whatsapp || '').replace(/[^0-9]/g, '');
    const whatsappLink = whatsappClean ? `https://wa.me/${whatsappClean.startsWith('0') ? '2' + whatsappClean : whatsappClean}` : '#';

    let delBadge = 'badge-pending';
    if (client.delivery_status === 'جزئي') delBadge = 'badge-partial';
    if (client.delivery_status === 'تم بالكامل') delBadge = 'badge-success';

    let payBadge = 'badge-pending';
    if (client.payment_status === 'جزئي') payBadge = 'badge-partial';
    if (client.payment_status === 'تم بالكامل') payBadge = 'badge-success';

    return `
      <tr>
        <td><strong>${client.id || ''}</strong></td>
        <td>${client.client_name || ''}</td>
        <td>
          <a href="${whatsappLink}" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">
            ${client.whatsapp || ''} 📲
          </a>
        </td>
        <td>${client.deal_owner || '-'}</td>
        <td>${client.service_type || '-'}</td>
        <td>${client.delivery_date || '-'}</td>
        <td>${(parseFloat(client.total_price) || 0).toLocaleString()}</td>
        <td>${(parseFloat(client.paid) || 0).toLocaleString()}</td>
        <td style="color: ${(parseFloat(client.remaining) || 0) > 0 ? '#ef4444' : 'inherit'};">
          ${(parseFloat(client.remaining) || 0).toLocaleString()}
        </td>
        <td><span class="badge ${delBadge}">${client.delivery_status || 'لم تبدأ بعد'}</span></td>
        <td><span class="badge ${payBadge}">${client.payment_status || 'لم يتم استلام مبالغ'}</span></td>
        <td>
          <a href="index.html?id=${client.id}" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;">تعديل</a>
          <button onclick="deleteClient('${client.id}', '${(client.client_name || '').replace(/'/g, "\\'")}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;">حذف</button>
        </td>
      </tr>
    `;
  }).join('');
}

function applyFilters() {
  const searchVal = document.getElementById('gridSearchInput').value.toLowerCase().trim();
  const delVal = document.getElementById('filterDeliveryStatus').value;
  const payVal = document.getElementById('filterPaymentStatus').value;

  const filtered = allClientsData.filter(item => {
    const matchesSearch = !searchVal || 
      (item.id && item.id.toLowerCase().includes(searchVal)) ||
      (item.client_name && item.client_name.toLowerCase().includes(searchVal)) ||
      (item.whatsapp && item.whatsapp.toLowerCase().includes(searchVal));

    const matchesDel = !delVal || item.delivery_status === delVal;
    const matchesPay = !payVal || item.payment_status === payVal;

    return matchesSearch && matchesDel && matchesPay;
  });

  renderGridTable(filtered);
}

function exportToCsv() {
  if (!allClientsData.length) return alert('لا توجد بيانات للتصدير!');

  const headers = ['ID', 'Client Name', 'WhatsApp', 'Deal Owner', 'Service', 'Delivery Date', 'Total Price', 'Paid', 'Remaining', 'Delivery Status', 'Payment Status'];
  
  const rows = allClientsData.map(c => [
    c.id || '',
    `"${(c.client_name || '').replace(/"/g, '""')}"`,
    `"${c.whatsapp || ''}"`,
    `"${c.deal_owner || ''}"`,
    `"${(c.service_type || '').replace(/"/g, '""')}"`,
    c.delivery_date || '',
    c.total_price || 0,
    c.paid || 0,
    c.remaining || 0,
    `"${c.delivery_status || ''}"`,
    `"${c.payment_status || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CRM_Clients_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function deleteClient(id, name) {
  if (!confirm(`هل أنت تأكد من حذف بيانات العميل (${name} - ${id})؟`)) return;

  try {
    const { error } = await db.from('clients').delete().eq('id', id);
    if (error) throw error;
    alert(`تم حذف العميل (${id}) بنجاح.`);
    await loadClientsData();
  } catch (err) {
    alert('حدث خطأ أثناء حذف العميل: ' + err.message);
  }
}
