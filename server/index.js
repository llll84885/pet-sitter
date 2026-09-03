// ============================================
// 萌宠管家后端服务 - Express + sql.js（纯 JS，无需编译）
// ============================================

const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.sqlite');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================
// sql.js 初始化 & 种子数据
// ============================================
let db;

const SEED_PETS = [
  { id: 'pet-1', name: '橘座', type: 'cat', breed: '中华田园猫', personality: '活泼粘人', notes: '喜欢逗猫棒，不洗澡' },
  { id: 'pet-2', name: '豆豆', type: 'cat', breed: '英短蓝猫', personality: '高冷慢热', notes: '胆小，生人勿近' },
  { id: 'pet-3', name: '大黄', type: 'dog', breed: '柯基', weight: 12, dog_size: 'small', personality: '热情友好', notes: '爱爆冲，牵绳要抓紧' },
  { id: 'pet-4', name: '奶茶', type: 'dog', breed: '金毛', weight: 28, dog_size: 'medium', personality: '温顺亲人', notes: '夏天怕热' }
];

const SEED_ORDERS = [
  {
    id: 'ord-1', service_type: 'cat', service_date: '2026-09-05', service_time: '18:00-19:00',
    address: '宜昌市西陵区XX小区3栋201', distance: 2.5,
    pet_ids: JSON.stringify(['pet-1', 'pet-2']),
    add_ons: JSON.stringify([{ id: 'cat-comb', name: '梳毛', price: 3, description: '梳理浮毛', category: 'cat' }]),
    note: '两只猫都要梳毛，橘座比较配合',
    status: 'pending', price: 29,
    price_details: JSON.stringify([
      { label: '上门喂猫 基础价', amount: 20 },
      { label: '多猫加价（2只）', amount: 5 },
      { label: '梳毛', amount: 3 },
      { label: '节假日加价 ×1.15', amount: 1 }
    ])
  },
  {
    id: 'ord-2', service_type: 'dog', service_date: '2026-09-03', service_time: '19:00-20:00',
    address: '宜昌市伍家岗区XX花园5栋1502', distance: 4.2,
    pet_ids: JSON.stringify(['pet-4']),
    add_ons: JSON.stringify([
      { id: 'dog-extend-10', name: '延长遛狗10分钟', price: 2, description: '超出基础30分钟', category: 'dog' },
      { id: 'dog-wipe', name: '擦脚/擦身体', price: 5, description: '遛后清洁', category: 'dog' }
    ]),
    status: 'accepted', price: 35,
    price_details: JSON.stringify([
      { label: '上门遛狗 基础价', amount: 25 },
      { label: '距离加价（4.2公里）', amount: 3 },
      { label: '延长遛狗10分钟', amount: 2 },
      { label: '擦脚/擦身体', amount: 5 }
    ])
  },
  {
    id: 'ord-3', service_type: 'cat', service_date: '2026-08-28', service_time: '20:00-21:00',
    address: '宜昌市点军区XX苑1栋301', distance: 1.8,
    pet_ids: JSON.stringify(['pet-1']),
    add_ons: JSON.stringify([]), status: 'completed', price: 20,
    price_details: JSON.stringify([{ label: '上门喂猫 基础价', amount: 20 }])
  },
  {
    id: 'ord-4', service_type: 'dog', service_date: '2026-08-25', service_time: '17:30-18:30',
    address: '宜昌市西陵区XX小区2栋802', distance: 3.0,
    pet_ids: JSON.stringify(['pet-3', 'pet-4']),
    add_ons: JSON.stringify([
      { id: 'dog-play', name: '陪玩互动', price: 3, description: '抛球游戏', category: 'dog' },
      { id: 'dog-live', name: '全程直播', price: 10, description: '微信视频全程同步', category: 'both' }
    ]),
    status: 'completed', price: 51,
    price_details: JSON.stringify([
      { label: '上门遛狗 基础价', amount: 25 },
      { label: '多狗加价（2只）', amount: 13 },
      { label: '陪玩互动', amount: 3 },
      { label: '全程直播', amount: 10 }
    ])
  }
];

