// Transport ke backend Google Apps Script (REST API).
// POST wajib bertipe text/plain agar browser tidak mengirim preflight CORS (yang ditolak GAS).
async function gasCall(action, args) {
  if (!API_URL || API_URL.indexOf('script.google.com') < 0) throw new Error('API_URL belum diisi. Edit js/config.js lalu push ulang.');
  let res;
  try {
    res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, args: args || [] }), redirect: 'follow' });
  } catch (e) { throw new Error('Tidak bisa terhubung ke server (periksa internet dan API_URL).'); }
  if (!res.ok) throw new Error('Server membalas HTTP ' + res.status);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { throw new Error('Balasan server bukan JSON. Pastikan deployment: Execute as Me, akses Anyone, dan versi terbaru.'); }
}
