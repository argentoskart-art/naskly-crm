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
