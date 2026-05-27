/* ═══════════════════════════════════════════════════════════════════════════
   TRADEX Trading Journal — Application Logic
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── STATE ───────────────────────────────────────────────────────────────────
let trades   = [];
let editingId = null;
let sortCol  = 'date';
let sortDir  = -1; // -1 = descending, 1 = ascending

// ─── INITIALISATION ───────────────────────────────────────────────────────────
function init() {
  loadTrades();
  setDefaultDate();
  loadSampleData();   // loads sample trades only if localStorage is empty
  renderAll();
  startClock();
  setupLivePreview();
  setupModalClose();
  setupResizeHandler();
}

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('headerTime');
  const tick = () => {
    el.textContent = new Date().toUTCString().replace(' GMT', ' UTC');
  };
  tick();
  setInterval(tick, 1000);
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
function loadTrades() {
  try {
    trades = JSON.parse(localStorage.getItem('tradex_trades') || '[]');
  } catch (e) {
    trades = [];
  }
}

function saveTrades() {
  localStorage.setItem('tradex_trades', JSON.stringify(trades));
}

// ─── CALCULATIONS ─────────────────────────────────────────────────────────────
/**
 * Returns { pnl, pnlPct } for a trade object.
 */
function calcPnL(trade) {
  const entry = parseFloat(trade.entry);
  const exit  = parseFloat(trade.exit);
  const size  = parseFloat(trade.size);
  if (!entry || !exit || !size) return { pnl: 0, pnlPct: 0 };

  const diff  = trade.direction === 'Long' ? exit - entry : entry - exit;
  const pnl    = diff * size;
  const pnlPct = (diff / entry) * 100;
  return { pnl, pnlPct };
}

/**
 * Returns Risk:Reward ratio or null if SL/TP are missing.
 */
function calcRR(trade) {
  const entry = parseFloat(trade.entry);
  const sl    = parseFloat(trade.stopLoss);
  const tp    = parseFloat(trade.takeProfit);
  if (!entry || !sl || !tp) return null;

  const risk   = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  return risk === 0 ? null : reward / risk;
}

/**
 * Computes aggregate statistics for an array of trades.
 */
function getStats(tradeList) {
  if (!tradeList.length) return null;

  let totalPnl = 0;
  let wins = 0, losses = 0;
  let largestWin = -Infinity, largestLoss = Infinity;
  let rrSum = 0, rrCount = 0;
  let maxConsecWin = 0, maxConsecLoss = 0;
  let curWin = 0, curLoss = 0;

  tradeList.forEach(t => {
    const { pnl } = calcPnL(t);
    totalPnl += pnl;

    if (pnl >= 0) {
      wins++;
      if (pnl > largestWin) largestWin = pnl;
      curWin++;
      curLoss = 0;
      if (curWin > maxConsecWin) maxConsecWin = curWin;
    } else {
      losses++;
      if (pnl < largestLoss) largestLoss = pnl;
      curLoss++;
      curWin = 0;
      if (curLoss > maxConsecLoss) maxConsecLoss = curLoss;
    }

    const rr = calcRR(t);
    if (rr !== null) { rrSum += rr; rrCount++; }
  });

  return {
    total: tradeList.length,
    wins,
    losses,
    winRate:      (wins / tradeList.length) * 100,
    totalPnl,
    avgRR:        rrCount ? rrSum / rrCount : 0,
    largestWin:   largestWin === -Infinity ? 0 : largestWin,
    largestLoss:  largestLoss === Infinity ? 0 : largestLoss,
    maxConsecWin,
    maxConsecLoss,
  };
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  document.getElementById('section-' + name).classList.add('active');

  const tabIndex = { dashboard: 0, log: 1, analysis: 2 };
  document.querySelectorAll('.nav-tab')[tabIndex[name]].classList.add('active');

  if (name === 'analysis') renderAnalysis();
  if (name === 'dashboard') renderAll();
}

// ─── FORM: NEW TRADE ──────────────────────────────────────────────────────────
function setDirection(dir) {
  document.getElementById('tradeDirection').value = dir;
  document.getElementById('btnLong').className  = 'dir-btn' + (dir === 'Long'  ? ' active-long'  : '');
  document.getElementById('btnShort').className = 'dir-btn' + (dir === 'Short' ? ' active-short' : '');
}

