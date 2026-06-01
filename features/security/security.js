function renderSecurityLock() {
  return `
    <main class="lock-screen">
      <section class="card lock-card">
        <div class="brand-mark">B</div>
        <h1>Session Locked</h1>
        <p class="subtle">Enter your secure PIN to continue. Demo PIN is 1234 unless changed.</p>
        <div class="field">
          <label>Secure PIN</label>
          <input type="password" maxlength="6" value="${state.security.unlockPin}" oninput="state.security.unlockPin = this.value" onkeydown="if(event.key === 'Enter') unlockSession()" />
          <span class="error">${state.errors.unlockPin || ""}</span>
        </div>
        <button class="btn primary full" onclick="unlockSession()">${icons.shield} Unlock Portal</button>
      </section>
    </main>
  `;
}

function renderSecurity() {
  const privacy = state.security.privacyMode;
  const auditRows = (state.security.auditLog || []).slice(0, 12);
  const highRisk = customers.filter((customer) => customerRisk(customer).score >= 70).length;
  const hashedDocs = customers.reduce((count, customer) => count + Object.keys(customer.docMeta || {}).length, 0);
  const content = `
    <section class="security-hero">
      <div>
        <strong>Secure Operations Center</strong>
        <span>Privacy masking, session lock, audit trail, duplicate checks, document hashes, and application risk scoring.</span>
      </div>
      <button class="btn primary" onclick="lockSession()">${icons.shield} Lock Session</button>
    </section>
    <section class="grid stats">
      ${[
        ["Privacy Mode", privacy ? "On" : "Off"],
        ["Audit Events", (state.security.auditLog || []).length],
        ["High Risk", highRisk],
        ["Hashed Docs", hashedDocs],
      ].map(([label, value]) => `<div class="card stat-card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join("")}
    </section>
    <section class="security-grid" style="margin-top:16px">
      <div class="card section">
        <div class="section-head"><h2>Protection Controls</h2></div>
        <div class="settings-list">
          <label class="toggle-row">
            <span><strong>Privacy Mask</strong><br><span class="subtle">Hide parts of rider names, phones, and IDs on screen.</span></span>
            <input type="checkbox" ${privacy ? "checked" : ""} onchange="togglePrivacyMode(this.checked)" />
          </label>
          <label class="toggle-row">
            <span><strong>Session Lock</strong><br><span class="subtle">Require a PIN before the agent can continue using the portal.</span></span>
            <button class="btn ghost" onclick="lockSession()">Lock now</button>
          </label>
        </div>
      </div>
      <div class="card section">
        <div class="section-head"><h2>Change Secure PIN</h2></div>
        <div class="form-grid">
          <div class="field"><label>New PIN</label><input type="password" maxlength="6" value="${state.security.newPin || ""}" oninput="state.security.newPin = this.value" /></div>
          <div class="field"><label>Confirm PIN</label><input type="password" maxlength="6" value="${state.security.confirmPin || ""}" oninput="state.security.confirmPin = this.value" /></div>
          <button class="btn primary span-2" onclick="changeSecurityPin()">${icons.check} Update PIN</button>
          <span class="subtle span-2">${state.security.pinMessage || ""}</span>
        </div>
      </div>
    </section>
    <section class="card section" style="margin-top:16px">
      <div class="section-head"><h2>Audit Trail</h2><button class="btn ghost" onclick="exportAuditCsv()">Export Audit CSV</button></div>
      <div class="audit-list">
        ${auditRows.map((entry) => `<div class="audit-row"><strong>${entry.action}</strong><span>${entry.details || "No details"}</span><small>${entry.time} - ${entry.agent}</small></div>`).join("") || `<div class="empty">No audit events yet.</div>`}
      </div>
    </section>
  `;
  return shell(content, "Security Center", "Premium controls for safer agent work on shared and mobile devices.");
}

function lockSession() {
  state.security.locked = true;
  state.security.unlockPin = "";
  audit("Session locked", "Agent locked the portal");
  render();
}

function unlockSession() {
  if (state.security.unlockPin === state.security.pin) {
    state.security.locked = false;
    state.security.unlockPin = "";
    state.security.failedUnlocks = 0;
    state.errors.unlockPin = "";
    audit("Session unlocked", "PIN accepted");
    render();
    return;
  }
  state.security.failedUnlocks += 1;
  state.errors.unlockPin = `Wrong PIN. Attempts: ${state.security.failedUnlocks}`;
  audit("Failed unlock", "Wrong secure PIN entered");
  render();
}

function togglePrivacyMode(enabled) {
  state.security.privacyMode = enabled;
  audit("Privacy mode", enabled ? "Enabled rider masking" : "Disabled rider masking");
  showToast(enabled ? "Privacy mode enabled." : "Privacy mode disabled.");
  render();
}

function changeSecurityPin() {
  const next = state.security.newPin || "";
  const confirm = state.security.confirmPin || "";
  if (!/^\d{4,6}$/.test(next)) {
    state.security.pinMessage = "Use a 4 to 6 digit PIN.";
  } else if (next !== confirm) {
    state.security.pinMessage = "PINs do not match.";
  } else {
    state.security.pin = next;
    state.security.newPin = "";
    state.security.confirmPin = "";
    state.security.pinMessage = "Secure PIN updated.";
    audit("PIN changed", "Agent changed secure session PIN");
  }
  render();
}

function exportAuditCsv() {
  const rows = [["Time", "Agent", "Action", "Details"], ...(state.security.auditLog || []).map((entry) => [entry.time, entry.agent, entry.action, entry.details])];
  downloadCsv("bumu-audit-trail.csv", rows);
}
