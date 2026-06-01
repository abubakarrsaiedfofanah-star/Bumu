function renderDashboard() {
  const approved = customers.filter((customer) => customer.status === "Approved").length;
  const pending = customers.filter((customer) => customer.status === "Pending").length;
  const rejected = customers.filter((customer) => customer.status === "Rejected").length;
  const info = customers.filter((customer) => customer.status === "Info Required").length;
  const averageProgress = customers.length ? Math.round(customers.reduce((sum, customer) => sum + customer.progress, 0) / customers.length) : 0;
  const paidCommissions = commissions.filter((item) => item[3] === "Paid").length;
  const earnedCommissions = commissions.filter((item) => item[3] === "Earned").length;
  const cancelledCommissions = commissions.filter((item) => item[3] === "Cancelled").length;
  const stats = [
    ["Total Riders", customers.length],
    ["Active Riders", approved],
    ["Pending Applications", pending],
    ["Approved Applications", approved],
    ["Rejected Applications", rejected],
    ["Commission Balance", "KES 1,000"],
  ];
  const attention = customers.filter((customer) => customer.status === "Info Required");

  return shell(`
    <section class="welcome-panel">
      <div>
        <strong>Welcome back, ${state.agent.fullName.split(" ")[0]}</strong>
        <span>${attention.length ? `${attention.length} rider record needs missing details.` : "Everything important is moving. Keep new registrations coming."}</span>
      </div>
      <div class="inline-actions">
        ${attention.length ? `<button class="btn primary" onclick="setRoute('customer-details', ${attention[0].id})">${icons.edit} Fix Info Required</button>` : ""}
        <button class="btn ghost" onclick="setRoute('register')">${icons.userPlus} New Rider</button>
      </div>
    </section>
    <section class="grid stats">
      ${stats.map(([label, value]) => `<div class="card stat-card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join("")}
    </section>
    <section class="card section" style="margin-top:16px">
      <div class="section-head"><h2>Performance Charts</h2></div>
      <div class="chart-grid">
        ${chartBar("Approved", approved, customers.length, "approved")}
        ${chartBar("Pending", pending, customers.length, "pending")}
        ${chartBar("Rejected", rejected, customers.length, "rejected")}
        ${chartBar("Info Required", info, customers.length, "info")}
        ${chartBar("Average Repayment", averageProgress, 100, "approved")}
        ${chartBar("Commission Trend", paidCommissions + earnedCommissions, Math.max(1, commissions.length), "approved")}
      </div>
      <div class="mini-chart" aria-label="Commission trend">
        ${[paidCommissions, earnedCommissions, cancelledCommissions].map((value, index) => `<span class="${["approved", "pending", "rejected"][index]}" style="height:${Math.max(12, value * 28)}px"></span>`).join("")}
      </div>
    </section>
    <section class="grid two-col" style="margin-top:16px">
      <div class="card section">
        <div class="section-head"><h2>Recent Activities</h2></div>
        <div class="activity-list">
          ${activities.map(([title, body, time]) => `<div class="activity-item"><div><strong>${title}</strong><br><span class="subtle">${body}</span></div><span class="subtle">${time}</span></div>`).join("")}
        </div>
      </div>
      <div class="card section">
        <div class="section-head"><h2>Quick Actions</h2></div>
        <div class="quick-actions">
          <button class="btn primary" onclick="setRoute('register')">${icons.userPlus} Register Rider</button>
          <button class="btn" onclick="setRoute('customers')">${icons.users} View Riders</button>
          <button class="btn" onclick="setRoute('commissions')">${icons.wallet} View Commissions</button>
        </div>
      </div>
    </section>
  `, "Dashboard", "A quick view of registrations, application movement, and earnings.");
}

function chartBar(label, value, max, tone) {
  const width = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return `<div class="chart-row">
    <div><strong>${label}</strong><span>${value}${label.includes("Repayment") ? "%" : ""}</span></div>
    <div class="chart-track"><span class="${tone}" style="width:${width}%"></span></div>
  </div>`;
}
