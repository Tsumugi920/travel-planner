/* travel-planner 前端逻辑：调用后端 REST API 渲染界面 */
const API = '/api';

const SCHEDULE_TYPES = ['景点', '活动', '美食', '交通', '住宿', '购物', '其他'];
const BUDGET_CATEGORIES = ['交通', '住宿', '餐饮', '门票', '活动', '购物', '其他'];
const TYPE_COLORS = { '景点': '#0d9488', '活动': '#d97706', '美食': '#dc2626', '交通': '#2563eb', '住宿': '#7c3aed', '购物': '#db2777', '其他': '#64748b' };
const CAT_COLORS = { '交通': '#2563eb', '住宿': '#7c3aed', '餐饮': '#dc2626', '门票': '#0d9488', '活动': '#d97706', '购物': '#db2777', '其他': '#64748b' };

const state = {
  trips: [],
  trip: null,                                   // 当前详情行程
  schedule: [],
  budget: { items: [], total: 0, byCategory: {} },
  packing: [],
  editingTripId: null,                          // 弹窗正在编辑的行程 id
  editing: null                                 // { kind: 'schedule' | 'budget', id }
};

const $ = sel => document.querySelector(sel);

/* ---------------- 工具函数 ---------------- */

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function money(n) {
  return '¥' + Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch (_e) { /* 空响应体 */ }
  if (!res.ok) throw new Error((data && data.error) || `请求失败（HTTP ${res.status}）`);
  return data;
}

let toastTimer = null;
function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

function parseDate(str) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(str || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function tripDays(trip) {
  const s = parseDate(trip.startDate);
  const e = parseDate(trip.endDate);
  if (!s || !e || e < s) return null;
  return Math.round((e - s) / 86400000) + 1;
}

function dayLabel(trip, day) {
  const base = parseDate(trip.startDate);
  if (!base) return `第 ${day} 天`;
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + (day - 1));
  return `第 ${day} 天 · ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${'日一二三四五六'[d.getDay()]}`;
}

function dateRangeText(trip) {
  if (!trip.startDate && !trip.endDate) return '未设置日期';
  return `${trip.startDate || '?'} ~ ${trip.endDate || '?'}`;
}

/* ---------------- 路由 ---------------- */

function route() {
  const m = /^#\/trip\/(.+)$/.exec(location.hash);
  if (m) loadTripDetail(m[1]);
  else showList();
}

/* ---------------- 行程列表 ---------------- */

