// Main Data Form Logic & Supabase Integration

let serviceItems = [];
let availableServicesList = [];

const SERVICE_ITEMS_MARKER = '\n\n[NASKLY_SERVICE_ITEMS]\n';
const SERVICE_DELIVERY_STATUSES = ['استلم', 'متسلمش'];

function toNonNegativeNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function roundMoney(value) {
  return Math.round((toNonNegativeNumber(value) + Number.EPSILON) * 100) / 100;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createServiceItem(name, values = {}) {
  const price = roundMoney(values.price);
  const paid = Math.min(roundMoney(values.paid), price);
  const deliveryStatus = values.delivery_status === 'استلم' ? 'استلم' : 'متسلمش';

  return {
    name: String(name || '').trim(),
    price,
    delivery_status: deliveryStatus,
    paid,
    remaining: roundMoney(Math.max(0, price - paid))
  };
}

function getPaymentStatus(total, paid) {
  if (total <= 0 || paid <= 0) return 'لم يتم استلام مبالغ';
  if (paid >= total) return 'تم بالكامل';
  return 'جزئي';
}

function getOverallDeliveryStatus(items) {
  if (!items.length) return 'لم تبدأ بعد';

  const receivedCount = items.filter(item => item.delivery_status === 'استلم').length;
  if (receivedCount === items.length) return 'تم بالكامل';
  if (receivedCount > 0) return 'جزئي';
  return 'لم تبدأ بعد';
}

function calculateServiceTotals(items = serviceItems) {
  const totals = items.reduce((result, item) => {
    const price = roundMoney(item.price);
    const paid = Math.min(roundMoney(item.paid), price);
    const remaining = roundMoney(Math.max(0, price - paid));

    item.price = price;
    item.paid = paid;
    item.remaining = remaining;

    result.total += price;
    result.paid += paid;
    result.remaining += remaining;
    return result;
  }, { total: 0, paid: 0, remaining: 0 });

  totals.total = roundMoney(totals.total);
  totals.paid = roundMoney(totals.paid);
  totals.remaining = roundMoney(totals.remaining);
  totals.paymentStatus = getPaymentStatus(totals.total, totals.paid);
  totals.deliveryStatus = getOverallDeliveryStatus(items);
  return totals;
}

function formatMoney(value) {
  return `${roundMoney(value).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
}

function decodeLegacyServiceSpecs(rawValue) {
  const raw = String(rawValue || '');
  const markerIndex = raw.lastIndexOf(SERVICE_ITEMS_MARKER);

  if (markerIndex === -1) {
    return { notes: raw, items: null };
  }

  const notes = raw.slice(0, markerIndex).trim();
  const serializedItems = raw.slice(markerIndex + SERVICE_ITEMS_MARKER.length).trim();

  try {
    const parsedItems = JSON.parse(serializedItems);
    if (Array.isArray(parsedItems)) {
      return { notes, items: parsedItems };
    }
  } catch (err) {
    console.warn('Could not parse legacy service breakdown:', err);
  }

  return { notes: raw, items: null };
}

function encodeLegacyServiceSpecs(notes, items) {
  const cleanNotes = String(notes || '').trim();
  return `${cleanNotes}${SERVICE_ITEMS_MARKER}${JSON.stringify(items)}`;
}

function normalizeServiceItems(client, decodedSpecs = decodeLegacyServiceSpecs(client.service_specs)) {
  if (Array.isArray(client.service_items) && client.service_items.length > 0) {
    return client.service_items
      .map(item => createServiceItem(item.name || item.service, item))
      .filter(item => item.name);
  }

  if (Array.isArray(decodedSpecs.items) && decodedSpecs.items.length > 0) {
    return decodedSpecs.items
      .map(item => createServiceItem(item.name || item.service, item))
      .filter(item => item.name);
  }

  const legacyName = String(client.service_type || '').trim();
  const hasLegacyAmounts = toNonNegativeNumber(client.total_price) > 0 || toNonNegativeNumber(client.paid) > 0 || toNonNegativeNumber(client.remaining) > 0;

  if (!legacyName && !hasLegacyAmounts) return [];

  return [createServiceItem(legacyName || 'خدمة سابقة', {
    price: client.total_price,
    paid: client.paid,
    delivery_status: client.delivery_status === 'تم بالكامل' ? 'استلم' : 'متسلمش'
  })];
}

function updateServiceRowVisual(index) {
  const row = document.querySelector(`[data-service-row="${index}"]`);
  const item = serviceItems[index];
  if (!row || !item) return;

  const priceInput = row.querySelector('[data-service-field="price"]');
  const paidInput = row.querySelector('[data-service-field="paid"]');
  const remainingInput = row.querySelector('[data-service-field="remaining"]');
  const statusText = row.querySelector('[data-service-status-text]');
  const statusDot = row.querySelector('[data-service-status-dot]');

  if (priceInput) priceInput.value = Math.round(item.price);
  if (paidInput) paidInput.value = Math.round(item.paid);
  if (remainingInput) remainingInput.value = Math.round(item.remaining);
  if (statusText) statusText.textContent = item.delivery_status;
  if (statusDot) {
    statusDot.className = `service-status-dot ${item.delivery_status === 'استلم' ? 'is-received' : 'is-pending'}`;
  }
}

function handleServiceFieldChange(event) {
  const index = Number(event.target.dataset.serviceIndex);
  const field = event.target.dataset.serviceField;
  const item = serviceItems[index];
  if (!item || !field) return;

  if (field === 'delivery_status') {
    item.delivery_status = SERVICE_DELIVERY_STATUSES.includes(event.target.value) ? event.target.value : 'متسلمش';
  } else {
    item[field] = toNonNegativeNumber(event.target.value);
  }

  calculateServiceTotals();
  updateServiceRowVisual(index);
  updatePaymentSummary();
}

function removeServiceItem(index) {
  serviceItems.splice(index, 1);
  renderServiceItems();
  updatePaymentSummary();
}

function updatePaymentSummary() {
  const totals = calculateServiceTotals();
  const totalInput = document.getElementById('total_price');
  const paidInput = document.getElementById('paid');
  const remainingInput = document.getElementById('remaining');
  const paymentStatus = document.getElementById('payment_status');
  const deliveryStatus = document.getElementById('delivery_status');

  if (totalInput) totalInput.value = Math.round(totals.total);
  if (paidInput) paidInput.value = Math.round(totals.paid);
  if (remainingInput) remainingInput.value = Math.round(totals.remaining);
  if (paymentStatus) paymentStatus.value = totals.paymentStatus;
  if (deliveryStatus) deliveryStatus.value = totals.deliveryStatus;

  const summaryTotal = document.getElementById('serviceSummaryTotal');
  const summaryPaid = document.getElementById('serviceSummaryPaid');
  const summaryRemaining = document.getElementById('serviceSummaryRemaining');
  const summaryCount = document.getElementById('serviceSummaryCount');

  if (summaryTotal) summaryTotal.textContent = formatMoney(totals.total);
  if (summaryPaid) summaryPaid.textContent = formatMoney(totals.paid);
  if (summaryRemaining) summaryRemaining.textContent = formatMoney(totals.remaining);
  if (summaryCount) summaryCount.textContent = `${serviceItems.length} خدمة`;
}

function renderServiceItems() {
  const container = document.getElementById('serviceItemsContainer');
  if (!container) return;

  if (serviceItems.length === 0) {
    container.innerHTML = '<div class="service-breakdown-empty">لم تتم إضافة خدمات بعد. ابحث عن خدمة بالأعلى لإضافتها.</div>';
    updatePaymentSummary();
    return;
  }

  container.innerHTML = serviceItems.map((item, index) => `
    <div class="service-breakdown-row" data-service-row="${index}">
      <div class="service-breakdown-heading">
        <div class="service-breakdown-name">
          <span class="service-status-dot ${item.delivery_status === 'استلم' ? 'is-received' : 'is-pending'}" data-service-status-dot></span>
          <strong>${escapeHtml(item.name)}</strong>
          <span class="service-status-text" data-service-status-text>${escapeHtml(item.delivery_status)}</span>
        </div>
        <button type="button" class="service-remove-btn" data-remove-service="${index}" title="إزالة الخدمة">&times;</button>
      </div>
      <div class="service-breakdown-fields">
        <label class="service-breakdown-field">
          <span>السعر</span>
          <input type="number" class="form-control" min="0" step="1" value="${Math.round(item.price)}" data-service-index="${index}" data-service-field="price">
        </label>
        <label class="service-breakdown-field">
          <span>التسليم</span>
          <select class="form-control" data-service-index="${index}" data-service-field="delivery_status">
            <option value="استلم" ${item.delivery_status === 'استلم' ? 'selected' : ''}>استلم</option>
            <option value="متسلمش" ${item.delivery_status === 'متسلمش' ? 'selected' : ''}>متسلمش</option>
          </select>
        </label>
        <label class="service-breakdown-field">
          <span>المدفوع</span>
          <input type="number" class="form-control" min="0" step="1" value="${Math.round(item.paid)}" data-service-index="${index}" data-service-field="paid">
        </label>
        <label class="service-breakdown-field">
          <span>المتبقي</span>
          <input type="number" class="form-control" value="${Math.round(item.remaining)}" data-service-field="remaining" readonly>
        </label>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-service-field="price"], [data-service-field="paid"]').forEach(input => {
    input.addEventListener('input', handleServiceFieldChange);
    input.addEventListener('focus', function () {
      if (this.value === '0' || this.value === '0.00') {
        this.value = '';
      } else {
        this.select();
      }
    });
    input.addEventListener('blur', function () {
      if (this.value.trim() === '') {
        this.value = '0';
        handleServiceFieldChange({ target: this });
      }
    });
  });
  container.querySelectorAll('[data-service-field="delivery_status"]').forEach(select => {
    select.addEventListener('change', handleServiceFieldChange);
  });
  container.querySelectorAll('[data-remove-service]').forEach(button => {
    button.addEventListener('click', () => removeServiceItem(Number(button.dataset.removeService)));
  });

  updatePaymentSummary();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initForm();

  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  document.getElementById('searchInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleSearch();
  });

  document.getElementById('clientForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('resetBtn').addEventListener('click', resetForm);

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');
  if (editId) {
    document.getElementById('searchInput').value = editId;
    await handleSearch();
  }
});

