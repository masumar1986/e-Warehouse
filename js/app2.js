// ── Master Barang ──
function loadBarang() { api('getBarang').then(d => { S.b = d.barang; S.lok = d.lokasi; S.sup = d.supplier; renderBarang(); }).catch(fail); }
function cari(q) { if (!q) return; nav('barang'); S.q = q.toLowerCase(); renderBarang(); }
function renderBarang() {
  const fd = $('fd').value, fs = $('fs').value, q = S.q || '';
  const l = S.b.filter(x => (!fd || x.Disiplin === fd) && (!fs || x.Status === fs) && (!q || (x.Kode + ' ' + x.Nama).toLowerCase().includes(q)));
  $('tb').innerHTML = '<tr><th>Kode</th><th>Nama & Keterangan</th><th>Disiplin</th><th>Satuan</th><th>Masuk</th><th>Keluar</th><th>Stok</th><th>Status</th></tr>' +
    (l.slice(0, S.lim || 100).map(x => `<tr><td><code>${esc(x.Kode)}</code></td><td><b>${esc(x.Nama)}</b><br><span class="muted">${esc(x.Keterangan)}</span></td><td><span class="dsp ${esc(x.Disiplin)}">${esc(x.Disiplin)}</span></td><td>${esc(x.Satuan)}</td><td class="n">${x.Masuk}</td><td class="n">${x.Keluar}</td><td class="n">${x.Stok}</td><td><span class="chip ${x.Status}">${x.Status}</span></td></tr>`).join('') || '<tr><td colspan="8" class="muted">Tidak ada data.</td></tr>') + (l.length > (S.lim || 100) ? `<tr><td colspan="8"><button class="btn sm sec" onclick="S.lim=(S.lim||100)+200;renderBarang()">Tampilkan lebih banyak (${l.length - (S.lim || 100)} lagi)</button></td></tr>` : '');
}
function formBarang() {
  const k = prompt('Kode barang baru (mis. PIP-002):'); if (!k) return;
  const n = prompt('Nama barang:'), d = prompt('Disiplin (Civil/Piping/Mechanical/Electrical):'), s = prompt('Satuan (Pcs/Box/Roll/…):'), m = prompt('Stok minimum:', '10');
  api('addBarang', { Kode: k.trim().toUpperCase(), Nama: n, Disiplin: d, Satuan: s, Keterangan: 'Material Utama', StokMin: Number(m) || 0 })
    .then(r => { toast(r); loadBarang(); }).catch(fail);
}