// ============================================
// 密码 & Token 工具（demo 级别，生产应使用 bcrypt）
// ============================================
function makeSalt() { return crypto.randomBytes(8).toString('hex'); }
function hashPassword(password, salt) { return crypto.createHash('sha256').update(salt + password).digest('hex'); }
function makeToken() { return crypto.randomUUID(); }
function maskPhone(phone) { return phone ? phone.slice(0, 3) + '****' + phone.slice(-4) : ''; }

async function initDB() {
  const SQL = await initSqlJs();
  let buffer = null;
  if (fs.existsSync(DB_FILE)) {
    buffer = fs.readFileSync(DB_FILE);
    console.log('[DB] 使用现有数据库:', DB_FILE);
  }
  db = new SQL.Database(buffer);

  db.run(`
    CREATE TABLE IF NOT EXISTS pet (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      breed TEXT,
      weight REAL,
      dog_size TEXT,
      personality TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS "order" (
      id TEXT PRIMARY KEY,
      service_type TEXT NOT NULL,
      service_date TEXT NOT NULL,
      service_time TEXT NOT NULL,
      address TEXT NOT NULL,
      distance REAL NOT NULL DEFAULT 0,
      pet_ids TEXT NOT NULL,
      add_ons TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      price REAL NOT NULL,
      price_details TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      salt TEXT NOT NULL,
      nickname TEXT,
      token TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS address (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      detail TEXT NOT NULL,
      tag TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  // ---- 数据库迁移：为已有表添加新列 ----
  function columnExists(table, col) {
    // order 是 SQLite 保留字，需要双引号
    const quoted = table === 'order' ? '"order"' : table;
    const rows = db.exec(`PRAGMA table_info(${quoted})`)[0];
    if (!rows) return false;
    const nameIdx = rows.columns.indexOf('name');
    return rows.values.some(r => r[nameIdx] === col);
  }
  function addColumnIfNotExists(table, col, def) {
    if (!columnExists(table, col)) {
      const quoted = table === 'order' ? '"order"' : table;
      db.run(`ALTER TABLE ${quoted} ADD COLUMN ${col} ${def}`);
      console.log(`[DB] 迁移: ${table}.${col} 已添加`);
      saveDB();
    }
  }
  addColumnIfNotExists('user', 'role', "TEXT NOT NULL DEFAULT 'customer'");
  addColumnIfNotExists('user', 'bio', 'TEXT');
  addColumnIfNotExists('user', 'service_area', 'TEXT');
  addColumnIfNotExists('user', 'skills', 'TEXT');
  addColumnIfNotExists('order', 'provider_id', 'TEXT');
  addColumnIfNotExists('order', 'commission', 'REAL NOT NULL DEFAULT 0');
  addColumnIfNotExists('order', 'provider_earning', 'REAL NOT NULL DEFAULT 0');

  const petCount = db.exec('SELECT COUNT(*) as c FROM pet')[0]?.values[0][0] || 0;
  if (petCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO pet (id,name,type,breed,weight,dog_size,personality,notes) VALUES (?,?,?,?,?,?,?,?)'
    );
    SEED_PETS.forEach(p => stmt.run([p.id, p.name, p.type, p.breed || null, p.weight || null, p.dog_size || null, p.personality || null, p.notes || null]));
    stmt.free();
    console.log('[DB] 初始化 4 条宠物种子数据');
  }

  const orderCount = db.exec('SELECT COUNT(*) as c FROM "order"')[0]?.values[0][0] || 0;
  if (orderCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO "order" (id,service_type,service_date,service_time,address,distance,pet_ids,add_ons,note,status,price,price_details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    SEED_ORDERS.forEach(o => stmt.run([o.id, o.service_type, o.service_date, o.service_time, o.address, o.distance, o.pet_ids, o.add_ons, o.note || null, o.status, o.price, o.price_details]));
    stmt.free();
    console.log('[DB] 初始化 4 条订单种子数据');
  }

  // 种子用户（密码 hash 后存入）
  const userCount = db.exec('SELECT COUNT(*) as c FROM user')[0]?.values[0][0] || 0;
  if (userCount === 0) {
    const salt = makeSalt();
    db.run(
      'INSERT INTO user (id, phone, password, salt, nickname, token, role) VALUES (?,?,?,?,?,?,?)',
      ['user-1', '13800000000', hashPassword('123456', salt), salt, '橘座铲屎官', makeToken(), 'customer']
    );
    console.log('[DB] 初始化种子顾客 13800000000 / 123456');
  }

  // 种子服务人员
  const providerCount = db.exec("SELECT COUNT(*) as c FROM user WHERE role = 'provider'")[0]?.values[0][0] || 0;
  if (providerCount === 0) {
    const salt2 = makeSalt();
    db.run(
      "INSERT INTO user (id, phone, password, salt, nickname, token, role, bio, service_area, skills) VALUES (?,?,?,?,?,?,?,?,?,?)",
      ['user-2', '13900000000', hashPassword('123456', salt2), salt2, '小王', makeToken(), 'provider', '5年宠物护理经验，擅长猫狗上门服务', '宜昌市西陵区/伍家岗区', JSON.stringify(['cat','dog','梳毛','喂药'])]
    );
    // 将已有种子订单分配给服务人员（ord-2 accepted, ord-3/ord-4 completed）
    ['ord-2','ord-3','ord-4'].forEach(oid => {
      const o = query('SELECT price FROM "order" WHERE id = ?', [oid])[0];
      if (o) {
        const commission = Math.round(o.price * 0.05);
        run('UPDATE "order" SET provider_id = ?, commission = ?, provider_earning = ? WHERE id = ?',
          ['user-2', commission, o.price - commission, oid]);
      }
    });
    console.log('[DB] 初始化种子服务人员 13900000000 / 123456');
  }

  // 种子地址
  const addrCount = db.exec('SELECT COUNT(*) as c FROM address')[0]?.values[0][0] || 0;
  if (addrCount === 0) {
    const seedAddrs = [
      { id: 'addr-1', user_id: 'user-1', contact_name: '张三', phone: '13800000000', detail: '宜昌市西陵区XX小区3栋201', tag: '家', is_default: 1 },
      { id: 'addr-2', user_id: 'user-1', contact_name: '张三', phone: '13800000000', detail: '宜昌市伍家岗区XX花园5栋1502', tag: '公司', is_default: 0 }
    ];
    const stmt = db.prepare(
      'INSERT INTO address (id,user_id,contact_name,phone,detail,tag,is_default) VALUES (?,?,?,?,?,?,?)'
    );
    seedAddrs.forEach(a => stmt.run([a.id, a.user_id, a.contact_name, a.phone, a.detail, a.tag, a.is_default]));
    stmt.free();
    console.log('[DB] 初始化 2 条种子地址');
  }

  saveDB();
}

// 持久化到磁盘（sql.js 需手动保存）
function saveDB() {
  try {
    const buffer = Buffer.from(db.export());
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[DB] 保存失败:', err.message);
  }
}

// 简易查询封装（sql.js 无更好用的 prepare-get 封装）
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
  return { changes: db.getRowsModified() };
}

// ============================================
// 定价逻辑（与前端、mock 保持一致）
// ============================================
const BASE_PRICE = { cat: 20, dog: 25 };
function calcDistanceFee(km) { return km <= 3 ? 0 : km <= 5 ? 3 : 5; }
function calcPetCountFee(pets, serviceType) {
  if (pets.length <= 1) return 0;
  let fee = 0;
  if (serviceType === 'cat') return (pets.length - 1) * 5;
  for (let i = 1; i < pets.length; i++) {
    const p = pets[i];
    if (p.type === 'cat') fee += 5;
    else {
      const s = p.dog_size || p.dogSize || 'small';
      fee += s === 'small' ? 5 : s === 'medium' ? 8 : 10;
    }
  }
  return fee;
}
function calcHolidayMultiplier(dateStr) {
  const d = new Date(dateStr); const m = d.getMonth() + 1; const day = d.getDate();
  if ((m === 1 && day >= 28) || (m === 2 && day <= 7)) return 1.4;
  if (m === 10 && day >= 1 && day <= 7) return 1.3;
  if ((m === 9 && day >= 15 && day <= 25) || (m === 6 && day >= 15 && day <= 25)) return 1.2;
  if (m === 5 && day >= 1 && day <= 5) return 1.15;
  if ((m === 1 && day >= 1 && day <= 3) || (m === 4 && day >= 4 && day <= 6)) return 1.1;
  return 1;
}
function getHolidayName(mult) {
  return mult === 1.4 ? '春节' : mult === 1.3 ? '国庆' : mult === 1.2 ? '中秋/端午' : mult === 1.15 ? '五一' : mult === 1.1 ? '元旦/清明' : '';
}
function calculatePrice({ serviceType, distance, pets, addOns, date }) {
  const base = BASE_PRICE[serviceType] || 20;
  const distFee = calcDistanceFee(distance);
  const petFee = calcPetCountFee(pets, serviceType);
  const addFee = (addOns || []).reduce((s, a) => s + (a.price || 0), 0);
  const sub = base + distFee + petFee + addFee;
  const mult = calcHolidayMultiplier(date || new Date().toISOString().split('T')[0]);
  const holFee = mult > 1 ? Math.round(sub * (mult - 1)) : 0;

  const details = [];
  details.push({ label: serviceType === 'cat' ? '上门喂猫 基础价' : '上门遛狗 基础价', amount: base });
  if (distFee > 0) details.push({ label: `距离加价（${Number(distance).toFixed(1)}公里）`, amount: distFee });
  if (petFee > 0) {
    const catC = pets.filter(p => p.type === 'cat').length;
    const dogC = pets.filter(p => p.type === 'dog').length;
    let label = '多宠加价';
    if (catC > 0 && dogC > 0) label = `多宠加价（${catC}猫${dogC}狗）`;
    else if (catC > 1) label = `多猫加价（${catC}只）`;
    else if (dogC > 1) label = `多狗加价（${dogC}只）`;
    details.push({ label, amount: petFee });
  }
  (addOns || []).forEach(a => details.push({ label: a.name, amount: a.price }));
  if (holFee > 0) details.push({ label: `${getHolidayName(mult)}加价 ×${mult}`, amount: holFee });

  return { basePrice: base, distanceFee: distFee, petCountFee: petFee, addOnsFee: addFee, holidayFee: holFee, totalPrice: sub + holFee, details };
}

// ============================================
// API 路由
// ============================================
app.get('/', (req, res) => {
  res.json({ ok: true, msg: '🐾 萌宠管家 API 服务运行中', time: new Date().toLocaleString('zh-CN') });
});

app.post('/api/price/calc', (req, res) => {
  try {
    const { serviceType, distance, pets, addOns, date } = req.body;
    if (!serviceType || !['cat', 'dog'].includes(serviceType)) return res.status(400).json({ ok: false, msg: 'serviceType 无效' });
    if (!Array.isArray(pets) || pets.length === 0) return res.status(400).json({ ok: false, msg: 'pets 不能为空' });
    res.json({ ok: true, data: calculatePrice({ serviceType, distance: Number(distance) || 0, pets, addOns: addOns || [], date }) });
  } catch (err) { console.error('[price/calc]', err); res.status(500).json({ ok: false, msg: err.message }); }
});

// 宠物 CRUD
app.get('/api/pets', (req, res) => {
  try { res.json({ ok: true, data: query('SELECT * FROM pet ORDER BY created_at DESC') }); }
  catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.get('/api/pets/:id', (req, res) => {
  try {
    const rows = query('SELECT * FROM pet WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ ok: false, msg: '宠物不存在' });
    res.json({ ok: true, data: rows[0] });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.post('/api/pets', (req, res) => {
  try {
    const { name, type, breed, weight, dog_size, personality, notes } = req.body;
    if (!name || !type) return res.status(400).json({ ok: false, msg: 'name 和 type 为必填' });
    const id = uuidv4();
    run(
      'INSERT INTO pet (id,name,type,breed,weight,dog_size,personality,notes) VALUES (?,?,?,?,?,?,?,?)',
      [id, name, type, breed || null, weight || null, dog_size || null, personality || null, notes || null]
    );
    res.json({ ok: true, data: query('SELECT * FROM pet WHERE id = ?', [id])[0] });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.put('/api/pets/:id', (req, res) => {
  try {
    const exist = query('SELECT id FROM pet WHERE id = ?', [req.params.id])[0];
    if (!exist) return res.status(404).json({ ok: false, msg: '宠物不存在' });
    const { name, type, breed, weight, dog_size, personality, notes } = req.body;
    run(
      `UPDATE pet SET
        name = COALESCE(?, name), type = COALESCE(?, type), breed = COALESCE(?, breed),
        weight = COALESCE(?, weight), dog_size = COALESCE(?, dog_size),
        personality = COALESCE(?, personality), notes = COALESCE(?, notes),
        updated_at = datetime('now','localtime') WHERE id = ?`,
      [name, type, breed, weight, dog_size, personality, notes, req.params.id]
    );
    res.json({ ok: true, data: query('SELECT * FROM pet WHERE id = ?', [req.params.id])[0] });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.delete('/api/pets/:id', (req, res) => {
  try {
    const exist = query('SELECT id FROM pet WHERE id = ?', [req.params.id])[0];
    if (!exist) return res.status(404).json({ ok: false, msg: '宠物不存在' });
    run('DELETE FROM pet WHERE id = ?', [req.params.id]);
    res.json({ ok: true, msg: '删除成功' });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

// 订单
function hydrateOrder(row) {
  if (!row) return row;
  return {
    id: row.id, serviceType: row.service_type, serviceDate: row.service_date,
    serviceTime: row.service_time, address: row.address, distance: row.distance,
    petIds: row.pet_ids ? JSON.parse(row.pet_ids) : [],
    addOns: row.add_ons ? JSON.parse(row.add_ons) : [],
    note: row.note, status: row.status, price: row.price,
    priceDetails: row.price_details ? JSON.parse(row.price_details) : [],
    providerId: row.provider_id || null,
    commission: row.commission || 0,
    providerEarning: row.provider_earning || 0,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}
function getPetsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return query(`SELECT * FROM pet WHERE id IN (${placeholders})`, ids);
}

app.get('/api/orders', (req, res) => {
  try {
    const { status } = req.query;
    const rows = status && status !== 'all'
      ? query('SELECT * FROM "order" WHERE status = ? ORDER BY created_at DESC', [status])
      : query('SELECT * FROM "order" ORDER BY created_at DESC');
    const list = rows.map(r => {
      const o = hydrateOrder(r);
      return { ...o, pets: getPetsByIds(o.petIds) };
    });
    res.json({ ok: true, data: list });
  } catch (err) { console.error('[GET orders]', err); res.status(500).json({ ok: false, msg: err.message }); }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const row = query('SELECT * FROM "order" WHERE id = ?', [req.params.id])[0];
    if (!row) return res.status(404).json({ ok: false, msg: '订单不存在' });
    const o = hydrateOrder(row);
    res.json({ ok: true, data: { ...o, pets: getPetsByIds(o.petIds) } });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.post('/api/orders', (req, res) => {
  try {
    const { serviceType, serviceDate, serviceTime, address, distance, petIds, addOns, note, price, priceDetails } = req.body;
    if (!serviceType || !serviceDate || !serviceTime || !address || !Array.isArray(petIds)) {
      return res.status(400).json({ ok: false, msg: '参数不完整' });
    }
    const id = uuidv4();
    run(
      'INSERT INTO "order" (id,service_type,service_date,service_time,address,distance,pet_ids,add_ons,note,status,price,price_details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, serviceType, serviceDate, serviceTime, address, Number(distance) || 0, JSON.stringify(petIds), JSON.stringify(addOns || []), note || null, 'pending', Number(price) || 0, JSON.stringify(priceDetails || [])]
    );
    const row = query('SELECT * FROM "order" WHERE id = ?', [id])[0];
    const o = hydrateOrder(row);
    res.json({ ok: true, data: { ...o, pets: getPetsByIds(o.petIds) } });
  } catch (err) { console.error('[POST orders]', err); res.status(500).json({ ok: false, msg: err.message }); }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'accepted', 'inProgress', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ ok: false, msg: `status 必须是 ${valid.join('/')}` });
    const exist = query('SELECT id FROM "order" WHERE id = ?', [req.params.id])[0];
    if (!exist) return res.status(404).json({ ok: false, msg: '订单不存在' });
    run(`UPDATE "order" SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`, [status, req.params.id]);
    const row = query('SELECT * FROM "order" WHERE id = ?', [req.params.id])[0];
    const o = hydrateOrder(row);
    res.json({ ok: true, data: { ...o, pets: getPetsByIds(o.petIds) } });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    const exist = query('SELECT id FROM "order" WHERE id = ?', [req.params.id])[0];
    if (!exist) return res.status(404).json({ ok: false, msg: '订单不存在' });
    run('DELETE FROM "order" WHERE id = ?', [req.params.id]);
    res.json({ ok: true, msg: '删除成功' });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

// ============================================
// 认证中间件
// ============================================
function authRequired(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, msg: '未登录' });
  const row = query('SELECT id, phone, nickname, role, bio, service_area, skills FROM user WHERE token = ?', [token])[0];
  if (!row) return res.status(401).json({ ok: false, msg: '登录已失效，请重新登录' });
  req.user = {
    id: row.id, phone: row.phone, nickname: row.nickname, role: row.role || 'customer',
    bio: row.bio || '', serviceArea: row.service_area || '',
    skills: row.skills ? JSON.parse(row.skills) : []
  };
  next();
}

function providerOnly(req, res, next) {
  if (!req.user || req.user.role !== 'provider') return res.status(403).json({ ok: false, msg: '仅服务人员可操作' });
  next();
}

// ============================================
// 认证 API
// ============================================
app.post('/api/auth/register', (req, res) => {
  try {
    const { phone, password, nickname, role } = req.body;
    if (!phone || !/^1\d{10}$/.test(phone)) return res.status(400).json({ ok: false, msg: '手机号格式不正确' });
    if (!password || password.length < 6) return res.status(400).json({ ok: false, msg: '密码至少6位' });
    const userRole = ['customer', 'provider'].includes(role) ? role : 'customer';
    const exist = query('SELECT id FROM user WHERE phone = ?', [phone])[0];
    if (exist) return res.status(400).json({ ok: false, msg: '该手机号已注册' });
    const salt = makeSalt();
    const id = uuidv4();
    const token = makeToken();
    const nick = nickname || (userRole === 'provider' ? '服务人员' : '铲屎官');
    run(
      'INSERT INTO user (id, phone, password, salt, nickname, token, role) VALUES (?,?,?,?,?,?,?)',
      [id, phone, hashPassword(password, salt), salt, nick, token, userRole]
    );
    res.json({ ok: true, data: { user: { id, phone, nickname: nick, role: userRole }, token } });
  } catch (err) { console.error('[register]', err); res.status(500).json({ ok: false, msg: err.message }); }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ ok: false, msg: '手机号和密码为必填' });
    const row = query('SELECT * FROM user WHERE phone = ?', [phone])[0];
    if (!row) return res.status(400).json({ ok: false, msg: '手机号或密码错误' });
    if (hashPassword(password, row.salt) !== row.password) return res.status(400).json({ ok: false, msg: '手机号或密码错误' });
    const token = makeToken();
    run('UPDATE user SET token = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?', [token, row.id]);
    res.json({ ok: true, data: { user: { id: row.id, phone: row.phone, nickname: row.nickname, role: row.role || 'customer' }, token } });
  } catch (err) { console.error('[login]', err); res.status(500).json({ ok: false, msg: err.message }); }
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ ok: true, data: req.user });
});

// ============================================
// 地址 API（需登录）
// ============================================
function hydrateAddress(row) {
  if (!row) return row;
  return {
    id: row.id, contactName: row.contact_name, phone: row.phone,
    detail: row.detail, tag: row.tag, isDefault: !!row.is_default,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

app.get('/api/addresses', authRequired, (req, res) => {
  try {
    const rows = query('SELECT * FROM address WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    res.json({ ok: true, data: rows.map(hydrateAddress) });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.post('/api/addresses', authRequired, (req, res) => {
  try {
    const { contactName, phone, detail, tag, isDefault } = req.body;
    if (!contactName || !phone || !detail) return res.status(400).json({ ok: false, msg: '联系人、电话、地址为必填' });
    if (isDefault) run('UPDATE address SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    const id = uuidv4();
    run(
      'INSERT INTO address (id,user_id,contact_name,phone,detail,tag,is_default) VALUES (?,?,?,?,?,?,?)',
      [id, req.user.id, contactName, phone, detail, tag || '', isDefault ? 1 : 0]
    );
    res.json({ ok: true, data: hydrateAddress(query('SELECT * FROM address WHERE id = ?', [id])[0]) });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.put('/api/addresses/:id', authRequired, (req, res) => {
  try {
    const row = query('SELECT * FROM address WHERE id = ?', [req.params.id])[0];
    if (!row) return res.status(404).json({ ok: false, msg: '地址不存在' });
    if (row.user_id !== req.user.id) return res.status(403).json({ ok: false, msg: '无权操作' });
    const { contactName, phone, detail, tag, isDefault } = req.body;
    if (isDefault) run('UPDATE address SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    const updates = [];
    const params = [];
    if (contactName !== undefined) { updates.push('contact_name = ?'); params.push(contactName); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (detail !== undefined) { updates.push('detail = ?'); params.push(detail); }
    if (tag !== undefined) { updates.push('tag = ?'); params.push(tag); }
    if (isDefault !== undefined) { updates.push('is_default = ?'); params.push(isDefault ? 1 : 0); }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now','localtime')");
      params.push(req.params.id);
      run(`UPDATE address SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    res.json({ ok: true, data: hydrateAddress(query('SELECT * FROM address WHERE id = ?', [req.params.id])[0]) });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.delete('/api/addresses/:id', authRequired, (req, res) => {
  try {
    const row = query('SELECT * FROM address WHERE id = ?', [req.params.id])[0];
    if (!row) return res.status(404).json({ ok: false, msg: '地址不存在' });
    if (row.user_id !== req.user.id) return res.status(403).json({ ok: false, msg: '无权操作' });
    run('DELETE FROM address WHERE id = ?', [req.params.id]);
    res.json({ ok: true, msg: '删除成功' });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

// ============================================
// 服务人员 API（需登录 + provider 角色）
// ============================================
app.get('/api/provider/orders', authRequired, providerOnly, (req, res) => {
  try {
    const { scope, status } = req.query;
    let rows;
    if (scope === 'mine') {
      rows = status && status !== 'all'
        ? query('SELECT * FROM "order" WHERE provider_id = ? AND status = ? ORDER BY created_at DESC', [req.user.id, status])
        : query('SELECT * FROM "order" WHERE provider_id = ? ORDER BY created_at DESC', [req.user.id]);
    } else {
      // available: pending orders
      rows = query('SELECT * FROM "order" WHERE status = ? ORDER BY created_at DESC', ['pending']);
    }
    const list = rows.map(r => {
      const o = hydrateOrder(r);
      return { ...o, pets: getPetsByIds(o.petIds) };
    });
    res.json({ ok: true, data: list });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.put('/api/orders/:id/accept', authRequired, providerOnly, (req, res) => {
  try {
    const row = query('SELECT * FROM "order" WHERE id = ?', [req.params.id])[0];
    if (!row) return res.status(404).json({ ok: false, msg: '订单不存在' });
    if (row.status !== 'pending') return res.status(400).json({ ok: false, msg: '订单已被接走或不可接' });
    const commission = Math.round(row.price * 0.05);
    const providerEarning = row.price - commission;
    run(
      'UPDATE "order" SET provider_id = ?, status = ?, commission = ?, provider_earning = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?',
      [req.user.id, 'accepted', commission, providerEarning, req.params.id]
    );
    const updated = query('SELECT * FROM "order" WHERE id = ?', [req.params.id])[0];
    const o = hydrateOrder(updated);
    res.json({ ok: true, data: { ...o, pets: getPetsByIds(o.petIds) } });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.get('/api/provider/earnings', authRequired, providerOnly, (req, res) => {
  try {
    const rows = query('SELECT * FROM "order" WHERE provider_id = ?', [req.user.id]);
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let totalEarnings = 0, thisMonthEarnings = 0, pendingPayout = 0, commissionTotal = 0;
    let completedCount = 0, acceptedCount = 0, inProgressCount = 0, totalCount = rows.length;
    rows.forEach(r => {
      if (r.status === 'completed') {
        totalEarnings += r.provider_earning || 0;
        commissionTotal += r.commission || 0;
        completedCount++;
        if (r.created_at && r.created_at.startsWith(ym)) thisMonthEarnings += r.provider_earning || 0;
      }
      if (r.status === 'accepted') { pendingPayout += r.provider_earning || 0; acceptedCount++; }
      if (r.status === 'inProgress') { pendingPayout += r.provider_earning || 0; inProgressCount++; }
    });
    res.json({
      ok: true,
      data: { totalEarnings, thisMonthEarnings, pendingPayout, commissionTotal,
              completedCount, acceptedCount, inProgressCount, totalCount }
    });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

app.get('/api/provider/profile', authRequired, providerOnly, (req, res) => {
  res.json({ ok: true, data: {
    nickname: req.user.nickname, phone: req.user.phone,
    bio: req.user.bio, serviceArea: req.user.serviceArea, skills: req.user.skills
  } });
});

app.put('/api/provider/profile', authRequired, providerOnly, (req, res) => {
  try {
    const { nickname, bio, serviceArea, skills } = req.body;
    const updates = [];
    const params = [];
    if (nickname !== undefined) { updates.push('nickname = ?'); params.push(nickname); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (serviceArea !== undefined) { updates.push('service_area = ?'); params.push(serviceArea); }
    if (skills !== undefined) { updates.push('skills = ?'); params.push(JSON.stringify(skills)); }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now','localtime')");
      params.push(req.user.id);
      run(`UPDATE user SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    const row = query('SELECT nickname, phone, bio, service_area, skills FROM user WHERE id = ?', [req.user.id])[0];
    res.json({ ok: true, data: {
      nickname: row.nickname, phone: row.phone,
      bio: row.bio || '', serviceArea: row.service_area || '',
      skills: row.skills ? JSON.parse(row.skills) : []
    } });
  } catch (err) { res.status(500).json({ ok: false, msg: err.message }); }
});

// ============================================
// H5 静态托管（生产部署：同一服务同时提供 API + 网页）
// 本地存在 dist 目录时自动启用
// ============================================
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(express.static(DIST_DIR));
  // SPA fallback：非 /api 的 GET 请求返回 index.html（hash 路由其实不需要，防御性支持 browser 路由）
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`🗂  H5 静态托管已启用: ${DIST_DIR}`);
}

// ============================================
// 启动
// ============================================
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🐾 萌宠管家后端服务启动成功！');
    console.log(`📡 地址: http://localhost:${PORT}`);
    console.log(`📄 健康检查: http://localhost:${PORT}/`);
    console.log(`🐾 宠物 API:  GET  /api/pets`);
    console.log(`📋 订单 API:  GET  /api/orders`);
    console.log(`💰 定价 API:  POST /api/price/calc`);
    console.log(`👤 认证 API:  POST /api/auth/register | /api/auth/login | GET /api/auth/me`);
    console.log(`📍 地址 API:  GET/POST/PUT/DELETE /api/addresses`);
    console.log(`🔧 服务人员:  GET /api/provider/orders | PUT /api/orders/:id/accept | GET /api/provider/earnings | GET/PUT /api/provider/profile`);
    console.log('='.repeat(50));
  });
}).catch(err => {
  console.error('[initDB] 初始化失败', err);
  process.exit(1);
});
