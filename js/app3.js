// ── Permintaan & approval ──
function loadReq() {
  api('getPermintaan').then(list => {
    S.req = list; const can = S.u.r !== 'Manager', mgr = S.u.r !== 'Staff', f = S.rf || '';
    $('s-req').innerHTML = `<div class="head"><h1>Permintaan & Approval</h1>${can ? '<button class="btn sm" onclick="formReq()"><i class="bi bi-plus-lg"></i> Buat Permintaan</button>' : ''}</div>
    <div id="rform"></div>
    <div class="card bar"><select class="inp" aria-label="Filter status" onchange="S.rf=this.value;loadReq()">${['', 'Menunggu', 'Disetujui', 'Ditolak', 'Selesai'].map(v => `<option value="${v}" ${v === f ? 'selected' : ''}>${v || 'Semua Status'}</option>`).join('')}</select></div>
    <div class="card tw"><table><tr><th>No. Permintaan</th><th>Tanggal</th><th>Pemohon</th><th>Tujuan</th><th>Barang</th><th>Status</th><th>Aksi</th></tr>
    ${list.filter(r => !f || r.Status === f).map(r => {
      let it = []; try { it = JSON.parse(r.Item); } catch (e) {} const no = esc(r.NoPermintaan);
      return `<tr><td><code>${no}</code></td><td>${esc(r.Tanggal)}</td><td>${esc(r.Pemohon)}</td><td>${esc(r.Tujuan)}</td><td>${it.map(i => esc(i.Kode) + ' × ' + esc(i.Jumlah)).join('<br>')}</td><td><span class="chip ${r.Status}">${r.Status}</span>${r.Keputusan ? '<br><span class="muted">' + esc(r.Keputusan) + '</span>' : ''}</td>
      <td style="white-space:nowrap"><button class="btn sm sec" aria-label="Cetak permintaan" onclick="printReq('${no}')"><i class="bi bi-printer"></i></button>
      ${r.Status === 'Menunggu' && mgr ? `<button class="btn sm" onclick="putus('${no}','Disetujui')">Setujui</button> <button class="btn sm dng" onclick="putus('${no}','Ditolak')">Tolak</button>` : ''}
      ${r.Status === 'Disetujui' && can ? `<button class="btn sm sec" onclick="putus('${no}','Selesai')">Selesai</button>` : ''}</td></tr>`;
    }).join('') || '<tr><td colspan="7" class="muted">Belum ada permintaan.</td></tr>'}</table></div>`;
  }).catch(fail);
}
function formReq() {
  $('rform').innerHTML = `<div class="card" style="margin-bottom:12px">${optBrg()}<label for="r_t">Tujuan Pengambilan</label><input id="r_t" class="inp"><div id="r_i"></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sec sm" onclick="addRow()"><i class="bi bi-plus-lg"></i> Tambah Baris</button><button class="btn sm" onclick="kirimReq()">Ajukan Permintaan</button></div></div>`; addRow();
}
function addRow() {
  const d = document.createElement('div'); d.className = 'row ri';
  d.innerHTML = '<input list="dl" class="inp" placeholder="Kode barang" aria-label="Kode barang"><input type="number" min="1" class="inp" placeholder="Jumlah" aria-label="Jumlah" style="max-width:110px"><button class="btn sec" aria-label="Hapus baris" onclick="this.parentNode.remove()"><i class="bi bi-trash"></i></button>';
  $('r_i').appendChild(d);
}
function kirimReq() {
  const items = [...document.querySelectorAll('.ri')].map(r => ({ Kode: r.children[0].value.trim().toUpperCase(), Jumlah: r.children[1].value })).filter(i => i.Kode && Number(i.Jumlah) > 0);
  api('addPermintaan', { Tujuan: $('r_t').value, items }).then(r => { toast(r); loadReq(); }).catch(fail);
}
function putus(no, st) { const c = st === 'Selesai' ? '' : prompt('Catatan (opsional):') || ''; api('setStatusPermintaan', no, st, c).then(r => { toast(r); loadReq(); }).catch(fail); }
function printHTML(html) { $('printArea').innerHTML = html; window.print(); }
function kop(judul) { return `<div style="display:flex;gap:12px;align-items:center;border-bottom:2px solid #2D7A58;padding-bottom:8px;margin-bottom:12px">${S.logo ? `<img src="${S.logo}" width="52" height="52" alt="">` : ''}<div><b style="font-size:18px">${esc(S.cfg.company || 'e-Warehouse')}</b><br>${judul}</div></div>`; }
function printReq(no) {
  const r = S.req.find(x => x.NoPermintaan === no); let it = []; try { it = JSON.parse(r.Item); } catch (e) {}
  printHTML(kop('FORM PERMINTAAN BARANG') + `<p>No: <b>${esc(no)}</b> · Tanggal: ${esc(r.Tanggal)}<br>Pemohon: ${esc(r.Pemohon)}<br>Tujuan: ${esc(r.Tujuan)}<br>Status: ${esc(r.Status)}</p>
  <table class="pt"><tr><th>No</th><th>Kode</th><th>Nama Barang</th><th>Jumlah</th><th>Satuan</th></tr>${it.map((i, n) => { const b = S.b.find(x => x.Kode === i.Kode) || {}; return `<tr><td>${n + 1}</td><td>${esc(i.Kode)}</td><td>${esc(b.Nama || '-')}</td><td>${esc(i.Jumlah)}</td><td>${esc(b.Satuan || '')}</td></tr>`; }).join('')}</table>
  <div style="display:flex;justify-content:space-around;margin-top:48px;text-align:center"><div>Pemohon<br><br><br><br>( ${esc(r.Pemohon)} )</div><div>Disetujui<br><br><br><br>( ${r.Keputusan ? esc(r.Keputusan.split(':')[0]) : '..........'} )</div><div>Petugas Gudang<br><br><br><br>( .......... )</div></div>`);
}