async function initForm() {
  const bootstrap = await getBootstrapData();

  const dealOwnerSelect = document.getElementById('deal_owner');
  const deliveryStaffSelect = document.getElementById('delivery_staff');

  dealOwnerSelect.innerHTML = '<option value="">اختر الموظف...</option>';
  deliveryStaffSelect.innerHTML = '<option value="">اختر الموظف...</option>';

  bootstrap.teams.forEach(member => {
    const safeMember = escapeHtml(member);
    dealOwnerSelect.innerHTML += `<option value="${safeMember}">${safeMember}</option>`;
    deliveryStaffSelect.innerHTML += `<option value="${safeMember}">${safeMember}</option>`;
  });

  setupSearchableServiceInput(bootstrap.services);
  renderServiceItems();

  const nextId = await generateNextClientId();
  document.getElementById('id').value = nextId;
}

function setupSearchableServiceInput(servicesList) {
  availableServicesList = servicesList || ['المعاصر 1', 'المعاصر 2', 'باقة 800 سلايد'];

  const searchInput = document.getElementById('serviceSearchInput');
  const dropdown = document.getElementById('serviceDropdown');

  searchInput.addEventListener('input', (event) => {
    renderDropdown(event.target.value.trim().toLowerCase());
  });

  searchInput.addEventListener('focus', () => {
    renderDropdown(searchInput.value.trim().toLowerCase());
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.multi-search-container')) {
      dropdown.style.display = 'none';
    }
  });
}