function setEditDirection(dir) {
  document.getElementById('editDirection').value = dir;
  document.getElementById('editBtnLong').className  = 'dir-btn' + (dir === 'Long'  ? ' active-long'  : '');
  document.getElementById('editBtnShort').className = 'dir-btn' + (dir === 'Short' ? ' active-short' : '');
}

function setupLivePreview() {
  const ids = ['tradeEntry', 'tradeExit', 'tradeSize', 'tradeStopLoss', 'tradeTakeProfit'];
  ids.forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
  });
  // direction hidden input doesn't fire events so we hook the buttons directly
}

function updatePreview() {
  const t = {
    direction:   document.getElementById('tradeDirection').value,
    entry:       document.getElementById('tradeEntry').value,
    exit:        document.getElementById('tradeExit').value,
    size:        document.getElementById('tradeSize').value,
    stopLoss:    document.getElementById('tradeStopLoss').value,
    takeProfit:  document.getElementById('tradeTakeProfit').value,
  };

  const preview = document.getElementById('pnlPreview');
  if (!t.entry || !t.exit || !t.size) { preview.style.display = 'none'; return; }
  preview.style.display = 'block';

  const { pnl, pnlPct } = calcPnL(t);
  const rr    = calcRR(t);
  const color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
  const sign  = pnl >= 0 ? '+' : '';

  document.getElementById('prevPnl').innerHTML    = `<span style="color:${color}">${sign}$${pnl.toFixed(2)}</span>`;
  document.getElementById('prevPnlPct').innerHTML = `<span style="color:${color}">${sign}${pnlPct.toFixed(2)}%</span>`;
  document.getElementById('prevRR').textContent   = rr !== null ? rr.toFixed(2) + ':1' : '—';
}

function setDefaultDate() {
  document.getElementById('tradeDate').value = new Date().toISOString().split('T')[0];
}

function resetForm() {
  ['tradeInstrument','tradeEntry','tradeExit','tradeSize',
   'tradeStopLoss','tradeTakeProfit','tradeTags','tradeNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('pnlPreview').style.display = 'none';
  setDirection('Long');
  setDefaultDate();
  editingId = null;
  document.getElementById('formTitle').textContent = 'New Trade Entry';
}

function saveTrade() {
  const instrument = document.getElementById('tradeInstrument').value.trim();
  const entry      = document.getElementById('tradeEntry').value;
  const exit       = document.getElementById('tradeExit').value;
  const size       = document.getElementById('tradeSize').value;

  if (!instrument || !entry || !exit || !size) {
    toast('Please fill in required fields (Instrument, Entry, Exit, Size)', 'error');
    return;
  }

  const existing = editingId ? trades.find(t => t.id === editingId) : null;

  const trade = {
    id:         editingId || Date.now().toString(),
    date:       document.getElementById('tradeDate').value,
    instrument: instrument.toUpperCase(),
    direction:  document.getElementById('tradeDirection').value,
    entry:      parseFloat(entry),
    exit:       parseFloat(exit),
    size:       parseFloat(size),
    stopLoss:   document.getElementById('tradeStopLoss').value   || null,
    takeProfit: document.getElementById('tradeTakeProfit').value || null,
    tags:       document.getElementById('tradeTags').value
                  .split(',').map(t => t.trim()).filter(Boolean),
    notes:      document.getElementById('tradeNotes').value.trim(),
    createdAt:  existing ? existing.createdAt : Date.now(),
  };

  if (editingId) {
    const idx = trades.findIndex(t => t.id === editingId);
    if (idx !== -1) trades[idx] = trade;
    toast('Trade updated!', 'success');
  } else {
    trades.push(trade);
    toast('Trade logged!', 'success');
  }

  saveTrades();
  resetForm();
  renderAll();
  showSection('dashboard');
}

// ─── FILTERS ──────────────────────────────────────────────────────────────────
function getFilteredTrades() {
  const inst    = document.getElementById('filterInstrument').value.toUpperCase();
  const dir     = document.getElementById('filterDirection').value;
  const from    = document.getElementById('filterDateFrom').value;
  const to      = document.getElementById('filterDateTo').value;
  const outcome = document.getElementById('filterOutcome').value;

  return trades.filter(t => {
    if (inst    && !t.instrument.includes(inst)) return false;
    if (dir     && t.direction !== dir)           return false;
    if (from    && t.date < from)                 return false;
    if (to      && t.date > to)                   return false;
    if (outcome) {
      const { pnl } = calcPnL(t);
      if (outcome === 'win'  && pnl <  0) return false;
      if (outcome === 'loss' && pnl >= 0) return false;
    }
    return true;
  });
}

function resetFilters() {
  ['filterInstrument','filterDirection','filterDateFrom',
   'filterDateTo','filterOutcome'].forEach(id => {
    document.getElementById(id).value = '';
  });
  renderTrades();
}

// ─── TABLE RENDER ─────────────────────────────────────────────────────────────
function sortTable(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = -1; }
  renderTrades();
}

