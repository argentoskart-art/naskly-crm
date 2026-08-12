// Main Data Form Logic & Supabase Integration

let selectedServices = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  await initForm();

  // Auto calculate remaining price
  document.getElementById('total_price').addEventListener('input', calculateRemaining);
  document.getElementById('paid').addEventListener('input', calculateRemaining);
  
  // Payment status change listener
  document.getElementById('payment_status').addEventListener('change', (e) => {
    if (e.target.value === 'تم بالكامل') {
      const total = parseFloat(document.getElementById('total_price').value) || 0;
      document.getElementById('paid').value = total;
      document.getElementById('remaining').value = 0;
    }
  });

  // Search Button
  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Form Submit
  document.getElementById('clientForm').addEventListener('submit', handleFormSubmit);
  
  // Reset Form
  document.getElementById('resetBtn').addEventListener('click', resetForm);
});

async function initForm() {
  const bootstrap = await getBootstrapData();

  // Populate Deal Owners & Delivery Staff
  const dealOwnerSelect = document.getElementById('deal_owner');
  const deliveryStaffSelect = document.getElementById('delivery_staff');
  
  dealOwnerSelect.innerHTML = '<option value="">اختر الموظف...</option>';
  deliveryStaffSelect.innerHTML = '<option value="">اختر الموظف...</option>';

  bootstrap.teams.forEach(member => {
    dealOwnerSelect.innerHTML += `<option value="${member}">${member}</option>`;
    deliveryStaffSelect.innerHTML += `<option value="${member}">${member}</option>`;
  });

  // Populate Services Chips
  const serviceChipsContainer = document.getElementById('serviceChips');
  serviceChipsContainer.innerHTML = '';
  bootstrap.services.forEach(service => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = service;
    chip.addEventListener('click', () => {
      if (selectedServices.has(service)) {
        selectedServices.delete(service);
        chip.classList.remove('selected');
      } else {
        selectedServices.add(service);
        chip.classList.add('selected');
      }
    });
    serviceChipsContainer.appendChild(chip);
  });

  // Generate initial Auto ID
  const nextId = await generateNextClientId();
  document.getElementById('id').value = nextId;
}

function calculateRemaining() {
  const total = parseFloat(document.getElementById('total_price').value) || 0;
  const paid = parseFloat(document.getElementById('paid').value) || 0;
  const remaining = Math.max(0, total - paid);
  document.getElementById('remaining').value = remaining.toFixed(2);
}

async function handleSearch() {
  const searchId = document.getElementById('searchInput').value.trim();
  const messageEl = document.getElementById('searchMessage');

  if (!searchId) {
    messageEl.textContent = 'يرجى إدخال الرقم التعريفي للبحث';
    messageEl.style.color = '#f59e0b';
    return;
  }

  messageEl.textContent = 'جاري البحث...';
  messageEl.style.color = '#06b6d4';

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('id', searchId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      messageEl.textContent = `لم يتم العثور على عميل بالرقم: ${searchId}`;
      messageEl.style.color = '#ef4444';
      return;
    }

    messageEl.textContent = `تم العثور على العميل: ${data.client_name}`;
    messageEl.style.color = '#10b981';

    // Populate Form with found client data
    document.getElementById('formCardTitle').textContent = `تعديل بيانات العميل (${data.id})`;
    document.getElementById('id').value = data.id;
    document.getElementById('booking_date').value = data.booking_date || '';
    document.getElementById('delivery_date').value = data.delivery_date || '';
    document.getElementById('client_name').value = data.client_name || '';
    document.getElementById('whatsapp').value = data.whatsapp || '';
    document.getElementById('source').value = data.source || 'WhatsApp';
    document.getElementById('deal_owner').value = data.deal_owner || '';
    document.getElementById('delivery_staff').value = data.delivery_staff || '';
    document.getElementById('service_specs').value = data.service_specs || '';
    document.getElementById('total_price').value = data.total_price || 0;
    document.getElementById('paid').value = data.paid || 0;
    document.getElementById('remaining').value = data.remaining || 0;
    document.getElementById('delivery_status').value = data.delivery_status || 'لم تبدأ بعد';
    document.getElementById('payment_status').value = data.payment_status || 'لم يتم استلام مبالغ';

    // Update Services Chips
    selectedServices.clear();
    const activeServices = (data.service_type || '').split(',').map(s => s.trim());
    document.querySelectorAll('#serviceChips .chip').forEach(chip => {
      if (activeServices.includes(chip.textContent)) {
        selectedServices.add(chip.textContent);
        chip.classList.add('selected');
      } else {
        chip.classList.remove('selected');
      }
    });

  } catch (err) {
    console.error('Search error:', err);
    messageEl.textContent = 'حدث خطأ أثناء البحث!';
    messageEl.style.color = '#ef4444';
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'جاري الحفظ...';

  try {
    let clientId = document.getElementById('id').value.trim();
    if (!clientId) {
      clientId = await generateNextClientId();
    }

    const payload = {
      id: clientId,
      booking_date: document.getElementById('booking_date').value || null,
      delivery_date: document.getElementById('delivery_date').value || null,
      client_name: document.getElementById('client_name').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      source: document.getElementById('source').value,
      deal_owner: document.getElementById('deal_owner').value || null,
      delivery_staff: document.getElementById('delivery_staff').value || null,
      service_type: Array.from(selectedServices).join(', '),
      service_specs: document.getElementById('service_specs').value.trim(),
      total_price: parseFloat(document.getElementById('total_price').value) || 0,
      paid: parseFloat(document.getElementById('paid').value) || 0,
      remaining: parseFloat(document.getElementById('remaining').value) || 0,
      delivery_status: document.getElementById('delivery_status').value,
      payment_status: document.getElementById('payment_status').value
    };

    const { data, error } = await supabase
      .from('clients')
      .upsert([payload], { onConflict: 'id' });

    if (error) throw error;

    alert(`تم حفظ بيانات العميل (${clientId}) بنجاح!`);
    await resetForm();

  } catch (err) {
    console.error('Save error:', err);
    alert('حدث خطأ أثناء حفظ البيانات: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'حفظ البيانات';
  }
}

async function resetForm() {
  document.getElementById('clientForm').reset();
  selectedServices.clear();
  document.querySelectorAll('#serviceChips .chip').forEach(chip => chip.classList.remove('selected'));
  document.getElementById('formCardTitle').textContent = 'إضافة / تعديل بيانات عميل';
  document.getElementById('searchMessage').textContent = '';
  document.getElementById('searchInput').value = '';
  
  const nextId = await generateNextClientId();
  document.getElementById('id').value = nextId;
}
