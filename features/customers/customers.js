function setFilter(filter) {
  state.filter = filter;
  render();
}

function updateSearch(value) {
  state.search = value;
  render();
  const search = document.querySelector(".search");
  if (search) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
}
function filteredCustomers() {
  return customers.filter((customer) => {
    const matchesFilter = state.filter === "All" || customer.status === state.filter;
    const haystack = `${customer.name} ${customer.phone} ${customer.nationalId}`.toLowerCase();
    return matchesFilter && haystack.includes(state.search.toLowerCase());
  });
}

function exportCustomersCsv() {
  const rows = [
    ["Card ID", "Rider", "Phone", "National ID", "Bike", "Status", "Paid Amount", "Remaining Amount", "Payment %", "Last Payment"],
    ...filteredCustomers().map((customer) => {
      const payment = paymentSummary(customer);
      return [customer.customerCardId, customer.name, customer.phone, customer.nationalId, customer.bike, customer.status, formatKes(payment.paid), formatKes(payment.remaining), `${payment.percent}%`, customer.lastPayment];
    }),
  ];
  downloadCsv("bumu-riders.csv", rows);
}

function renderCustomers() {
  const rows = filteredCustomers();
  const filters = ["All", "Pending", "Approved", "Rejected", "Info Required"];
  const content = `
    <div class="card section">
      <div class="table-tools">
        <input class="search" value="${state.search}" placeholder="Search name, phone, or national ID" oninput="updateSearch(this.value)" />
        <div class="filters">${filters.map((filter) => `<button class="filter-btn ${state.filter === filter ? "active" : ""}" onclick="setFilter('${filter}')">${filter}</button>`).join("")}<button class="btn ghost" onclick="exportCustomersCsv()">Export CSV</button></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Rider</th><th>Card ID</th><th>Phone</th><th>Bike</th><th>Status</th><th>Payment %</th><th>Last Payment</th><th></th></tr></thead>
          <tbody>
            ${rows.map((customer) => `<tr>
              <td><strong>${secureName(customer.name)}</strong><br><span class="subtle">ID ${secureId(customer.nationalId)}</span></td>
              <td><span class="card-id-pill">${customer.customerCardId || "Generating..."}</span></td>
              <td>${securePhone(customer.phone)}</td>
              <td>${customer.bike}</td>
              <td>${badge(customer.status)}</td>
              <td><div class="progress"><div class="bar"><span style="width:${customer.progress}%"></span></div><strong>${customer.progress}%</strong></div></td>
              <td>${customer.lastPayment}</td>
              <td><button class="btn ghost" onclick="setRoute('customer-details', ${customer.id})">View</button></td>
            </tr>`).join("") || `<tr><td colspan="8"><div class="empty">No riders found.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
  return shell(content, "Rider Portfolio", "Search, filter, and open rider application details.");
}

