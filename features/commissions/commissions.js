function exportCommissionsCsv() {
  const rows = [["Rider", "Type", "Amount", "Status"], ...commissions];
  downloadCsv("bumu-commissions.csv", rows);
}
function renderCommissions() {
  const content = `
    <section class="grid stats">
      ${[["Total Earned", "KES 1,500"], ["Paid", "KES 500"], ["Pending", "KES 1,000"]].map(([label, value]) => `<div class="card stat-card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join("")}
    </section>
    <section class="card section" style="margin-top:16px">
      <div class="section-head"><h2>Commission Ledger</h2><button class="btn ghost" onclick="exportCommissionsCsv()">Export CSV</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Rider</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>${commissions.map(([customer, type, amount, status]) => `<tr><td>${customer}</td><td>${type}</td><td><strong>${amount}</strong></td><td>${badge(status)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
  return shell(content, "Commissions", "Track earned, paid, pending, and cancelled commission records.");
}
