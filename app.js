/* ============================================
   CrewFlow — نظام توزيع الأطقم
   النسخة الأولى: localStorage + GitHub Pages
   ============================================ */

const STORAGE_KEYS = {
  orders: 'crewflow_orders',
  people: 'crewflow_people'
};

const ROLES_PRESET = [
  'مصور', 'صوت', 'فني', 'فني سويتشر',
  'مراسل', 'سائق', 'عربية', 'منتج'
];

const state = {
  currentTab: 'new-order',
  tempRoles: [],
  orders: [],
  people: []
};

/* ---------- Storage ---------- */
function loadData() {
  try {
    state.orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || '[]');
  } catch { state.orders = []; }

  try {
    state.people = JSON.parse(localStorage.getItem(STORAGE_KEYS.people) || '[]');
  } catch { state.people = []; }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders));
}

function savePeople() {
  localStorage.setItem(STORAGE_KEYS.people, JSON.stringify(state.people));
}

/* ---------- Helpers ---------- */
function uid(prefix) {
  return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'toast ' + (type || ''); }, 2500);
}

/* ---------- Router ---------- */
function render() {
  document.querySelectorAll('.tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === state.currentTab);
  });

  const main = document.getElementById('main');
  main.innerHTML = '';

  if (state.currentTab === 'new-order') renderNewOrder(main);
  else if (state.currentTab === 'today') renderToday(main);
  else if (state.currentTab === 'team') renderTeam(main);
}

/* ---------- Screen 1: New Order ---------- */
function renderNewOrder(main) {
  if (state.tempRoles.length === 0) {
    state.tempRoles = [{ role: 'مصور', count: 1 }];
  }

  main.innerHTML = `
    <div class="page-header">
      <h1>أوردر جديد</h1>
      <p>حدد العميل، الوقت، والمكان، وزوّد الأدوار المطلوبة.</p>
    </div>

    <div class="card">
      <div class="form-grid">
        <div class="form-group">
          <label>العميل</label>
          <input id="f-client" type="text" placeholder="مثال: Kora Plus">
        </div>
        <div class="form-group">
          <label>التاريخ</label>
          <input id="f-date" type="date" value="${todayISO()}">
        </div>
        <div class="form-group">
          <label>ساعة الحضور</label>
          <input id="f-time" type="time" value="10:00">
        </div>
        <div class="form-group">
          <label>ساعة التحرك</label>
          <input id="f-departure" type="time" value="09:00">
        </div>
        <div class="form-group full">
          <label>المكان</label>
          <input id="f-location" type="text" placeholder="مثال: مبنى اليوم السابع">
        </div>
      </div>

      <div style="margin-top:24px">
        <label>الأدوار المطلوبة</label>
        <div id="roles-container" class="roles-list"></div>
        <button type="button" class="btn btn-secondary btn-sm" id="add-role" style="margin-top:12px">
          + أضف دور
        </button>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-primary" id="save-order">احفظ الأوردر</button>
        <button type="button" class="btn btn-secondary" id="reset-order">إلغاء</button>
      </div>
    </div>
  `;

  renderRoleRows();

  document.getElementById('add-role').onclick = () => {
    state.tempRoles.push({ role: 'مصور', count: 1 });
    renderRoleRows();
  };

  document.getElementById('reset-order').onclick = () => {
    state.tempRoles = [{ role: 'مصور', count: 1 }];
    renderNewOrder(main);
  };

  document.getElementById('save-order').onclick = saveOrder;
}

function renderRoleRows() {
  const c = document.getElementById('roles-container');
  if (!c) return;

  c.innerHTML = state.tempRoles.map((r, i) => `
    <div class="role-row">
      <select data-i="${i}" data-k="role">
        ${ROLES_PRESET.map(p =>
          `<option ${p === r.role ? 'selected' : ''}>${p}</option>`
        ).join('')}
      </select>
      <input type="number" min="1" value="${r.count}" data-i="${i}" data-k="count">
      <button type="button" data-remove="${i}">×</button>
    </div>
  `).join('');

  c.querySelectorAll('select, input').forEach(el => {
    el.onchange = e => {
      const i = +e.target.dataset.i;
      const k = e.target.dataset.k;
      state.tempRoles[i][k] = k === 'count' ? (+e.target.value || 1) : e.target.value;
    };
  });

  c.querySelectorAll('[data-remove]').forEach(b => {
    b.onclick = () => {
      const i = +b.dataset.remove;
      state.tempRoles.splice(i, 1);
      if (state.tempRoles.length === 0) state.tempRoles = [{ role: 'مصور', count: 1 }];
      renderRoleRows();
    };
  });
}

function saveOrder() {
  const client = document.getElementById('f-client').value.trim();
  const date = document.getElementById('f-date').value;
  const time = document.getElementById('f-time').value;
  const departure = document.getElementById('f-departure').value;
  const location = document.getElementById('f-location').value.trim();

  if (!client) return toast('اكتب اسم العميل', 'error');
  if (!date) return toast('اختار التاريخ', 'error');
  if (state.tempRoles.length === 0) return toast('ضيف دور واحد على الأقل', 'error');

  const order = {
    id: uid('order'),
    client, date, time, departure, location,
    roles: state.tempRoles.map(r => ({ role: r.role, count: +r.count })),
    assignments: {},
    status: 'open',
    createdAt: new Date().toISOString()
  };

  state.orders.unshift(order);
  saveOrders();

  toast('تم حفظ الأوردر ✅', 'success');

  state.tempRoles = [{ role: 'مصور', count: 1 }];
  state.currentTab = 'today';
  render();
}