function renderCustomerDetails() {
  const customer = customers.find((item) => item.id === state.selectedCustomerId) || customers[0];
  const docs = customer.docs || {};
  const docMeta = customer.docMeta || {};
  const payment = paymentSummary(customer);
  const risk = customerRisk(customer);
  const content = `
    <div class="details-layout">
      <section class="card section">
        <div class="section-head"><h2>Personal Information</h2>${badge(customer.status === "Pending" ? "Pending Screening" : customer.status)}</div>
        ${customerIdCard(customer, payment)}
        <div class="profile-grid">
          <div class="review-box"><strong>Name</strong><br><span class="subtle">${secureName(customer.name)}</span></div>
          <div class="review-box"><strong>ID Number</strong><br><span class="subtle">${secureId(customer.nationalId)}</span></div>
          <div class="review-box"><strong>Phone</strong><br><span class="subtle">${securePhone(customer.phone)}</span></div>
          <div class="review-box"><strong>Occupation</strong><br><span class="subtle">${customer.occupation}</span></div>
          <div class="review-box"><strong>Location</strong><br><span class="subtle">${customer.location}</span></div>
          <div class="review-box risk-card ${risk.tone}"><strong>Risk Score</strong><br><span>${risk.score}/100</span><small>${risk.label}</small></div>
        </div>
        <div class="section-head" style="margin-top:18px"><h2>Documents</h2></div>
        <div class="doc-grid">
          ${documentThumb(docs.passport, "Passport Photo")}
          ${documentThumb(docs.idFront, "ID Front")}
          ${documentThumb(docs.idBack, "ID Back")}
        </div>
        <div class="doc-meta-grid">
          ${documentMeta("Passport", docMeta.passport)}
          ${documentMeta("ID Front", docMeta.idFront)}
          ${documentMeta("ID Back", docMeta.idBack)}
        </div>
        <div class="section-head" style="margin-top:18px"><h2>Application Timeline</h2></div>
        <div class="timeline">
          ${["Draft", "Rider Verified", "NOK Verified", "Pending Screening", customer.status === "Approved" ? "Approved" : customer.status].map((item, index) => `<div class="timeline-item"><span>${index + 1}</span><strong>${item}</strong></div>`).join("")}
        </div>
      </section>
      <aside class="card section">
        <div class="section-head"><h2>Bike Details</h2></div>
        <div class="kv">
          <span><strong>Bike Model:</strong> ${customer.bike}</span>
          <span><strong>Chassis Number:</strong> ${customer.chassis}</span>
          <span><strong>Deposit:</strong> ${customer.deposit}</span>
          <span><strong>Installment Plan:</strong> ${customer.installment}</span>
          <span><strong>Application Status:</strong> ${badge(customer.status === "Pending" ? "Pending Screening" : customer.status)}</span>
        </div>
        <div class="section-head" style="margin-top:18px"><h2>Payment Progress</h2></div>
        <div class="payment-summary">
          <div><span>Total Price</span><strong>${formatKes(payment.total)}</strong></div>
          <div><span>Paid</span><strong>${formatKes(payment.paid)}</strong></div>
          <div><span>Remaining</span><strong>${formatKes(payment.remaining)}</strong></div>
          <div><span>Progress</span><strong>${payment.percent}%</strong></div>
        </div>
        <div class="progress payment-progress"><div class="bar"><span style="width:${payment.percent}%"></span></div><strong>${payment.percent}%</strong></div>
        <div class="section-head" style="margin-top:18px"><h2>Transaction History</h2></div>
        <div class="activity-list">
          <div class="activity-item"><div><strong>${customer.lastPayment}</strong><br><span class="subtle">Latest recorded payment</span></div>${badge(customer.progress > 0 ? "Paid" : "Pending")}</div>
        </div>
        <div class="inline-actions" style="margin-top:18px">
          ${customer.status === "Info Required" ? `<button class="btn primary" onclick="resubmitInfoRequired(${customer.id})">${icons.edit} Update & Resubmit</button>` : ""}
          <button class="btn ghost" onclick="setRoute('customers')">Back to Portfolio</button>
        </div>
      </aside>
    </div>
  `;
  return shell(content, customer.name, "Rider record, documents, bike assignment, and application status.");
}

function documentThumb(src, label) {
  return `<div class="doc-thumb">${src ? `<img src="${src}" alt="${label} preview" />` : `<span>${label}</span>`}</div>`;
}

function customerIdCard(customer, payment) {
  return `<div class="customer-id-card">
    <div>
      <span>BUMU RIDER CARD</span>
      <strong>${customer.customerCardId || "Generating..."}</strong>
      <small>Unique system ID. Never reused for another rider.</small>
    </div>
    <div>
      <span>Balance Status</span>
      <strong>${payment.remaining > 0 ? "Outstanding" : "Cleared"}</strong>
      <small>${payment.remaining > 0 ? `${formatKes(payment.remaining)} left` : "No company balance left"}</small>
    </div>
  </div>`;
}

function paymentSummary(customer) {
  const total = customer.totalPrice || bikePrice(customer.bike);
  const percent = Math.max(0, Math.min(100, Number(customer.progress) || 0));
  const paid = Math.round((total * percent) / 100);
  return {
    total,
    percent,
    paid,
    remaining: Math.max(0, total - paid),
  };
}

function bikePrice(model) {
  const prices = {
    "Boxer 150": 180000,
    "TVS Star": 150000,
  };
  return prices[model] || 160000;
}

function formatKes(amount) {
  return `KES ${Number(amount || 0).toLocaleString("en-KE")}`;
}

function customerRisk(customer) {
  const score = customer.riskScore ?? Math.max(0, Math.min(100, 65 - Number(customer.progress || 0) + (customer.status === "Info Required" ? 20 : 0)));
  if (score >= 70) return { score, label: "High review priority", tone: "high" };
  if (score >= 40) return { score, label: "Medium review priority", tone: "medium" };
  return { score, label: "Low review priority", tone: "low" };
}

function documentMeta(label, meta) {
  return `<div class="doc-meta"><strong>${label}</strong><span>${meta?.hash || "No hash yet"}</span><small>${meta?.checkedAt || "Upload to generate integrity hash"}</small></div>`;
}

function secureName(value) {
  if (!state.security.privacyMode) return value;
  const parts = String(value || "").split(" ");
  return `${parts[0] || "Customer"} ${parts[1] ? `${parts[1][0]}.` : ""}`;
}

function securePhone(value) {
  if (!state.security.privacyMode) return value;
  const text = String(value || "");
  return `${text.slice(0, 4)} *** ${text.slice(-3)}`;
}

function secureId(value) {
  if (!state.security.privacyMode) return value;
  const text = String(value || "");
  return `****${text.slice(-3)}`;
}