function renderTrades() {
  let filtered = getFilteredTrades();

  // Sort
  filtered.sort((a, b) => {
    let va, vb;
    if      (sortCol === 'date')       { va = a.date;             vb = b.date; }
    else if (sortCol === 'instrument') { va = a.instrument;       vb = b.instrument; }
    else if (sortCol === 'pnl')        { va = calcPnL(a).pnl;    vb = calcPnL(b).pnl; }
    else                               { va = a.date;             vb = b.date; }
    return va < vb ? -sortDir : va > vb ? sortDir : 0;
  });

  // Update sort indicators
  document.querySelectorAll('thead th').forEach(th => th.classList.remove('sort-asc','sort-desc'));

  const tbody  = document.getElementById('tradesBody');
  const empty  = document.getElementById('emptyState');
  tbody.innerHTML = '';

  if (!filtered.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(trade => {
    const { pnl, pnlPct } = calcPnL(trade);
    const rr   = calcRR(trade);
    const isWin = pnl >= 0;
    const sign  = isWin ? '+' : '';
    const cls   = isWin ? 'td-win' : 'td-loss';
    const tags  = trade.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${trade.date}</td>
      <td class="td-instrument">${escHtml(trade.instrument)}</td>
      <td class="${trade.direction === 'Long' ? 'td-long' : 'td-short'}">${trade.direction.toUpperCase()}</td>
      <td>${parseFloat(trade.entry).toFixed(4)}</td>
      <td>${parseFloat(trade.exit).toFixed(4)}</td>
      <td>${trade.size}</td>
      <td class="${cls}">${sign}$${pnl.toFixed(2)}</td>
      <td class="${cls}">${sign}${pnlPct.toFixed(2)}%</td>
      <td class="td-neutral">${rr !== null ? rr.toFixed(2) + ':1' : '—'}</td>
      <td>${tags || '<span class="td-neutral">—</span>'}</td>
      <td>
        <div class="action-cell">
          <button class="btn btn-outline btn-sm" onclick="editTrade('${trade.id}')">Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="deleteTrade('${trade.id}')">Del</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── STATS CARDS ──────────────────────────────────────────────────────────────
function renderStats() {
  const stats = getStats(trades);
  const grid  = document.getElementById('statsGrid');

  if (!stats) {
    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">No trades yet</div>
        <div class="stat-value">—</div>
      </div>`;
    return;
  }

  const pnlClass = stats.totalPnl >= 0 ? 'green' : 'red';
  const pnlSign  = stats.totalPnl >= 0 ? '+' : '';

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Trades</div>
      <div class="stat-value">${stats.total}</div>
      <div class="stat-sub">${stats.wins}W / ${stats.losses}L</div>
    </div>
    <div class="stat-card ${stats.winRate >= 50 ? 'green' : 'red'}">
      <div class="stat-label">Win Rate</div>
      <div class="stat-value ${stats.winRate >= 50 ? 'green' : 'red'}">${stats.winRate.toFixed(1)}%</div>
    </div>
    <div class="stat-card ${pnlClass}">
      <div class="stat-label">Total P&L</div>
      <div class="stat-value ${pnlClass}">${pnlSign}$${stats.totalPnl.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg R:R</div>
      <div class="stat-value">${stats.avgRR.toFixed(2)}</div>
      <div class="stat-sub">Ratio</div>
    </div>
    <div class="stat-card green">
      <div class="stat-label">Largest Win</div>
      <div class="stat-value green">+$${stats.largestWin.toFixed(2)}</div>
    </div>
    <div class="stat-card red">
      <div class="stat-label">Largest Loss</div>
      <div class="stat-value red">$${stats.largestLoss.toFixed(2)}</div>
    </div>
    <div class="stat-card yellow">
      <div class="stat-label">Max Consec Wins</div>
      <div class="stat-value yellow">${stats.maxConsecWin}</div>
    </div>
    <div class="stat-card red">
      <div class="stat-label">Max Consec Losses</div>
      <div class="stat-value red">${stats.maxConsecLoss}</div>
    </div>
  `;
}

// ─── EDIT / DELETE ────────────────────────────────────────────────────────────
function editTrade(id) {
  const trade = trades.find(t => t.id === id);
  if (!trade) return;
  editingId = id;

  document.getElementById('editDate').value       = trade.date;
  document.getElementById('editInstrument').value = trade.instrument;
  document.getElementById('editEntry').value      = trade.entry;
  document.getElementById('editExit').value       = trade.exit;
  document.getElementById('editSize').value       = trade.size;
  document.getElementById('editStopLoss').value   = trade.stopLoss   || '';
  document.getElementById('editTakeProfit').value = trade.takeProfit || '';
  document.getElementById('editTags').value       = trade.tags.join(', ');
  document.getElementById('editNotes').value      = trade.notes;
  setEditDirection(trade.direction);

  document.getElementById('editModal').classList.add('open');
}

function updateTrade() {
  if (!editingId) return;
  const idx = trades.findIndex(t => t.id === editingId);
  if (idx === -1) return;

  trades[idx] = {
    ...trades[idx],
    date:       document.getElementById('editDate').value,
    instrument: document.getElementById('editInstrument').value.toUpperCase(),
    direction:  document.getElementById('editDirection').value,
    entry:      parseFloat(document.getElementById('editEntry').value),
    exit:       parseFloat(document.getElementById('editExit').value),
    size:       parseFloat(document.getElementById('editSize').value),
    stopLoss:   document.getElementById('editStopLoss').value   || null,
    takeProfit: document.getElementById('editTakeProfit').value || null,
    tags:       document.getElementById('editTags').value
                  .split(',').map(t => t.trim()).filter(Boolean),
    notes:      document.getElementById('editNotes').value.trim(),
  };

  saveTrades();
  closeModal();
  renderAll();
  toast('Trade updated!', 'success');
}

function deleteTrade(id) {
  if (!confirm('Delete this trade? This cannot be undone.')) return;
  trades = trades.filter(t => t.id !== id);
  saveTrades();
  renderAll();
  toast('Trade deleted', 'info');
}

function closeModal() {
  document.getElementById('editModal').classList.remove('open');
  editingId = null;
}

function setupModalClose() {
  document.getElementById('editModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
}

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────
function renderAnalysis() {
  const stats = getStats(trades);
  const grid  = document.getElementById('analysisStats');

  if (!stats) {
    grid.innerHTML = '<div class="stat-card"><div class="stat-label">No data</div><div class="stat-value">—</div></div>';
    renderEquityCurve();
    return;
  }

  const pnlClass = stats.totalPnl >= 0 ? 'green' : 'red';
  const pnlSign  = stats.totalPnl >= 0 ? '+' : '';

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Trades</div>
      <div class="stat-value">${stats.total}</div>
    </div>
    <div class="stat-card ${stats.winRate >= 50 ? 'green' : 'red'}">
      <div class="stat-label">Win Rate</div>
      <div class="stat-value ${stats.winRate >= 50 ? 'green' : 'red'}">${stats.winRate.toFixed(1)}%</div>
    </div>
    <div class="stat-card ${pnlClass}">
      <div class="stat-label">Total P&L</div>
      <div class="stat-value ${pnlClass}">${pnlSign}$${stats.totalPnl.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg R:R</div>
      <div class="stat-value">${stats.avgRR.toFixed(2)}:1</div>
    </div>
  `;

  renderEquityCurve();
  renderMonthlyBars();
  renderPerfBreakdown(stats);
  renderWinLossChart(stats);
}

// ── Equity Curve (Canvas) ─────────────────────────────────────────────────────
function renderEquityCurve() {
  const canvas = document.getElementById('equityChart');
  const ctx    = canvas.getContext('2d');
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  canvas.width  = canvas.offsetWidth || 500;
  canvas.height = 200;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (sorted.length < 2) {
    ctx.fillStyle = '#3d5166';
    ctx.font      = '12px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Need 2+ trades to plot equity curve', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Build cumulative equity
  const equity = [0];
  sorted.forEach(t => equity.push(equity[equity.length - 1] + calcPnL(t).pnl));

  const minE  = Math.min(...equity);
  const maxE  = Math.max(...equity);
  const range = maxE - minE || 1;
  const pad   = { top: 20, bottom: 30, left: 55, right: 20 };
  const w     = canvas.width  - pad.left - pad.right;
  const h     = canvas.height - pad.top  - pad.bottom;

  const toX = i => pad.left + (i / (equity.length - 1)) * w;
  const toY = v => pad.top  + h - ((v - minE) / range) * h;

  // Grid
  ctx.strokeStyle = '#1e2d3d';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y   = pad.top + (i / 4) * h;
    const val = maxE - (i / 4) * range;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + w, y);
    ctx.stroke();
    ctx.fillStyle  = '#3d5166';
    ctx.font       = '10px Share Tech Mono';
    ctx.textAlign  = 'right';
    ctx.fillText((val >= 0 ? '+' : '') + val.toFixed(0), pad.left - 4, y + 4);
  }

  // Zero line
  const zeroY = toY(0);
  ctx.strokeStyle = '#2a3f55';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.left, zeroY);
  ctx.lineTo(pad.left + w, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Gradient fill
  const isPositive = equity[equity.length - 1] >= 0;
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h);
  grad.addColorStop(0, isPositive ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,87,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.beginPath();
  equity.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.lineTo(toX(equity.length - 1), pad.top + h);
  ctx.lineTo(toX(0), pad.top + h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  const lineColor = isPositive ? '#00e676' : '#ff3d57';
  ctx.strokeStyle = lineColor;
  ctx.lineWidth   = 2;
  ctx.shadowColor = lineColor;
  ctx.shadowBlur  = 6;
  ctx.beginPath();
  equity.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Data dots
  ctx.fillStyle = lineColor;
  equity.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(toX(i), toY(v), 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── Monthly Bar Chart ─────────────────────────────────────────────────────────
function renderMonthlyBars() {
  const container = document.getElementById('monthlyBars');
  container.innerHTML = '';

  if (!trades.length) {
    container.innerHTML = '<p style="color:var(--text-dim);font-size:12px;margin:auto;">No data</p>';
    return;
  }

  // Aggregate P&L by month
  const monthly = {};
  trades.forEach(t => {
    const key = t.date.substring(0, 7);
    monthly[key] = (monthly[key] || 0) + calcPnL(t).pnl;
  });

  const keys   = Object.keys(monthly).sort();
  const vals   = keys.map(k => monthly[k]);
  const absMax = Math.max(...vals.map(Math.abs), 1);

  keys.forEach((k, i) => {
    const val   = vals[i];
    const pct   = (Math.abs(val) / absMax) * 100;
    const label = k.substring(5) + '/' + k.substring(2, 4);
    const wrap  = document.createElement('div');
    wrap.className = 'monthly-bar-wrap';

    if (val >= 0) {
      wrap.innerHTML = `
        <div class="monthly-val" style="color:var(--green)">+${val.toFixed(0)}</div>
        <div class="monthly-bar-pos" style="height:${pct}%"></div>
        <div class="monthly-label">${label}</div>
      `;
    } else {
      wrap.innerHTML = `
        <div class="monthly-val" style="color:var(--red)">${val.toFixed(0)}</div>
        <div class="monthly-bar-neg" style="height:${pct}%"></div>
        <div class="monthly-label">${label}</div>
      `;
    }
    container.appendChild(wrap);
  });
}

// ── Performance Breakdown ─────────────────────────────────────────────────────
function renderPerfBreakdown(stats) {
  const rows = [
    ['Total Trades',       stats.total],
    ['Winning Trades',     `<span style="color:var(--green)">${stats.wins}</span>`],
    ['Losing Trades',      `<span style="color:var(--red)">${stats.losses}</span>`],
    ['Win Rate',           `${stats.winRate.toFixed(2)}%`],
    ['Total P&L',          `<span style="color:${stats.totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}">${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}</span>`],
    ['Avg R:R',            `${stats.avgRR.toFixed(2)}:1`],
    ['Largest Win',        `<span style="color:var(--green)">+$${stats.largestWin.toFixed(2)}</span>`],
    ['Largest Loss',       `<span style="color:var(--red)">$${stats.largestLoss.toFixed(2)}</span>`],
    ['Max Consec Wins',    `<span style="color:var(--green)">${stats.maxConsecWin}</span>`],
    ['Max Consec Losses',  `<span style="color:var(--red)">${stats.maxConsecLoss}</span>`],
  ];

  document.getElementById('perfBreakdown').innerHTML = rows.map(([l, v]) => `
    <div class="perf-row">
      <span class="perf-label">${l}</span>
      <span class="perf-val">${v}</span>
    </div>
  `).join('');
}

// ── Win/Loss Donut Chart (Canvas) ─────────────────────────────────────────────
function renderWinLossChart(stats) {
  const canvas = document.getElementById('winLossChart');
  const ctx    = canvas.getContext('2d');

  canvas.width  = canvas.offsetWidth || 300;
  canvas.height = 200;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!stats.total) return;

  const cx       = canvas.width  / 2;
  const cy       = canvas.height / 2;
  const r        = Math.min(cx, cy) - 30;
  const winAngle = (stats.wins / stats.total) * Math.PI * 2;

  // Win slice
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + winAngle);
  ctx.closePath();
  ctx.fillStyle  = '#00e676';
  ctx.shadowColor = '#00e676';
  ctx.shadowBlur  = 10;
  ctx.fill();
  ctx.shadowBlur  = 0;

  // Loss slice
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, -Math.PI / 2 + winAngle, -Math.PI / 2 + Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#ff3d57';
  ctx.fill();

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#111720';
  ctx.fill();

  // Centre labels
  ctx.fillStyle    = '#c8d8e8';
  ctx.font         = 'bold 18px Share Tech Mono';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stats.winRate.toFixed(1) + '%', cx, cy - 8);
  ctx.font      = '10px Barlow Condensed';
  ctx.fillStyle = '#6a8298';
  ctx.fillText('WIN RATE', cx, cy + 12);

  // Legend
  ctx.font      = '11px Share Tech Mono';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#00e676';
  ctx.fillRect(10, canvas.height - 40, 10, 10);
  ctx.fillStyle = '#c8d8e8';
  ctx.fillText(`Wins: ${stats.wins}`,      24, canvas.height - 30);
  ctx.fillStyle = '#ff3d57';
  ctx.fillRect(10, canvas.height - 22, 10, 10);
  ctx.fillStyle = '#c8d8e8';
  ctx.fillText(`Losses: ${stats.losses}`,  24, canvas.height - 12);
}

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
function exportCSV() {
  if (!trades.length) { toast('No trades to export', 'error'); return; }

  const headers = ['Date','Instrument','Direction','Entry','Exit','Size',
                   'StopLoss','TakeProfit','PnL$','PnL%','RR','Tags','Notes'];

  const rows = trades.map(t => {
    const { pnl, pnlPct } = calcPnL(t);
    const rr = calcRR(t);
    return [
      t.date, t.instrument, t.direction,
      t.entry, t.exit, t.size,
      t.stopLoss || '', t.takeProfit || '',
      pnl.toFixed(2), pnlPct.toFixed(2),
      rr !== null ? rr.toFixed(2) : '',
      t.tags.join(';'),
      '"' + (t.notes || '').replace(/"/g, '""') + '"',
    ].join(',');
  });

  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `tradex_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported!', 'success');
}

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.innerHTML = `<span>${icons[type]}</span>${escHtml(msg)}`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity    = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
/** Escape HTML to prevent XSS when inserting user strings into innerHTML. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── RESIZE HANDLER ───────────────────────────────────────────────────────────
function setupResizeHandler() {
  window.addEventListener('resize', () => {
    if (document.getElementById('section-analysis').classList.contains('active')) {
      renderEquityCurve();
      const stats = getStats(trades);
      if (stats) renderWinLossChart(stats);
    }
  });
}

// ─── RENDER ALL ───────────────────────────────────────────────────────────────
function renderAll() {
  renderTrades();
  renderStats();
}

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
/**
 * Pre-populate with sample trades so the app looks useful on first open.
 * Skipped if the user already has trades in localStorage.
 */
function loadSampleData() {
  if (trades.length > 0) return;

  const samples = [
    {
      id: 's1', date: '2025-01-05', instrument: 'EUR/USD', direction: 'Long',
      entry: 1.0820, exit: 1.0890, size: 10000,
      stopLoss: 1.0780, takeProfit: 1.0900,
      tags: ['breakout', 'trend'],
      notes: 'Clean breakout above key resistance. Good R:R setup.',
    },
    {
      id: 's2', date: '2025-01-08', instrument: 'BTC/USD', direction: 'Long',
      entry: 42500, exit: 44200, size: 0.5,
      stopLoss: 41000, takeProfit: 45000,
      tags: ['momentum'],
      notes: 'Strong bullish momentum following ETF approval news.',
    },
    {
      id: 's3', date: '2025-01-10', instrument: 'AAPL', direction: 'Short',
      entry: 185, exit: 190, size: 50,
      stopLoss: 188, takeProfit: 178,
      tags: ['news', 'reversal'],
      notes: 'Earnings miss expected — fading the pop. Stopped out.',
    },
    {
      id: 's4', date: '2025-01-15', instrument: 'EUR/USD', direction: 'Short',
      entry: 1.0950, exit: 1.0880, size: 10000,
      stopLoss: 1.0990, takeProfit: 1.0860,
      tags: ['pullback'],
      notes: 'Pullback to key daily level, clean entry.',
    },
    {
      id: 's5', date: '2025-02-02', instrument: 'GBP/USD', direction: 'Long',
      entry: 1.2650, exit: 1.2720, size: 5000,
      stopLoss: 1.2610, takeProfit: 1.2780,
      tags: ['breakout'],
      notes: 'BOE decision catalyst. Breakout of 4hr range.',
    },
    {
      id: 's6', date: '2025-02-10', instrument: 'TSLA', direction: 'Long',
      entry: 215, exit: 208, size: 20,
      stopLoss: 210, takeProfit: 230,
      tags: ['momentum'],
      notes: 'Momentum entry but reversed. Stopped out for full loss.',
    },
    {
      id: 's7', date: '2025-02-18', instrument: 'ETH/USD', direction: 'Long',
      entry: 2800, exit: 3050, size: 2,
      stopLoss: 2650, takeProfit: 3200,
      tags: ['trend'],
      notes: 'Held through mid-trade volatility. Good discipline.',
    },
    {
      id: 's8', date: '2025-03-05', instrument: 'AAPL', direction: 'Long',
      entry: 172, exit: 180, size: 100,
      stopLoss: 168, takeProfit: 182,
      tags: ['earnings'],
      notes: 'Post-earnings gap fill. Held for 3 days.',
    },
    {
      id: 's9', date: '2025-03-12', instrument: 'EUR/USD', direction: 'Short',
      entry: 1.0820, exit: 1.0790, size: 10000,
      stopLoss: 1.0850, takeProfit: 1.0770,
      tags: ['scalp'],
      notes: 'Quick scalp around NFP. Fast execution required.',
    },
    {
      id: 's10', date: '2025-03-20', instrument: 'BTC/USD', direction: 'Short',
      entry: 68000, exit: 65000, size: 0.3,
      stopLoss: 70000, takeProfit: 63000,
      tags: ['reversal'],
      notes: 'Top-of-range short. Clean rejection from HTF resistance.',
    },
  ];

  samples.forEach(t => { t.createdAt = Date.now(); });
  trades = samples;
  saveTrades();
  toast('Sample trades loaded — start adding your own!', 'info');
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
