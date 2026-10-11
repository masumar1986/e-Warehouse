window.addEventListener('error', e => { try { const t = document.getElementById('toast'); t.textContent = 'Error: ' + (e.message || e); t.className = 'toast err'; t.style.display = 'block'; } catch (x) {} });
const S = { cfg: {}, logo: '', t: null, u: null, b: [], lok: [], sup: [], ch: {}, scanner: null };
const $ = id => document.getElementById(id);
const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MENU = {
  dash: ['Dashboard', 'bi-speedometer2'], barang: ['Master Barang', 'bi-box-seam'], masuk: ['Barang Masuk', 'bi-box-arrow-in-down'],
  keluar: ['Barang Keluar', 'bi-box-arrow-up'], req: ['Permintaan & Approval', 'bi-check2-square'], lap: ['Laporan', 'bi-file-earmark-bar-graph'], set: ['Pengaturan', 'bi-gear'], lpb: ['Form LPB', 'bi-clipboard-data'], pend: ['Master Pendukung', 'bi-collection']
};
const ROLE = { Admin: ['dash', 'barang', 'masuk', 'keluar', 'req', 'lap', 'lpb', 'pend', 'set'], Manager: ['dash', 'barang', 'req', 'lap', 'lpb', 'pend', 'set'], Staff: ['dash', 'barang', 'masuk', 'keluar', 'req', 'lap', 'lpb', 'pend', 'set'] };

// ── Utilitas ──
function toast(m, err) { const t = $('toast'); t.textContent = m; t.className = 'toast' + (err ? ' err' : ''); t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3500); }
const WRITE = { addMasukBatch: 1, addKeluarBatch: 1, addMasuk: 1, addKeluar: 1, addBarang: 'm', savePendukung: 'm', deletePendukung: 'm', addPermintaan: 1, setStatusPermintaan: 1 };
const PG = {}; // status tiap halaman: kapan dimuat & apakah perlu dimuat ulang
function kotor(fn) { const m = WRITE[fn] === 'm'; Object.keys(PG).forEach(k => { if (m || (k !== 'masuk' && k !== 'keluar')) PG[k].stale = true; }); }
function pbar(on) {
  S.pend = (S.pend || 0) + (on ? 1 : -1); const b = $('pbar'); if (!b) return;
  if (S.pend > 0) { b.style.opacity = 1; b.style.width = '70%'; } else { b.style.width = '100%'; setTimeout(() => { if (!S.pend) { b.style.opacity = 0; b.style.width = 0; } }, 300); }
}
function api(fn, ...a) {
  pbar(true);
  return gasCall(fn, [S.t, ...a]).then(
    r => { pbar(false); if (r && r.success && fn in WRITE) kotor(fn); if (r && r.success) return r.data; throw new Error(r ? r.message : 'Gagal.'); },
    e => { pbar(false); throw e; });
}
function busy(btn, on) { if (!btn) return; btn.disabled = on; btn.dataset.t = btn.dataset.t || btn.innerHTML; btn.innerHTML = on ? 'Memproses…' : btn.dataset.t; }
function fail(e) { toast(e.message || 'Terjadi kesalahan', true); if (/Sesi berakhir/.test(e.message)) logout(); }

