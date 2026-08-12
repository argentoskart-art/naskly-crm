// Team & Services Management Logic

document.addEventListener('DOMContentLoaded', () => {
  loadTeamMembers();
  loadServices();

  document.getElementById('addTeamBtn').addEventListener('click', handleAddTeam);
  document.getElementById('addServiceBtn').addEventListener('click', handleAddService);
});

// --- Team Management ---
async function loadTeamMembers() {
  const tbody = document.getElementById('teamTbody');
  try {
    const { data, error } = await db
      .from('team_members')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--palette-ice-muted); padding:15px;">لا يوجد موظفين حالياً</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>
          <button onclick="editTeamMember(${item.id}, '${item.name.replace(/'/g, "\\'")}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;">تعديل</button>
          <button onclick="deleteTeamMember(${item.id}, '${item.name.replace(/'/g, "\\'")}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;">حذف</button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading team:', err);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#ef4444;">خطأ أثناء جلب الموظفين</td></tr>`;
  }
}

async function handleAddTeam() {
  const input = document.getElementById('teamInput');
  const name = input.value.trim();
  if (!name) return alert('يرجى كتابة اسم الموظف');

  try {
    const { error } = await db.from('team_members').insert([{ name }]);
    if (error) throw error;
    input.value = '';
    loadTeamMembers();
  } catch (err) {
    alert('حدث خطأ أثناء الإضافة: ' + err.message);
  }
}

async function editTeamMember(id, oldName) {
  const newName = prompt('تعديل اسم الموظف:', oldName);
  if (!newName || newName.trim() === oldName) return;

  try {
    const { error } = await db
      .from('team_members')
      .update({ name: newName.trim() })
      .eq('id', id);

    if (error) throw error;
    loadTeamMembers();
  } catch (err) {
    alert('حدث خطأ أثناء التعديل: ' + err.message);
  }
}

async function deleteTeamMember(id, name) {
  if (!confirm(`هل أنت تأكد من حذف الموظف (${name})؟`)) return;

  try {
    const { error } = await db.from('team_members').delete().eq('id', id);
    if (error) throw error;
    loadTeamMembers();
  } catch (err) {
    alert('حدث خطأ أثناء الحذف: ' + err.message);
  }
}


// --- Services Management ---
async function loadServices() {
  const tbody = document.getElementById('servicesTbody');
  try {
    const { data, error } = await db
      .from('services')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--palette-ice-muted); padding:15px;">لا توجد خدمات حالياً</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td>${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td>
          <button onclick="editService(${item.id}, '${item.name.replace(/'/g, "\\'")}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;">تعديل</button>
          <button onclick="deleteService(${item.id}, '${item.name.replace(/'/g, "\\'")}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;">حذف</button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading services:', err);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#ef4444;">خطأ أثناء جلب الخدمات</td></tr>`;
  }
}

async function handleAddService() {
  const input = document.getElementById('serviceInput');
  const name = input.value.trim();
  if (!name) return alert('يرجى كتابة اسم الخدمة');

  try {
    const { error } = await db.from('services').insert([{ name }]);
    if (error) throw error;
    input.value = '';
    loadServices();
  } catch (err) {
    alert('حدث خطأ أثناء الإضافة: ' + err.message);
  }
}

async function editService(id, oldName) {
  const newName = prompt('تعديل اسم الخدمة:', oldName);
  if (!newName || newName.trim() === oldName) return;

  try {
    const { error } = await db
      .from('services')
      .update({ name: newName.trim() })
      .eq('id', id);

    if (error) throw error;
    loadServices();
  } catch (err) {
    alert('حدث خطأ أثناء التعديل: ' + err.message);
  }
}

async function deleteService(id, name) {
  if (!confirm(`هل أنت تأكد من حذف الخدمة (${name})؟`)) return;

  try {
    const { error } = await db.from('services').delete().eq('id', id);
    if (error) throw error;
    loadServices();
  } catch (err) {
    alert('حدث خطأ أثناء الحذف: ' + err.message);
  }
}

// --- Email Reminder Settings ---
document.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('reminder_recipient_email') || 'nsqlycorp@gmail.com';
  const emailInput = document.getElementById('reminderEmailInput');
  if (emailInput) emailInput.value = savedEmail;

  const saveEmailBtn = document.getElementById('saveEmailBtn');
  if (saveEmailBtn) {
    saveEmailBtn.addEventListener('click', () => {
      const email = document.getElementById('reminderEmailInput').value.trim();
      if (!email) return alert('يرجى كتابة البريد الإلكتروني');
      localStorage.setItem('reminder_recipient_email', email);
      alert('تم حفظ بريد الإشعارات بنجاح!');
    });
  }

  const sendEmailNowBtn = document.getElementById('sendEmailNowBtn');
  if (sendEmailNowBtn) {
    sendEmailNowBtn.addEventListener('click', handleSendReminderEmailNow);
  }
});

async function handleSendReminderEmailNow() {
  const statusMsg = document.getElementById('emailStatusMsg');
  const targetEmail = localStorage.getItem('reminder_recipient_email') || 'nsqlycorp@gmail.com';
  
  statusMsg.style.color = '#F7C01B';
  statusMsg.textContent = 'جاري التجميع وتجهيز إيميل التذكير...';

  try {
    const { data: clients, error } = await db
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter for tomorrow's delivery date and open status
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const openStatuses = ['لم تبدأ بعد', 'جزئي'];
    const matchingRows = (clients || []).filter(c => {
      return c.delivery_date === tomorrowStr && openStatuses.includes(c.delivery_status);
    });

    // Open Gmail web application directly with prefilled body and target recipient
    const subject = encodeURIComponent('تنويه: عملاء موعد تسليمهم غدا - Naskly CRM');
    
    let reportText = `تنويه: هذه قائمة بالعملاء ميعاد تسليمهم غدا (${tomorrowStr}) وحالتهم مازالت مفتوحة:\n\n`;
    if (matchingRows.length === 0) {
      reportText += 'لا يوجد عملاء يستحقون التذكير غداً.\n';
    } else {
      matchingRows.forEach((item, idx) => {
        reportText += `${idx + 1}. ID: ${item.id} | العميل: ${item.client_name} | الواتساب: ${item.whatsapp} | الحالة: ${item.delivery_status} | المتبقي: ${item.remaining} ج.م\n`;
      });
    }

    reportText += '\nتنويه: هذه قائمة بالعملاء ميعاد تسليمهم غدا وحالتهم مازالت مفتوحة يرجى اتخاذ اللازم.';

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${subject}&body=${encodeURIComponent(reportText)}`;
    window.open(gmailComposeUrl, '_blank');

    statusMsg.style.color = '#4ade80';
    statusMsg.textContent = `تم فتح Gmail وإعداد إيميل التذكير لـ (${matchingRows.length}) عملاء بنجاح!`;

  } catch (err) {
    console.error('Email error:', err);
    statusMsg.style.color = '#ef4444';
    statusMsg.textContent = 'حدث خطأ أثناء إعداد الإشعار!';
  }
}
