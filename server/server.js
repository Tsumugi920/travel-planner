/**
 * travel-planner 后端服务
 * Express REST API：行程增删改查 / 每日安排增删改 / 预算汇总 / 打包清单
 * 数据持久化：server/data.json（首次启动自动写入内置示例数据）
 */
const express = require('express');
const fs = require('fs');
const path = require('path');

const { seedData } = require('./seed');

const PORT = Number(process.env.PORT) || 3011;
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
app.use(express.json());
// 前端静态资源：client/ 目录（前端与 API 同源，无需 CORS）
app.use(express.static(path.join(__dirname, '..', 'client')));

let db = loadData();

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (_err) {
    const seed = seedData();
    saveData(seed);
    return seed;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data || db, null, 2), 'utf8');
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function findTrip(req, res) {
  const trip = db.trips.find(t => t.id === req.params.id);
  if (!trip) res.status(404).json({ error: '行程不存在' });
  return trip || null;
}

function budgetSummary(trip) {
  const byCategory = {};
  let total = 0;
  for (const item of trip.budget) {
    const amount = Number(item.amount) || 0;
    total += amount;
    byCategory[item.category] = (byCategory[item.category] || 0) + amount;
  }
  return { total, byCategory };
}

function sortSchedule(list) {
  return [...list].sort((a, b) =>
    (a.day - b.day) || String(a.time || '').localeCompare(String(b.time || '')));
}

/* ---------------- 行程 CRUD ---------------- */

app.get('/api/trips', (req, res) => {
  const trips = db.trips
    .map(t => ({ ...t, budgetSummary: budgetSummary(t) }))
    .sort((a, b) => String(a.startDate || '9999').localeCompare(String(b.startDate || '9999')));
  res.json(trips);
});

app.post('/api/trips', (req, res) => {
  const { name, destination, startDate, endDate } = req.body || {};
  if (!String(name || '').trim()) {
    return res.status(400).json({ error: '行程名称不能为空' });
  }
  const trip = {
    id: newId('trip'),
    name: String(name).trim(),
    destination: String(destination || '').trim(),
    startDate: String(startDate || ''),
    endDate: String(endDate || ''),
    createdAt: new Date().toISOString(),
    schedule: [],
    budget: [],
    packing: []
  };
  db.trips.push(trip);
  saveData();
  res.status(201).json(trip);
});

app.get('/api/trips/:id', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  res.json({ ...trip, budgetSummary: budgetSummary(trip) });
});

app.put('/api/trips/:id', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const { name, destination, startDate, endDate } = req.body || {};
  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ error: '行程名称不能为空' });
    trip.name = String(name).trim();
  }
  if (destination !== undefined) trip.destination = String(destination).trim();
  if (startDate !== undefined) trip.startDate = String(startDate);
  if (endDate !== undefined) trip.endDate = String(endDate);
  saveData();
  res.json(trip);
});

app.delete('/api/trips/:id', (req, res) => {
  const index = db.trips.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '行程不存在' });
  db.trips.splice(index, 1);
  saveData();
  res.json({ ok: true });
});

/* ---------------- 每日安排 ---------------- */

app.get('/api/trips/:id/schedule', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  res.json(sortSchedule(trip.schedule));
});

app.post('/api/trips/:id/schedule', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const { day, time, title, type, note } = req.body || {};
  if (!String(title || '').trim()) {
    return res.status(400).json({ error: '安排标题不能为空' });
  }
  const item = {
    id: newId('sc'),
    day: Math.max(1, Number(day) || 1),
    time: String(time || ''),
    title: String(title).trim(),
    type: String(type || '景点'),
    note: String(note || '').trim(),
    createdAt: new Date().toISOString()
  };
  trip.schedule.push(item);
  saveData();
  res.status(201).json(item);
});

app.put('/api/trips/:id/schedule/:itemId', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const item = trip.schedule.find(i => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ error: '安排不存在' });
  const { day, time, title, type, note } = req.body || {};
  if (day !== undefined) item.day = Math.max(1, Number(day) || 1);
  if (time !== undefined) item.time = String(time);
  if (type !== undefined) item.type = String(type);
  if (note !== undefined) item.note = String(note).trim();
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ error: '安排标题不能为空' });
    item.title = String(title).trim();
  }
  saveData();
  res.json(item);
});

app.delete('/api/trips/:id/schedule/:itemId', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const index = trip.schedule.findIndex(i => i.id === req.params.itemId);
  if (index === -1) return res.status(404).json({ error: '安排不存在' });
  trip.schedule.splice(index, 1);
  saveData();
  res.json({ ok: true });
});

/* ---------------- 预算（含汇总） ---------------- */

app.get('/api/trips/:id/budget', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  res.json({ items: trip.budget, ...budgetSummary(trip) });
});

app.post('/api/trips/:id/budget', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const { category, amount, note } = req.body || {};
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) {
    return res.status(400).json({ error: '金额必须是大于等于 0 的数字' });
  }
  const item = {
    id: newId('bd'),
    category: String(category || '其他'),
    amount: value,
    note: String(note || '').trim(),
    createdAt: new Date().toISOString()
  };
  trip.budget.push(item);
  saveData();
  res.status(201).json(item);
});

app.put('/api/trips/:id/budget/:itemId', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const item = trip.budget.find(i => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ error: '预算条目不存在' });
  const { category, amount, note } = req.body || {};
  if (category !== undefined) item.category = String(category);
  if (note !== undefined) item.note = String(note).trim();
  if (amount !== undefined) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ error: '金额必须是大于等于 0 的数字' });
    }
    item.amount = value;
  }
  saveData();
  res.json(item);
});

app.delete('/api/trips/:id/budget/:itemId', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const index = trip.budget.findIndex(i => i.id === req.params.itemId);
  if (index === -1) return res.status(404).json({ error: '预算条目不存在' });
  trip.budget.splice(index, 1);
  saveData();
  res.json({ ok: true });
});

/* ---------------- 打包清单 ---------------- */

app.get('/api/trips/:id/packing', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  res.json(trip.packing);
});

app.post('/api/trips/:id/packing', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const { name } = req.body || {};
  if (!String(name || '').trim()) {
    return res.status(400).json({ error: '物品名称不能为空' });
  }
  const item = { id: newId('pk'), name: String(name).trim(), checked: false };
  trip.packing.push(item);
  saveData();
  res.status(201).json(item);
});

app.put('/api/trips/:id/packing/:itemId', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const item = trip.packing.find(i => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ error: '物品不存在' });
  const { name, checked } = req.body || {};
  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ error: '物品名称不能为空' });
    item.name = String(name).trim();
  }
  if (checked !== undefined) item.checked = Boolean(checked);
  saveData();
  res.json(item);
});

app.delete('/api/trips/:id/packing/:itemId', (req, res) => {
  const trip = findTrip(req, res);
  if (!trip) return;
  const index = trip.packing.findIndex(i => i.id === req.params.itemId);
  if (index === -1) return res.status(404).json({ error: '物品不存在' });
  trip.packing.splice(index, 1);
  saveData();
  res.json({ ok: true });
});

/* ---------------- 兜底 ---------------- */

app.use('/api', (req, res) => {
  res.status(404).json({ error: `接口不存在: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, _next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '请求体不是合法的 JSON' });
  }
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`✈️  travel-planner 服务已启动: http://localhost:${PORT}`);
  console.log(`    数据文件: ${DATA_FILE}`);
});