async function showList() {
  state.trip = null;
  $('#detail-view').hidden = true;
  $('#list-view').hidden = false;
  try {
    state.trips = await api('/trips');
    renderTripList();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderTripList() {
  const grid = $('#trip-grid');
  if (!state.trips.length) {
    grid.innerHTML = '<div class="empty">还没有行程，点击右上角「＋ 新建行程」开始规划吧 ✈️</div>';
    return;
  }
  grid.innerHTML = state.trips.map(t => {
    const days = tripDays(t);
    return `
      <article class="trip-card" data-action="open-trip" data-id="${t.id}">
        <button class="icon-btn danger card-del" data-action="delete-trip" data-id="${t.id}" title="删除行程">✕</button>
        <span class="dest-badge">${esc(t.destination) || '未设目的地'}</span>
        <h3>${esc(t.name)}</h3>
        <p class="trip-meta">🗓 ${esc(dateRangeText(t))}${days ? ` · ${days} 天` : ''}</p>
        <div class="trip-stats">
          <span>累计支出 <b>${money(t.budgetSummary.total)}</b></span>
          <span>日程 <b>${t.schedule.length}</b> 项</span>
          <span>打包 <b>${t.packing.filter(p => p.checked).length}/${t.packing.length}</b></span>
        </div>
      </article>`;
  }).join('');
}

/* ---------------- 行程详情 ---------------- */

async function loadTripDetail(id) {
  try {
    const [trip, schedule, budget, packing] = await Promise.all([
      api(`/trips/${id}`),
      api(`/trips/${id}/schedule`),
      api(`/trips/${id}/budget`),
      api(`/trips/${id}/packing`)
    ]);
    state.trip = trip;
    state.schedule = schedule;
    state.budget = budget;
    state.packing = packing;
    state.editing = null;
    $('#list-view').hidden = true;
    $('#detail-view').hidden = false;
    renderDetail();
    switchTab('schedule');
  } catch (err) {
    toast(err.message, true);
    location.hash = '';
  }
}

function renderDetail() {
  renderTripHeader();
  renderSchedulePanel();
  renderBudgetPanel();
  renderPackingPanel();
}

function renderTripHeader() {
  const t = state.trip;
  if (!t) return;
  const days = tripDays(t);
  $('#trip-header').innerHTML = `
    <div class="trip-header-row">
      <div>
        <span class="dest-badge">${esc(t.destination) || '未设目的地'}</span>
        <h2>${esc(t.name)}</h2>
        <p class="trip-meta">🗓 ${esc(dateRangeText(t))}${days ? ` · 共 ${days} 天` : ''}</p>
      </div>
      <button class="btn btn-ghost" data-action="edit-trip">✏️ 编辑行程</button>
    </div>
    <div class="stat-chips">
      <span class="chip">💰 累计支出 <b>${money(state.budget.total)}</b></span>
      <span class="chip">📅 日程安排 <b>${state.schedule.length}</b> 项</span>
      <span class="chip">🎒 已打包 <b>${state.packing.filter(p => p.checked).length}/${state.packing.length}</b></span>
    </div>`;
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === name));
  ['schedule', 'budget', 'packing'].forEach(p => {
    $(`#panel-${p}`).hidden = p !== name;
  });
}

/* ---------------- 行程安排（按天） ---------------- */

function renderSchedulePanel() {
  const days = tripDays(state.trip) || 7;
  const daySelect = $('#schedule-day');
  const prev = daySelect.value;
  daySelect.innerHTML = Array.from({ length: days }, (_, i) =>
    `<option value="${i + 1}">第 ${i + 1} 天</option>`).join('');
  if (prev && [...daySelect.options].some(o => o.value === prev)) daySelect.value = prev;

  const groups = new Map();
  for (const item of state.schedule) {
    if (!groups.has(item.day)) groups.set(item.day, []);
    groups.get(item.day).push(item);
  }
  const listEl = $('#schedule-list');
  if (!state.schedule.length) {
    listEl.innerHTML = '<div class="empty">这一程还没有安排，用上方表单添加第一个景点或活动吧。</div>';
    return;
  }
  listEl.innerHTML = [...groups.keys()].sort((a, b) => a - b).map(day => `
    <div class="day-block">
      <h4 class="day-title">📍 ${esc(dayLabel(state.trip, day))}</h4>
      ${groups.get(day).map(item =>
        (state.editing && state.editing.kind === 'schedule' && state.editing.id === item.id)
          ? scheduleEditForm(item)
          : scheduleItemRow(item)
      ).join('')}
    </div>`).join('');
}