/* ---------- Screen 2: Today's Orders ---------- */
function renderToday(main) {
  const today = todayISO();
  const todays = state.orders.filter(o => o.date === today);

  main.innerHTML = `
    <div class="page-header">
      <h1>أوردرات اليوم</h1>
      <p>${todays.length} أوردر — ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </div>

    ${todays.length === 0 ? `
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>مفيش أوردرات النهاردة</h3>
        <p>اضغط على "+ أوردر جديد" عشان تبدأ.</p>
      </div>
    ` : todays.map(o => renderOrderCard(o)).join('')}
  `;
}

function renderOrderCard(o) {
  return `
    <div class="order-card">
      <h3>${esc(o.client)}</h3>
      <div class="order-meta">
        <span>📅 ${esc(o.date)}</span>
        <span>🕐 حضور ${esc(o.time)}</span>
        <span>🚗 تحرك ${esc(o.departure)}</span>
        <span>📍 ${esc(o.location || '—')}</span>
      </div>
      <div class="roles-status">
        ${o.roles.map(r => {
          const assigned = (o.assignments[r.role] || []).length;
          const complete = assigned >= r.count;
          return `
            <div class="role-status ${complete ? 'complete' : ''}">
              <span class="role-name">${esc(r.role)}</span>
              <span class="role-count">${assigned} / ${r.count}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary btn-sm" onclick="alert('قريباً: تعيين الفريق')">+ عيّن الفريق</button>
        <button class="btn btn-danger btn-sm" onclick="removeOrder('${o.id}')">حذف</button>
      </div>
    </div>
  `;
}

function removeOrder(id) {
  if (!confirm('متأكد تحذف الأوردر ده؟')) return;
  state.orders = state.orders.filter(o => o.id !== id);
  saveOrders();
  render();
  toast('تم الحذف', 'success');
}

/* ---------- Screen 3: Team ---------- */
function renderTeam(main) {
  main.innerHTML = `
    <div class="page-header">
      <h1>الفريق</h1>
      <p>${state.people.length} شخص مسجل</p>
    </div>

    <div class="card">
      <h3 style="margin-bottom:16px">أضف شخص جديد</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>الاسم</label>
          <input id="p-name" type="text" placeholder="مثال: أحمد سعيد">
        </div>
        <div class="form-group">
          <label>الموبايل</label>
          <input id="p-phone" type="tel" placeholder="01xxxxxxxxx">
        </div>
        <div class="form-group">
          <label>النوع</label>
          <select id="p-type">
            <option value="employee">موظف</option>
            <option value="freelancer">فريلانسر</option>
          </select>
        </div>
        <div class="form-group">
          <label>المهارات (فاصلة بين كل واحدة)</label>
          <input id="p-skills" type="text" placeholder="مصور, صوت, فني">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" id="save-person">أضف</button>
      </div>
    </div>

    <div id="people-list">
      ${state.people.length === 0 ? `
        <div class="empty-state">
          <div class="icon">👥</div>
          <h3>مفيش حد مسجل لسه</h3>
          <p>ضيف أول موظف أو فريلانسر من الفورم فوق.</p>
        </div>
      ` : state.people.map(p => `
        <div class="person-card">
          <div class="person-info">
            <h4>${esc(p.name)} <span class="badge ${p.type}">${p.type === 'employee' ? 'موظف' : 'فريلانسر'}</span></h4>
            <p>📱 ${esc(p.phone || '—')} • 🛠️ ${esc(p.skills || '—')}</p>
          </div>
          <button class="btn btn-danger btn-sm" onclick="removePerson('${p.id}')">حذف</button>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('save-person').onclick = savePerson;
}

function savePerson() {
  const name = document.getElementById('p-name').value.trim();
  const phone = document.getElementById('p-phone').value.trim();
  const type = document.getElementById('p-type').value;
  const skills = document.getElementById('p-skills').value.trim();

  if (!name) return toast('اكتب الاسم', 'error');

  state.people.unshift({
    id: uid('person'),
    name, phone, type, skills,
    createdAt: new Date().toISOString()
  });

  savePeople();
  toast('تم إضافة ' + name, 'success');
  render();
}

function removePerson(id) {
  if (!confirm('متأكد تحذف الشخص ده؟')) return;
  state.people = state.people.filter(p => p.id !== id);
  savePeople();
  render();
  toast('تم الحذف', 'success');
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  document.querySelectorAll('.tabs button').forEach(b => {
    b.onclick = () => {
      state.currentTab = b.dataset.tab;
      render();
    };
  });

  render();
});

/* Expose for inline handlers */
window.removeOrder = removeOrder;
window.removePerson = removePerson;