// ── Form transaksi ──
const optLok = () => S.lok.map(l => `<option>${esc(l.Nama)}</option>`).join('');
const optBrg = () => `<datalist id="dl">${S.b.map(b => `<option value="${esc(b.Kode)}">${esc(b.Nama)}</option>`).join('')}</datalist>`;
function infoKode(id, out) { const b = S.b.find(x => x.Kode === $(id).value.trim().toUpperCase()); $(out).innerHTML = b ? `<b>${esc(b.Nama)}</b> · ${esc(b.Disiplin)} · Stok: ${b.Stok} ${esc(b.Satuan)}` : '<span class="muted">Kode belum dikenali</span>'; }
function tabelRiwayat(el, list, ref, aksi) {
  $(el).innerHTML = `<tr><th>Tanggal</th><th>No. Transaksi</th><th>${ref}</th><th>Barang</th><th>Petugas</th>${aksi ? '<th>Surat</th>' : ''}</tr>` + (list.map(r => `<tr><td>${esc(r.Tanggal)}</td><td><code>${esc(r.ID)}</code></td><td>${esc(r.Ref)}${r.Pihak ? '<br><span class="muted">' + esc(r.Pihak) + '</span>' : ''}</td><td>${r.items.map(i => esc(i.Kode) + ' × ' + esc(i.Jumlah) + ' ' + esc(i.Satuan)).join('<br>')}</td><td>${esc(r.Petugas)}</td>${aksi ? `<td style="white-space:nowrap"><button class="btn sm sec" aria-label="Cetak surat" onclick="cetakSK('${esc(r.ID)}')"><i class="bi bi-printer"></i></button> <button class="btn sm sec" aria-label="Unduh PDF" onclick="unduhSK('${esc(r.ID)}',this)"><i class="bi bi-download"></i></button></td>` : ''}</tr>`).join('') || '<tr><td colspan="6" class="muted">Belum ada riwayat.</td></tr>');
}
function muatRiwayat(sheet, el, ref) { api('getRiwayat', sheet).then(l => tabelRiwayat(el, l, ref, sheet === 'Trx_Keluar')).catch(fail); }
function infoRow(el) { const b = S.b.find(x => x.Kode === el.value.trim().toUpperCase()); el.closest('.irow').querySelector('.ri-i').innerHTML = b ? `<b>${esc(b.Nama)}</b> · ${esc(b.Disiplin)} · Stok: ${b.Stok} ${esc(b.Satuan)}` : '<span class="muted">Kode belum dikenali</span>'; }
function tambahBaris(scan) {
  const w = document.createElement('div');
  w.innerHTML = `<div class="card irow" style="margin-bottom:10px"><div class="row"><input list="dl" class="inp r-k" placeholder="Kode barang" aria-label="Kode barang" oninput="infoRow(this)"><button class="btn sec" aria-label="Pindai barcode" onclick="startScan(this.closest('.irow').querySelector('.r-k'))"><i class="bi bi-upc-scan"></i></button><button class="btn sec" aria-label="Hapus baris" onclick="this.closest('.irow').remove()"><i class="bi bi-trash"></i></button></div><div class="ri-i" style="margin-bottom:8px"></div>
  <div class="frm"><div><label>Jumlah</label><input type="number" min="1" class="inp r-j"></div><div><label>Lokasi</label><select class="inp r-l">${optLok()}</select></div><div><label>Kondisi</label><select class="inp r-c"><option>Bagus</option><option>Cacat Fisik</option><option>Perlu Uji</option></select></div><div><label>Expired (opsional)</label><input type="date" class="inp r-e"></div><div><label>Harga (opsional)</label><input type="number" class="inp r-h"></div></div></div>`;
  const el = w.firstElementChild; $('m_rows').appendChild(el); if (scan) startScan(el.querySelector('.r-k'));
}
function formMasuk() {
  Promise.resolve({ barang: S.b, lokasi: S.lok, supplier: S.sup }).then(d => {
    S.b = d.barang; S.lok = d.lokasi; S.sup = d.supplier;
    $('s-masuk').innerHTML = `<div class="head"><h1>Barang Masuk (LPB)</h1><button class="btn sm scanb" style="background:#121816" onclick="tambahBaris(true)"><i class="bi bi-upc-scan"></i> Scan Barcode</button></div>
    <div class="card frm">${optBrg()}<div><label for="m_po">No. PO / Surat Jalan</label><input id="m_po" class="inp"></div><div><label for="m_s">Supplier</label><select id="m_s" class="inp">${S.sup.map(s => `<option>${esc(s.Nama)}</option>`).join('')}</select></div><div class="full"><label for="m_f">Foto Bukti / Produk (untuk seluruh transaksi)</label><input id="m_f" type="file" accept="image/*" capture="environment" class="inp"></div></div>
    <div id="m_rows" style="margin-top:12px"></div>
    <div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap"><button class="btn sec" onclick="tambahBaris()"><i class="bi bi-plus-lg"></i> Tambah Baris</button><button class="btn" id="m_b" onclick="simpanMasuk()">Simpan Transaksi & Update Stok</button></div>
    <h2 style="font-size:18px;margin:18px 0 8px">Riwayat Transaksi</h2><div class="card tw"><table id="m_h"></table></div>`;
    tambahBaris(); muatRiwayat('Trx_Masuk', 'm_h', 'No. PO');
  }).catch(fail);
}
function simpanMasuk() {
  const go = foto => {
    const items = [...document.querySelectorAll('#m_rows .irow')].map(r => ({ Kode: r.querySelector('.r-k').value.trim().toUpperCase(), Jumlah: Number(r.querySelector('.r-j').value), Lokasi: r.querySelector('.r-l').value, Kondisi: r.querySelector('.r-c').value, Expired: r.querySelector('.r-e').value, Harga: r.querySelector('.r-h').value })).filter(i => i.Kode || i.Jumlah);
    if (!items.length) return toast('Isi minimal satu barang.', true);
    for (let n = 0; n < items.length; n++) {
      if (!S.b.find(x => x.Kode === items[n].Kode)) return toast('Baris ' + (n + 1) + ': kode tidak ditemukan.', true);
      if (!(items[n].Jumlah > 0)) return toast('Baris ' + (n + 1) + ': jumlah harus lebih dari 0.', true);
    }
    const ubah = k => items.forEach(i => { const b = S.b.find(x => x.Kode === i.Kode); b.Stok += k * i.Jumlah; b.Masuk += k * i.Jumlah; });
    ubah(1); toast('Tersimpan (' + items.length + ' barang), menyinkronkan…');
    const p = { NoPO: $('m_po').value, Supplier: $('m_s').value, Foto: foto, items };
    $('m_rows').innerHTML = ''; tambahBaris(); $('m_po').value = ''; $('m_f').value = '';
    api('addMasukBatch', p).then(r => { toast(r); muatRiwayat('Trx_Masuk', 'm_h', 'No. PO'); }).catch(e => { ubah(-1); fail(e); });
  };
  const f = $('m_f').files[0];
  if (!f) return go(null);
  if (f.size > 4e6) return toast('Ukuran foto maksimal 4 MB.', true);
  const rd = new FileReader(); rd.onload = () => go({ data: rd.result.split(',')[1], type: f.type, name: f.name }); rd.readAsDataURL(f);
}
function tambahBarisK(scan) {
  const w = document.createElement('div');
  w.innerHTML = `<div class="card irow" style="margin-bottom:10px"><div class="row"><input list="dl" class="inp r-k" placeholder="Kode barang" aria-label="Kode barang" oninput="infoRow(this)"><button class="btn sec" aria-label="Pindai barcode" onclick="startScan(this.closest('.irow').querySelector('.r-k'))"><i class="bi bi-upc-scan"></i></button><button class="btn sec" aria-label="Hapus baris" onclick="this.closest('.irow').remove()"><i class="bi bi-trash"></i></button></div><div class="ri-i" style="margin-bottom:8px"></div><div class="frm"><div><label>Jumlah</label><input type="number" min="1" class="inp r-j"></div><div><label>Lokasi</label><select class="inp r-l">${optLok()}</select></div></div></div>`;
  const el = w.firstElementChild; $('k_rows').appendChild(el); if (scan) startScan(el.querySelector('.r-k'));
}
function formKeluar() {
  Promise.resolve({ barang: S.b, lokasi: S.lok, supplier: S.sup }).then(d => {
    S.b = d.barang; S.lok = d.lokasi;
    $('s-keluar').innerHTML = `<div class="head"><h1>Barang Keluar</h1><button class="btn sm scanb" style="background:#121816" onclick="tambahBarisK(true)"><i class="bi bi-upc-scan"></i> Scan Barcode</button></div>
    <div class="card frm">${optBrg()}<div><label for="k_p">Keterangan Peruntukan</label><input id="k_p" class="inp"></div><div><label for="k_n">No. Permintaan (opsional)</label><input id="k_n" class="inp"></div></div>
    <div id="k_rows" style="margin-top:12px"></div>
    <div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap"><button class="btn sec" onclick="tambahBarisK()"><i class="bi bi-plus-lg"></i> Tambah Baris</button><button class="btn" id="k_b" onclick="simpanKeluar()">Simpan Barang Keluar</button></div>
    <div id="k_done"></div>
    <h2 style="font-size:18px;margin:18px 0 8px">Riwayat Transaksi</h2><div class="card tw"><table id="k_h"></table></div>`;
    tambahBarisK(); muatRiwayat('Trx_Keluar', 'k_h', 'Peruntukan');
  }).catch(fail);
}
function simpanKeluar() {
  const items = [...document.querySelectorAll('#k_rows .irow')].map(r => ({ Kode: r.querySelector('.r-k').value.trim().toUpperCase(), Jumlah: Number(r.querySelector('.r-j').value), Lokasi: r.querySelector('.r-l').value })).filter(i => i.Kode || i.Jumlah);
  if (!items.length) return toast('Isi minimal satu barang.', true);
  const need = {};
  for (let n = 0; n < items.length; n++) {
    if (!S.b.find(x => x.Kode === items[n].Kode)) return toast('Baris ' + (n + 1) + ': kode tidak ditemukan.', true);
    if (!(items[n].Jumlah > 0)) return toast('Baris ' + (n + 1) + ': jumlah harus lebih dari 0.', true);
    need[items[n].Kode] = (need[items[n].Kode] || 0) + items[n].Jumlah;
  }
  for (const k in need) { const b = S.b.find(x => x.Kode === k); if (need[k] > b.Stok) return toast('Stok ' + k + ' tidak cukup. Tersedia: ' + b.Stok + ' ' + b.Satuan, true); }
  const ubah = m => items.forEach(i => { const b = S.b.find(x => x.Kode === i.Kode); b.Stok -= m * i.Jumlah; b.Keluar += m * i.Jumlah; });
  ubah(1); toast('Tersimpan (' + items.length + ' barang), menyinkronkan…');
  const p = { Peruntukan: $('k_p').value, NoPermintaan: $('k_n').value, items };
  $('k_rows').innerHTML = ''; tambahBarisK(); $('k_p').value = ''; $('k_n').value = '';
  api('addKeluarBatch', p).then(r => {
    toast(r.msg);
    $('k_done').innerHTML = `<div class="card" style="margin-bottom:12px"><b>${esc(r.ID)}</b> tersimpan. <button class="btn sm" onclick="cetakSK('${esc(r.ID)}')"><i class="bi bi-printer"></i> Cetak Surat</button> <button class="btn sm sec" onclick="unduhSK('${esc(r.ID)}',this)"><i class="bi bi-download"></i> Unduh PDF</button></div>`;
    muatRiwayat('Trx_Keluar', 'k_h', 'Peruntukan');
  }).catch(e => { ubah(-1); fail(e); });
}

// ── Scan barcode (kamera). Cadangan: pemindai USB/Bluetooth mengetik langsung ke kolom kode ──
function startScan(target) {
  const el = typeof target === 'string' ? $(target) : target; if (!el) return;
  $('scanBox').style.display = 'grid';
  try {
    S.scanner = new Html5Qrcode('reader');
    S.scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, txt => { stopScan(); el.value = txt.toUpperCase(); el.dispatchEvent(new Event('input')); })
      .catch(() => { toast('Kamera tidak bisa dibuka. Ketik kode manual atau pakai pemindai USB/Bluetooth.', true); stopScan(); });
  } catch (e) { toast('Pemindai tidak tersedia.', true); stopScan(); }
}
function stopScan() { $('scanBox').style.display = 'none'; if (S.scanner) { S.scanner.stop().catch(() => {}); S.scanner = null; } }
