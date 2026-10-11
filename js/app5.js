// ── Surat Keluar Barang: cetak (browser) & unduh PDF (Drive) ──
function suratHTML(d) {
  return kop('SURAT KELUAR BARANG') + `<p>No. Transaksi: <b>${esc(d.ID)}</b><br>Tanggal: ${esc(d.Tanggal)}<br>Peruntukan: ${esc(d.Peruntukan || '-')}${d.NoPermintaan ? '<br>No. Permintaan: ' + esc(d.NoPermintaan) : ''}</p>
  <table class="pt"><tr><th>No</th><th>Kode</th><th>Nama Barang</th><th>Jumlah</th><th>Satuan</th><th>Lokasi</th></tr>${d.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.Kode)}</td><td>${esc(i.Nama)}</td><td>${esc(i.Jumlah)}</td><td>${esc(i.Satuan)}</td><td>${esc(i.Lokasi)}</td></tr>`).join('')}</table>
  <div style="display:flex;justify-content:space-around;margin-top:48px;text-align:center"><div>Penerima<br><br><br><br>( .......... )</div><div>Mengetahui<br><br><br><br>( .......... )</div><div>Petugas Gudang<br><br><br><br>( ${esc(d.Petugas)} )</div></div>`;
}
function cetakSK(id) { api('getSuratKeluar', id).then(d => printHTML(suratHTML(d))).catch(fail); }
function unduhSK(id, btn) { busy(btn, true); api('unduhSuratKeluar', id).then(r => { busy(btn, false); window.open(r.url, '_blank'); toast('Surat siap diunduh.'); }).catch(e => { busy(btn, false); fail(e); }); }
