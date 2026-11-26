// Menambah satu siklus tagihan ke tanggal "YYYY-MM-DD"
const MONTHS = { BULANAN: 1, TRIWULAN: 3, TAHUNAN: 12 };

function addCycle(dateStr, cycle) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + MONTHS[cycle], 1));
  // Jaga tanggal akhir bulan, contoh 31 Jan + 1 bulan = 28/29 Feb
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

module.exports = { addCycle };