function scheduleItemRow(item) {
  return `
    <div class="sched-item">
      <span class="time-badge">${esc(item.time) || '--:--'}</span>
      <span class="type-chip" style="background:${TYPE_COLORS[item.type] || TYPE_COLORS['其他']}">${esc(item.type)}</span>
      <div class="sched-main">
        <div class="sched-title">${esc(item.title)}</div>
        ${item.note ? `<div class="sched-note">${esc(item.note)}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="icon-btn" data-action="edit-schedule" data-id="${item.id}">编辑</button>
        <button class="icon-btn danger" data-action="delete-schedule" data-id="${item.id}">删除</button>
      </div>
    </div>`;
}

function scheduleEditForm(item) {
  const days = tripDays(state.trip) || 7;
  return `
    <form class="sched-item edit-form" data-kind="schedule" data-id="${item.id}">
      <select name="day">${Array.from({ length: days }, (_, i) =>
        `<option value="${i + 1}" ${item.day === i + 1 ? 'selected' : ''}>第 ${i + 1} 天</option>`).join('')}</select>
      <input type="time" name="time" value="${esc(item.time)}">
      <select name="type">${SCHEDULE_TYPES.map(t =>
        `<option ${t === item.type ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <input name="title" required value="${esc(item.title)}" placeholder="标题">
      <input name="note" value="${esc(item.note)}" placeholder="备注">
      <div class="item-actions">
        <button type="submit" class="btn btn-primary btn-sm">保存</button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="cancel-edit">取消</button>
      </div>
    </form>`;
}

async function onAddSchedule(e) {
  e.preventDefault();
  const el = e.target.elements;
  const body = {
    day: Number(el.day.value),
    time: el.time.value,
    title: el.title.value.trim(),
    type: el.type.value,
    note: el.note.value.trim()
  };
  if (!body.title) return toast('请填写安排标题', true);
  try {
    await api(`/trips/${state.trip.id}/schedule`, { method: 'POST', body: JSON.stringify(body) });
    state.schedule = await api(`/trips/${state.trip.id}/schedule`);
    el.title.value = '';
    el.note.value = '';
    el.time.value = '';
    renderSchedulePanel();
    renderTripHeader();
    toast('已添加安排 ✓');
  } catch (err) {
    toast(err.message, true);
  }
}

async function onSaveScheduleEdit(e) {
  const form = e.target.closest('.edit-form');
  if (!form) return;
  e.preventDefault();
  const el = form.elements;
  const body = {
    day: Number(el.day.value),
    time: el.time.value,
    type: el.type.value,
    title: el.title.value.trim(),
    note: el.note.value.trim()
  };
  try {
    await api(`/trips/${state.trip.id}/schedule/${form.dataset.id}`, { method: 'PUT', body: JSON.stringify(body) });
    state.editing = null;
    state.schedule = await api(`/trips/${state.trip.id}/schedule`);
    renderSchedulePanel();
    toast('已保存 ✓');
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------------- 预算统计 ---------------- */

function renderBudgetPanel() {
  const { items, total, byCategory } = state.budget;
  const cats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  $('#budget-summary').innerHTML = `
    <div class="summary-card">
      <div class="label">累计总支出</div>
      <div class="value">${money(total)}</div>
    </div>
    ${cats.map(([cat, amount]) => `
      <div class="summary-card">
        <div class="label"><span class="cat-dot" style="background:${CAT_COLORS[cat] || CAT_COLORS['其他']}"></span>${esc(cat)}</div>
        <div class="value small">${money(amount)}</div>
      </div>`).join('')}`;

  $('#budget-list').innerHTML = items.length
    ? items.map(item =>
        (state.editing && state.editing.kind === 'budget' && state.editing.id === item.id)
          ? budgetEditForm(item)
          : `
      <div class="sched-item">
        <span class="type-chip" style="background:${CAT_COLORS[item.category] || CAT_COLORS['其他']}">${esc(item.category)}</span>
        <div class="sched-main">
          <div class="sched-title budget-amount">${money(item.amount)}</div>
          ${item.note ? `<div class="sched-note">${esc(item.note)}</div>` : ''}
        </div>
        <div class="item-actions">
          <button class="icon-btn" data-action="edit-budget" data-id="${item.id}">编辑</button>
          <button class="icon-btn danger" data-action="delete-budget" data-id="${item.id}">删除</button>
        </div>
      </div>`).join('')
    : '<div class="empty">还没有预算条目，添加一笔看看统计效果。</div>';
}

function budgetEditForm(item) {
  return `
    <form class="sched-item edit-form" data-kind="budget" data-id="${item.id}">
      <select name="category">${BUDGET_CATEGORIES.map(c =>
        `<option ${c === item.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <input type="number" name="amount" min="0" step="0.01" value="${item.amount}" required>
      <input name="note" value="${esc(item.note)}" placeholder="备注">
      <div class="item-actions">
        <button type="submit" class="btn btn-primary btn-sm">保存</button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="cancel-edit">取消</button>
      </div>
    </form>`;
}

async function onAddBudget(e) {
  e.preventDefault();
  const el = e.target.elements;
  const body = {
    category: el.category.value,
    amount: Number(el.amount.value),
    note: el.note.value.trim()
  };
  if (el.amount.value === '' || !Number.isFinite(body.amount)) return toast('请填写有效金额', true);
  try {
    await api(`/trips/${state.trip.id}/budget`, { method: 'POST', body: JSON.stringify(body) });
    state.budget = await api(`/trips/${state.trip.id}/budget`);
    el.amount.value = '';
    el.note.value = '';
    renderBudgetPanel();
    renderTripHeader();
    toast('已添加预算条目 ✓');
  } catch (err) {
    toast(err.message, true);
  }
}

async function onSaveBudgetEdit(e) {
  const form = e.target.closest('.edit-form');
  if (!form) return;
  e.preventDefault();
  const el = form.elements;
  const body = {
    category: el.category.value,
    amount: Number(el.amount.value),
    note: el.note.value.trim()
  };
  try {
    await api(`/trips/${state.trip.id}/budget/${form.dataset.id}`, { method: 'PUT', body: JSON.stringify(body) });
    state.editing = null;
    state.budget = await api(`/trips/${state.trip.id}/budget`);
    renderBudgetPanel();
    renderTripHeader();
    toast('已保存 ✓');
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------------- 打包清单 ---------------- */

function renderPackingPanel() {
  const items = state.packing;
  const done = items.filter(p => p.checked).length;
  const pct = items.length ? Math.round(done / items.length * 100) : 0;
  $('#packing-progress').innerHTML = `
    <div class="card progress-wrap">
      <div class="progress-text">已打包 <b>${done}</b> / ${items.length} 件（${pct}%）</div>
      <div class="progress-bar"><div style="width:${pct}%"></div></div>
    </div>`;
  $('#packing-list').innerHTML = items.length
    ? items.map(item => `
      <div class="packing-item ${item.checked ? 'done' : ''}">
        <input type="checkbox" id="pk-${item.id}" data-action="toggle-packing" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
        <label for="pk-${item.id}">${esc(item.name)}</label>
        <button class="icon-btn danger" data-action="delete-packing" data-id="${item.id}">删除</button>
      </div>`).join('')
    : '<div class="empty">清单是空的，护照、充电宝这些别忘了带。</div>';
}

async function onAddPacking(e) {
  e.preventDefault();
  const input = $('#packing-name');
  const name = input.value.trim();
  if (!name) return toast('请填写物品名称', true);
  try {
    const item = await api(`/trips/${state.trip.id}/packing`, { method: 'POST', body: JSON.stringify({ name }) });
    state.packing.push(item);
    input.value = '';
    renderPackingPanel();
    renderTripHeader();
    toast('已加入清单 ✓');
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------------- 新建 / 编辑行程弹窗 ---------------- */

function openTripModal(trip) {
  state.editingTripId = trip ? trip.id : null;
  $('#modal-title').textContent = trip ? '编辑行程' : '新建行程';
  const el = $('#trip-form').elements;
  el.name.value = trip ? trip.name : '';
  el.destination.value = trip ? trip.destination : '';
  el.startDate.value = trip ? trip.startDate : '';
  el.endDate.value = trip ? trip.endDate : '';
  $('#trip-form-error').hidden = true;
  $('#trip-modal').hidden = false;
  el.name.focus();
}

function closeTripModal() {
  $('#trip-modal').hidden = true;
  state.editingTripId = null;
}

async function onTripFormSubmit(e) {
  e.preventDefault();
  const editingId = state.editingTripId;
  const el = e.target.elements;
  const body = {
    name: el.name.value.trim(),
    destination: el.destination.value.trim(),
    startDate: el.startDate.value,
    endDate: el.endDate.value
  };
  if (body.startDate && body.endDate && body.endDate < body.startDate) {
    const errEl = $('#trip-form-error');
    errEl.textContent = '结束日期不能早于开始日期';
    errEl.hidden = false;
    return;
  }
  try {
    if (editingId) {
      await api(`/trips/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      closeTripModal();
      toast('行程已更新 ✓');
      if (state.trip && state.trip.id === editingId) await loadTripDetail(editingId);
      else await showList();
    } else {
      const trip = await api('/trips', { method: 'POST', body: JSON.stringify(body) });
      closeTripModal();
      toast('行程创建成功 ✓');
      location.hash = `#/trip/${trip.id}`;
    }
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------------- 事件委托（按钮点击 / 勾选） ---------------- */

async function onClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.type === 'checkbox') return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  try {
    switch (action) {
      case 'open-trip':
        location.hash = `#/trip/${id}`;
        break;
      case 'delete-trip': {
        const trip = state.trips.find(t => t.id === id);
        if (!confirm(`确定删除行程「${(trip && trip.name) || ''}」？日程、预算与打包清单会一并删除。`)) return;
        await api(`/trips/${id}`, { method: 'DELETE' });
        toast('行程已删除 ✓');
        await showList();
        break;
      }
      case 'edit-trip':
        openTripModal(state.trip);
        break;
      case 'edit-schedule':
        state.editing = { kind: 'schedule', id };
        renderSchedulePanel();
        break;
      case 'edit-budget':
        state.editing = { kind: 'budget', id };
        renderBudgetPanel();
        break;
      case 'cancel-edit':
        state.editing = null;
        renderSchedulePanel();
        renderBudgetPanel();
        break;
      case 'delete-schedule': {
        if (!confirm('删除这条安排？')) return;
        await api(`/trips/${state.trip.id}/schedule/${id}`, { method: 'DELETE' });
        state.schedule = state.schedule.filter(s => s.id !== id);
        renderSchedulePanel();
        renderTripHeader();
        toast('已删除 ✓');
        break;
      }
      case 'delete-budget': {
        if (!confirm('删除这条预算？')) return;
        await api(`/trips/${state.trip.id}/budget/${id}`, { method: 'DELETE' });
        state.budget = await api(`/trips/${state.trip.id}/budget`);
        renderBudgetPanel();
        renderTripHeader();
        toast('已删除 ✓');
        break;
      }
      case 'delete-packing': {
        if (!confirm('从清单中删除该物品？')) return;
        await api(`/trips/${state.trip.id}/packing/${id}`, { method: 'DELETE' });
        state.packing = state.packing.filter(p => p.id !== id);
        renderPackingPanel();
        renderTripHeader();
        toast('已删除 ✓');
        break;
      }
    }
  } catch (err) {
    toast(err.message, true);
  }
}

async function onChange(e) {
  const box = e.target.closest('input[data-action="toggle-packing"]');
  if (!box) return;
  try {
    const item = await api(`/trips/${state.trip.id}/packing/${box.dataset.id}`, {
      method: 'PUT',
      body: JSON.stringify({ checked: box.checked })
    });
    const index = state.packing.findIndex(p => p.id === item.id);
    if (index > -1) state.packing[index] = item;
    renderPackingPanel();
    renderTripHeader();
  } catch (err) {
    toast(err.message, true);
    box.checked = !box.checked;
  }
}

/* ---------------- 初始化 ---------------- */

document.addEventListener('click', onClick);
document.addEventListener('change', onChange);

$('#schedule-form').addEventListener('submit', onAddSchedule);
$('#schedule-list').addEventListener('submit', onSaveScheduleEdit);
$('#budget-form').addEventListener('submit', onAddBudget);
$('#budget-list').addEventListener('submit', onSaveBudgetEdit);
$('#packing-form').addEventListener('submit', onAddPacking);
$('#trip-form').addEventListener('submit', onTripFormSubmit);

$('#btn-new-trip').addEventListener('click', () => openTripModal(null));
$('#btn-cancel-trip').addEventListener('click', closeTripModal);
$('#trip-modal').addEventListener('click', e => { if (e.target.id === 'trip-modal') closeTripModal(); });
$('#btn-back').addEventListener('click', () => { location.hash = ''; });
document.querySelectorAll('.tab').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

window.addEventListener('hashchange', route);
route();