// ── Tema ──
function toggleTheme() {
  const d = document.documentElement, n = d.dataset.theme === 'dark' ? 'light' : 'dark';
  d.dataset.theme = n; try { localStorage.setItem('ew_theme', n); } catch (e) {}
  Object.values(S.ch).forEach(c => { c.options.color = n === 'dark' ? '#E8F0EC' : '#121816'; c.update(); });
}
try { const th = localStorage.getItem('ew_theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) {}

// ── Login ──
function dbg(m) { const el = $('lmsg'); if (el) el.innerHTML += '<br>' + esc(m); }
function doLogin() {
  const b = $('lb'); busy(b, true); dbg('3) Mengirim login ke server…');
  const tm = setTimeout(() => dbg('   Server belum merespons setelah 15 detik (GAS bisa lambat saat pertama dibuka).'), 15000);
  gasCall('login', [$('lu').value, $('lp').value]).then(r => {
    clearTimeout(tm); busy(b, false);
    if (!r.success) { dbg('   Ditolak server: ' + r.message); return toast(r.message, true); }
    dbg('4) Login diterima ✓, memuat data…');
    S.t = r.data.token; S.u = r.data.user;
    try { startApp(); } catch (e) { dbg('   Error tampilan: ' + e.message); $('login').style.display = 'grid'; $('app').style.display = 'none'; }
  }).catch(e => { clearTimeout(tm); busy(b, false); dbg('   Gagal: ' + (e.message || e)); });
}
function logout() { S.t = null; $('app').style.display = 'none'; $('login').style.display = 'grid'; $('lp').value = ''; }
function startApp() {
  $('login').style.display = 'none'; $('app').style.display = 'flex';
  const m = ROLE[S.u.r] || ROLE.Staff;
  $('menu').innerHTML = m.map(k => `<a data-k="${k}" onclick="nav('${k}')"><i class="bi ${MENU[k][1]}"></i>${MENU[k][0]}</a>`).join('');
  $('bottom').innerHTML = m.map(k => `<a data-k="${k}" onclick="nav('${k}')"><i class="bi ${MENU[k][1]}"></i>${MENU[k][0].split(' ')[0]}</a>`).join('');
  $('who').innerHTML = `<b>${esc(S.u.n)}</b><br>${esc(S.u.r)}`;
  document.querySelectorAll('.adm').forEach(e => e.style.display = S.u.r === 'Admin' ? '' : 'none');
  try { const c = JSON.parse(localStorage.getItem('ew_c') || 'null'); if (c) { S.b = c.b; S.lok = c.l; S.sup = c.s; } } catch (e) {}
  nav('dash', true); $('s-dash').innerHTML = '<p class="muted">Memuat dashboard…</p>';
  api('getAll').then(d => { // 1 panggilan untuk semua data awal
    S.b = d.barang; S.lok = d.lokasi; S.sup = d.supplier; S.cfg = d.cfg || {};
    try { localStorage.setItem('ew_c', JSON.stringify({ b: d.barang, l: d.lokasi, s: d.supplier })); } catch (e) {}
    paintDash(d.dash); prefetch();
  }).catch(e => { dbg('5) Gagal memuat data: ' + (e.message || e)); fail(e); });
  setInterval(() => { if (S.t) loadDash(true); }, 60000); // pembaruan berkala (≈ real-time)
}
const LD = k => ({ dash: loadDash, barang: loadBarang, masuk: formMasuk, keluar: formKeluar, req: loadReq, lap: loadLap, set: loadSet, lpb: loadLPB, pend: loadPend })[k]();
function nav(k, skip) {
  document.querySelectorAll('section.sec').forEach(s => s.classList.toggle('on', s.id === 's-' + k));
  document.querySelectorAll('[data-k]').forEach(a => a.classList.toggle('on', a.dataset.k === k));
  window.scrollTo(0, 0); S.k = k;
  const p = PG[k], form = k === 'masuk' || k === 'keluar';
  if (skip) { PG[k] = { t: Date.now() }; return; }
  if (p && !p.stale && (form || Date.now() - p.t < 45000)) return; // tampil instan dari layar yang sudah ada
  PG[k] = { t: Date.now() }; LD(k);
}
function refreshHalaman() {
  const i = $('rfi'), k = S.k || 'dash'; i.classList.add('spin');
  api('muatUlang').then(() => api('getAll')).then(d => {
    S.b = d.barang; S.lok = d.lokasi; S.sup = d.supplier; S.cfg = d.cfg || {};
    try { localStorage.setItem('ew_c', JSON.stringify({ b: d.barang, l: d.lokasi, s: d.supplier })); } catch (e) {}
    Object.keys(PG).forEach(x => delete PG[x]); PG[k] = { t: Date.now() };
    if (k === 'dash') paintDash(d.dash); else LD(k);
    toast('Data dimuat ulang.');
  }).catch(fail).finally(() => i.classList.remove('spin'));
}
function prefetch() { // siapkan halaman Master Barang & Permintaan di latar belakang
  setTimeout(() => {
    ['masuk', 'keluar'].forEach(k => { if (PG[k]) PG[k].stale = true; });
    PG.barang = { t: Date.now() }; try { renderBarang(); } catch (e) {}
    if (!PG.req) { PG.req = { t: Date.now() }; try { loadReq(); } catch (e) {} }
  }, 600);
}

// ── Dashboard ──
function loadDash(silent) {
  if (!silent && !$('s-dash').innerHTML.trim()) $('s-dash').innerHTML = '<p class="muted">Memuat dashboard…</p>';
  api('getDashboard').then(d => paintDash(d, silent)).catch(fail);
}
function paintDash(d, silent) {
  {
    const al = d.habis + d.menipis + d.expired, bl = $('bell');
    bl.textContent = al; bl.style.display = al ? '' : 'none';
    if (silent) return;
    const can = S.u.r !== 'Manager';
    $('s-dash').innerHTML = `
    <div class="head"><h1>Halo, ${esc(S.u.n)}!</h1><span class="chip">${esc(S.u.r)}</span></div>
    ${can ? `<div class="quick"><button onclick="nav('masuk')"><i class="bi bi-box-arrow-in-down"></i>Barang Masuk</button><button onclick="nav('keluar')"><i class="bi bi-box-arrow-up"></i>Barang Keluar</button><button onclick="nav('lap')"><i class="bi bi-file-earmark-bar-graph"></i>Laporan</button><button onclick="nav('req')"><i class="bi bi-file-earmark-text"></i>Permintaan</button></div>` : ''}
    <div class="kpi">
      <div class="card"><span class="muted">TOTAL STOK</span><b>${d.totalStok.toLocaleString('id-ID')}</b></div>
      <div class="card"><span class="muted">MASUK (7 HARI)</span><b>${d.masuk7.toLocaleString('id-ID')}</b></div>
      <div class="card"><span class="muted">KELUAR (7 HARI)</span><b>${d.keluar7.toLocaleString('id-ID')}</b></div>
      <div class="card"><span class="muted">ALERT KRITIS</span><b style="color:#DC2626">${al}</b><span class="muted">${d.habis} habis · ${d.menipis} menipis · ${d.expired} expired</span></div>
    </div>
    <div class="grid2"><div class="card"><b>Tren Barang Masuk vs Keluar</b><canvas id="c1" height="120"></canvas></div>
    <div class="card"><b>Stok per Disiplin</b><canvas id="c2" height="200"></canvas></div></div>
    <div class="grid2"><div class="card tw"><div style="padding:14px 16px"><b>Peringatan Stok</b></div><table><tr><th>Kode</th><th>Barang</th><th>Disiplin</th><th>Stok</th><th>Status</th></tr>
      ${d.alerts.map(x => `<tr><td><code>${esc(x.Kode)}</code></td><td>${esc(x.Nama)}</td><td><span class="dsp ${esc(x.Disiplin)}">${esc(x.Disiplin)}</span></td><td class="n">${x.Stok} ${esc(x.Satuan)}</td><td><span class="chip ${x.Status}">${x.Status}</span></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Semua stok aman</td></tr>'}</table></div>
    <div class="card"><b>Transaksi Terkini</b>${d.recent.map(r => `<p style="padding:8px 0;border-bottom:1px solid var(--bd)"><span class="chip ${r.tipe === 'Masuk' ? 'ok' : 'Menipis'}">${r.tipe}</span> <b>${r.tipe === 'Masuk' ? '+' : '-'}${r.jml} ${esc(r.sat)}</b><br>${esc(r.nama)}<br><span class="muted">${esc(r.tgl)} · ${esc(r.petugas)}</span></p>`).join('')}</div></div>`;
    const dk = document.documentElement.dataset.theme === 'dark', col = dk ? '#E8F0EC' : '#121816';
    if (typeof Chart === 'undefined') return toast('Grafik belum termuat (library internet lambat). Muat ulang halaman.', true);
    Object.values(S.ch).forEach(c => c.destroy());
    S.ch.a = new Chart($('c1'), { type: 'bar', data: { labels: d.days, datasets: [{ label: 'Masuk', data: d.mi, backgroundColor: '#086141' }, { label: 'Keluar', data: d.ko, backgroundColor: '#76DAA8' }] }, options: { color: col, plugins: { legend: { position: 'bottom' } } } });
    S.ch.b = new Chart($('c2'), { type: 'doughnut', data: { labels: Object.keys(d.disp), datasets: [{ data: Object.values(d.disp), backgroundColor: ['#64748B', '#0369A1', '#D97706', '#7C3AED', '#4CAF93'], borderWidth: 0 }] }, options: { color: col, plugins: { legend: { position: 'bottom' } } } });
  }
}