// ── Laporan ──
const ymd = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
function rentang(j) { const n = new Date(), a = new Date(n); if (j === 'mingguan') a.setDate(n.getDate() - 6); else if (j === 'bulanan') a.setDate(1); return [ymd(a), ymd(n)]; }
function loadLap(j) {
  j = typeof j === 'string' ? j : 'harian'; const [a, b] = rentang(j), ex = S.u.r !== 'Staff';
  $('s-lap').innerHTML = `<div class="head"><h1>Laporan</h1></div>
  <div class="card bar"><select class="inp" aria-label="Jenis laporan" onchange="loadLap(this.value)">${['harian', 'mingguan', 'bulanan'].map(v => `<option ${v === j ? 'selected' : ''}>${v}</option>`).join('')}</select><span class="muted">Periode: ${a} s.d. ${b}</span></div>
  ${ex ? `<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn sm" onclick="expLap('${a}','${b}','xlsx',this)"><i class="bi bi-file-earmark-excel"></i> Export Excel</button><button class="btn sm sec" onclick="expLap('${a}','${b}','pdf',this)"><i class="bi bi-file-earmark-pdf"></i> Export PDF</button></div>` : ''}
  <div class="card tw"><table id="tl"><tr><td class="muted">Memuat…</td></tr></table></div>`;
  api('getLaporan', a, b).then(r => {
    $('tl').innerHTML = '<tr><th>Tipe</th><th>Tanggal</th><th>Kode</th><th>Barang</th><th>Disiplin</th><th>Jumlah</th><th>Lokasi</th><th>Petugas</th></tr>' +
      (r.map(x => `<tr><td><span class="chip ${x[0] === 'Masuk' ? 'ok' : 'Menipis'}">${x[0]}</span></td><td>${esc(x[1])}</td><td><code>${esc(x[2])}</code></td><td>${esc(x[3])}</td><td><span class="dsp ${esc(x[4])}">${esc(x[4])}</span></td><td class="n">${x[5]} ${esc(x[6])}</td><td>${esc(x[7])}</td><td>${esc(x[8])}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Tidak ada transaksi pada periode ini.</td></tr>');
  }).catch(fail);
}
function expLap(a, b, f, btn) { busy(btn, true); api('exportLaporan', a, b, f).then(r => { busy(btn, false); window.open(r.url, '_blank'); toast('Laporan siap diunduh.'); }).catch(e => { busy(btn, false); fail(e); }); }

// ── Pengaturan & akun ──
function loadSet() {
  const adm = S.u.r === 'Admin';
  api('getMe').then(m => {
    $('s-set').innerHTML = `<div class="head"><h1>Pengaturan & Akun</h1></div>
    ${adm ? `<div class="card frm" style="margin-bottom:14px"><div class="full"><b>Identitas Aplikasi</b></div><div class="full"><label for="st_c">Nama Perusahaan</label><input id="st_c" class="inp" value="${esc(m.cfg.company)}"></div><div class="full"><button class="btn sm" onclick="aksi(this,'setConfig','company',$('st_c').value.trim())">Simpan</button></div></div>
    <div class="card frm" style="margin-bottom:14px"><div class="full"><b>Logo Aplikasi</b></div><div class="full"><label for="lg_f">Pilih gambar logo (otomatis diperkecil)</label><input id="lg_f" type="file" accept="image/*" class="inp"></div><div class="full"><button class="btn sm" onclick="simpanLogo(this)">Simpan Logo</button></div></div>
    <div class="card frm" style="margin-bottom:14px"><div class="full"><b>Tambah Pengguna</b></div><div><label for="u_u">Username</label><input id="u_u" class="inp"></div><div><label for="u_n">Nama</label><input id="u_n" class="inp"></div><div><label for="u_p">Password (min 6)</label><input id="u_p" type="password" class="inp"></div><div><label for="u_r">Peran</label><select id="u_r" class="inp"><option>Staff</option><option>Manager</option><option>Admin</option></select></div><div class="full"><button class="btn sm" onclick="aksi(this,'addUser',{Username:$('u_u').value.trim(),Nama:$('u_n').value.trim(),Password:$('u_p').value,Peran:$('u_r').value})">Tambah Pengguna</button></div></div>` : ''}
    <div class="card frm"><div class="full"><b>Ganti Password</b></div><div><label for="g_l">Password lama</label><input id="g_l" type="password" class="inp"></div><div><label for="g_b">Password baru (min 6)</label><input id="g_b" type="password" class="inp"></div><div class="full"><button class="btn sm" onclick="aksi(this,'gantiPassword',$('g_l').value,$('g_b').value)">Ganti Password</button></div></div>`;
  }).catch(fail);
}
function aksi(btn, fn, ...a) { busy(btn, true); api(fn, ...a).then(r => { busy(btn, false); toast(r); }).catch(e => { busy(btn, false); fail(e); }); }