function renderDropdown(query) {
  const dropdown = document.getElementById('serviceDropdown');
  const searchInput = document.getElementById('serviceSearchInput');
  dropdown.innerHTML = '';

  const filtered = availableServicesList.filter(service => {
    return service.toLowerCase().includes(query) && !serviceItems.some(item => item.name === service);
  });

  if (filtered.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  filtered.forEach(service => {
    const item = document.createElement('div');
    item.className = 'search-dropdown-item';
    item.textContent = service;
    item.addEventListener('click', () => {
      serviceItems.push(createServiceItem(service));
      searchInput.value = '';
      dropdown.style.display = 'none';
      renderServiceItems();
    });
    dropdown.appendChild(item);
  });

  dropdown.style.display = 'block';
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
    const { data, error } = await db
      .from('clients')
      .select('*')
      .eq('id', searchId);

    if (error) throw error;

    const foundClient = (data && data.length > 0) ? data[0] : null;
    if (!foundClient) {
      messageEl.textContent = `لم يتم العثور على عميل بالرقم: ${searchId}`;
      messageEl.style.color = '#ef4444';
      return;
    }

    const decodedSpecs = decodeLegacyServiceSpecs(foundClient.service_specs);
    serviceItems = normalizeServiceItems(foundClient, decodedSpecs);

    messageEl.textContent = `تم العثور على العميل: ${foundClient.client_name}`;
    messageEl.style.color = '#10b981';

    document.getElementById('formCardTitle').textContent = `تعديل بيانات العميل (${foundClient.id})`;
    document.getElementById('id').value = foundClient.id;
    document.getElementById('booking_date').value = foundClient.booking_date || '';
    document.getElementById('delivery_date').value = foundClient.delivery_date || '';
    document.getElementById('client_name').value = foundClient.client_name || '';
    document.getElementById('whatsapp').value = foundClient.whatsapp || '';
    document.getElementById('source').value = foundClient.source || 'WhatsApp';
    document.getElementById('deal_owner').value = foundClient.deal_owner || '';
    document.getElementById('delivery_staff').value = foundClient.delivery_staff || '';
    document.getElementById('service_specs').value = decodedSpecs.notes || '';

    renderServiceItems();
    updatePaymentSummary();
  } catch (err) {
    console.error('Search error:', err);
    messageEl.textContent = 'حدث خطأ أثناء البحث!';
    messageEl.style.color = '#ef4444';
  }
}

