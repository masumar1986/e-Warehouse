// ── Form LPB ──
function loadLPB() {
  const [a, b] = rentang('bulanan'), ex = S.u.r !== 'Staff';
  $('s-lpb').innerHTML = `<div class="head"><h1>Form LPB</h1></div>
  <div class="card bar"><div><label for="l_a">Dari</label><input id="l_a" type="date" class="inp" value="${S.la || a}"></div><div><label for="l_b">Sampai</label><input id="l_b" type="date" class="inp" value="${S.lb || b}"></div></div>
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"><button class="btn sm" onclick="tampilLPB()">Tampilkan</button><button class="btn sm sec" onclick="cetakLPB()"><i class="bi bi-printer"></i> Cetak</button>${ex ? '<button class="btn sm sec" onclick="expLPB(\'xlsx\',this)"><i class="bi bi-file-earmark-excel"></i> Excel</button><button class="btn sm sec" onclick="expLPB(\'pdf\',this)"><i class="bi bi-file-earmark-pdf"></i> PDF</button>' : ''}</div>
  <div class="card tw"><table id="tlpb"></table></div>`; tampilLPB();
}
const HL = '<tr><th>Kode</th><th>Nama Barang</th><th>Disiplin</th><th>Satuan</th><th>Saldo Awal</th><th>Masuk</th><th>Keluar</th><th>Saldo Akhir</th></tr>';
function tampilLPB() {
  S.la = $('l_a').value; S.lb = $('l_b').value;
  api('getLPB', S.la, S.lb).then(r => { S.lpb = r; $('tlpb').innerHTML = HL + r.map(x => `<tr><td><code>${esc(x[0])}</code></td><td>${esc(x[1])}</td><td><span class="dsp ${esc(x[2])}">${esc(x[2])}</span></td><td>${esc(x[3])}</td><td class="n">${x[4]}</td><td class="n">${x[5]}</td><td class="n">${x[6]}</td><td class="n">${x[7]}</td></tr>`).join(''); }).catch(fail);
}
function cetakLPB() { if (!S.lpb) return; printHTML(kop('LAPORAN PERSEDIAAN BARANG (LPB)<br>Periode ' + S.la + ' s.d. ' + S.lb) + '<table class="pt">' + HL + S.lpb.map(x => '<tr>' + x.map(v => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('') + '</table>'); }
function expLPB(f, btn) { busy(btn, true); api('exportLPB', S.la, S.lb, f).then(r => { busy(btn, false); window.open(r.url, '_blank'); toast('LPB siap diunduh.'); }).catch(e => { busy(btn, false); fail(e); }); }

// ── Master Pendukung ──
const PF = { Supplier: ['Nama'], Lokasi: ['Nama'], Satuan: ['Nama'], Karyawan: ['Nama', 'Jabatan', 'Kontak'] };
function loadPend(n) {
  n = typeof n === 'string' ? n : 'Supplier'; S.pn = n; const adm = S.u.r === 'Admin';
  api('getPendukung', n).then(l => {
    S.pl = l;
    $('s-pend').innerHTML = `<div class="head"><h1>Master Pendukung</h1></div>
    <div class="card bar"><select class="inp" aria-label="Jenis master" onchange="loadPend(this.value)">${Object.keys(PF).map(v => `<option ${v === n ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    ${adm ? `<div class="card frm" style="margin-bottom:12px"><input type="hidden" id="p_kode">${PF[n].map(f => `<div><label for="p_${f}">${f}</label><input id="p_${f}" class="inp"></div>`).join('')}<div class="full"><button class="btn sm" onclick="simpanPend(this)">Simpan</button> <button class="btn sm sec" onclick="loadPend('${n}')">Batal</button></div></div>` : ''}
    <div class="card tw"><table><tr><th>Kode</th>${PF[n].map(f => `<th>${f}</th>`).join('')}${adm ? '<th>Aksi</th>' : ''}</tr>${l.map((r, i) => `<tr><td><code>${esc(r.Kode)}</code></td>${PF[n].map(f => `<td>${esc(r[f])}</td>`).join('')}${adm ? `<td style="white-space:nowrap"><button class="btn sm sec" aria-label="Ubah" onclick="editPend(${i})"><i class="bi bi-pencil"></i></button> <button class="btn sm dng" aria-label="Hapus" onclick="hapusPend('${esc(r.Kode)}')"><i class="bi bi-trash"></i></button></td>` : ''}</tr>`).join('') || '<tr><td colspan="5" class="muted">Belum ada data.</td></tr>'}</table></div>`;
  }).catch(fail);
}
function editPend(i) { const r = S.pl[i]; $('p_kode').value = r.Kode; PF[S.pn].forEach(f => $('p_' + f).value = r[f] || ''); window.scrollTo(0, 0); }
function refreshMaster() { api('getBarang').then(d => { S.lok = d.lokasi; S.sup = d.supplier; }).catch(() => {}); }
function simpanPend(b) { const r = { Kode: $('p_kode').value }; PF[S.pn].forEach(f => r[f] = $('p_' + f).value.trim()); busy(b, true); api('savePendukung', S.pn, r).then(m => { busy(b, false); toast(m); loadPend(S.pn); refreshMaster(); }).catch(e => { busy(b, false); fail(e); }); }
function hapusPend(k) { if (!confirm('Hapus data ini?')) return; api('deletePendukung', S.pn, k).then(m => { toast(m); loadPend(S.pn); refreshMaster(); }).catch(fail); }

// ── Logo ──
function setLogo(uri) {
  if (!uri) return; S.logo = uri; try { localStorage.setItem('ew_logo', uri); } catch (e) {}
  document.querySelectorAll('.lgo').forEach(el => {
    if (el.tagName === 'IMG') { el.src = uri; return; }
    const im = new Image(); im.src = uri; im.className = 'lgo'; im.alt = 'Logo'; im.width = el.getAttribute('width'); im.height = el.getAttribute('height'); im.style.cssText = 'border-radius:10px;object-fit:contain'; el.replaceWith(im);
  });
}
function simpanLogo(btn) {
  const f = $('lg_f').files[0]; if (!f) return toast('Pilih gambar logo dulu.', true);
  const rd = new FileReader(), img = new Image();
  rd.onload = () => { img.onload = () => {
    const c = document.createElement('canvas'), s = Math.min(1, 256 / Math.max(img.width, img.height)); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const uri = c.toDataURL('image/png'); busy(btn, true);
    api('uploadLogo', uri.split(',')[1]).then(r => { busy(btn, false); setLogo(uri); toast(r); }).catch(e => { busy(btn, false); fail(e); });
  }; img.src = rd.result; };
  rd.readAsDataURL(f);
}
$('lmsg').textContent = '1) Skrip aktif ✓ (build 2026-10-06c)';
gasCall('ping', []).then(r => dbg('2) Server terhubung ✓ (' + r.data + ')')).catch(e => dbg('2) Server GAGAL: ' + (e.message || e)));
try { const l = localStorage.getItem('ew_logo'); if (l) setLogo(l); } catch (e) {}
gasCall('getLogoPublic', []).then(r => setLogo(r.data)).catch(() => {});

document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const g = $('gs'); if (g) g.focus(); } });