function isMissingServiceItemsColumn(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('service_items') && (
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  );
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'جاري الحفظ...';

  try {
    let clientId = document.getElementById('id').value.trim();
    if (!clientId) clientId = await generateNextClientId();

    const totals = calculateServiceTotals();
    const cleanItems = serviceItems.map(item => ({
      name: item.name,
      price: roundMoney(item.price),
      delivery_status: item.delivery_status,
      paid: roundMoney(item.paid),
      remaining: roundMoney(item.remaining)
    }));

    let payload = {
      id: clientId,
      booking_date: document.getElementById('booking_date').value || null,
      delivery_date: document.getElementById('delivery_date').value || null,
      client_name: document.getElementById('client_name').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      source: document.getElementById('source').value,
      deal_owner: document.getElementById('deal_owner').value || null,
      delivery_staff: document.getElementById('delivery_staff').value || null,
      service_type: cleanItems.map(item => item.name).join(', '),
      service_specs: document.getElementById('service_specs').value.trim(),
      total_price: totals.total,
      paid: totals.paid,
      remaining: totals.remaining,
      delivery_status: totals.deliveryStatus,
      payment_status: totals.paymentStatus,
      service_items: cleanItems
    };

    let { error } = await db
      .from('clients')
      .upsert([payload], { onConflict: 'id' });

    if (error && isMissingServiceItemsColumn(error)) {
      const legacyPayload = { ...payload };
      delete legacyPayload.service_items;
      legacyPayload.service_specs = encodeLegacyServiceSpecs(legacyPayload.service_specs, cleanItems);

      ({ error } = await db
        .from('clients')
        .upsert([legacyPayload], { onConflict: 'id' }));
    }

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
  serviceItems = [];
  renderServiceItems();
  document.getElementById('formCardTitle').textContent = 'إضافة / تعديل بيانات عميل';
  document.getElementById('searchMessage').textContent = '';
  document.getElementById('searchInput').value = '';

  const nextId = await generateNextClientId();
  document.getElementById('id').value = nextId;
  updatePaymentSummary();
}
