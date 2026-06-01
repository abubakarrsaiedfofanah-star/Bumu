function updateSetting(name, value) {
  state.settings[name] = value;
  if (name === "theme") applyTheme();
  saveData();
  render();
}

function updateAgentProfile(name, value) {
  state.agent[name] = value;
  saveData();
}

function changePassword(event) {
  event.preventDefault();
  const p = state.password;
  if (!p.current || !p.next || !p.confirm) {
    p.message = "Fill in all password fields.";
  } else if (p.next.length < 6) {
    p.message = "New password must be at least 6 characters.";
  } else if (p.next !== p.confirm) {
    p.message = "New passwords do not match.";
  } else {
    p.current = "";
    p.next = "";
    p.confirm = "";
    p.message = "Password changed for this frontend demo.";
  }
  render();
}

function resetDemoData() {
  customers = JSON.parse(JSON.stringify(defaultCustomers));
  commissions = JSON.parse(JSON.stringify(defaultCommissions));
  state.route = "dashboard";
  state.filter = "All";
  state.search = "";
  state.step = 0;
  state.editingCustomerId = null;
  state.duplicateOverride = false;
  resetRegistrationDraft();
  state.security.auditLog = [];
  state.security.privacyMode = false;
  state.security.locked = false;
  localStorage.removeItem("bumuAgentPortalData");
  showToast("Demo data reset.");
  render();
}

async function installApp() {
  if (!deferredInstallPrompt) {
    state.installStatus = "Open the app through localhost or HTTPS, then try again. Some browsers also show Install in the address bar.";
    render();
    return;
  }
  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  state.installStatus = result.outcome === "accepted" ? "Installation started." : "Installation was dismissed.";
  deferredInstallPrompt = null;
  render();
}
function renderSettings() {
  const s = state.settings;
  const templates = [
    ["Rider OTP", "Your Bumu Paygo verification code is {OTP}. Valid for 10 minutes."],
    ["Next-of-Kin OTP", "You have been listed as next of kin for {Name}. Code: {OTP}."],
    ["Application Submitted", "Rider application for {Name} submitted. Ref: {ID}. Awaiting screening."],
    ["Application Approved", "Congratulations. {Name}'s application has been approved."],
    ["Info Required", "More info needed for {Name}'s application: {Details}."],
    ["Commission Paid", "Commission of KES {Amount} has been paid to you. Ref: {Ref}."],
  ];
  const content = `
    <div class="settings-layout">
      <section class="card section">
        <div class="section-head"><h2>Edit Agent Profile</h2></div>
        <div class="form-grid">
          <div class="field"><label>Full Name</label><input value="${state.agent.fullName}" oninput="updateAgentProfile('fullName', this.value)" /></div>
          <div class="field"><label>Agent Code</label><input value="${state.agent.agentCode}" oninput="updateAgentProfile('agentCode', this.value)" /></div>
          <div class="field"><label>Phone</label><input value="${state.agent.phone}" oninput="updateAgentProfile('phone', this.value)" /></div>
          <div class="field"><label>Email</label><input value="${state.agent.email}" oninput="updateAgentProfile('email', this.value)" /></div>
          <div class="field span-2"><label>Region / Branch</label><input value="${state.agent.region}" oninput="updateAgentProfile('region', this.value)" /></div>
        </div>
      </section>
      <section class="card section">
        <div class="section-head"><h2>Change Password</h2></div>
        <form class="form-grid" onsubmit="changePassword(event)">
          <div class="field"><label>Current Password</label><input type="password" value="${state.password.current}" oninput="state.password.current = this.value" /></div>
          <div class="field"><label>New Password</label><input type="password" value="${state.password.next}" oninput="state.password.next = this.value" /></div>
          <div class="field"><label>Confirm New Password</label><input type="password" value="${state.password.confirm}" oninput="state.password.confirm = this.value" /></div>
          <div class="field"><label>&nbsp;</label><button class="btn primary" type="submit">${icons.check} Update Password</button></div>
          <span class="subtle span-2">${state.password.message}</span>
        </form>
      </section>
      <section class="card section">
        <div class="section-head"><h2>Agent Preferences</h2></div>
        <div class="settings-list">
          ${toggleRow("smsNotifications", "SMS Notifications", "Receive OTP, approval, rejection, payment reminder, and commission SMS alerts.", s.smsNotifications)}
          ${toggleRow("inAppNotifications", "In-App Notifications", "Show portal alerts and unread badge counts in the navigation.", s.inAppNotifications)}
          ${toggleRow("paymentReminders", "Rider Payment Reminders", "Show reminders for riders whose installments are due or overdue.", s.paymentReminders)}
          ${toggleRow("compactTables", "Compact Tables", "Use tighter rows for larger rider portfolios.", s.compactTables)}
        </div>
      </section>
      <section class="card section">
        <div class="section-head"><h2>Security Display</h2></div>
        <div class="profile-grid">
          <div class="review-box"><strong>OTP Resend Limit</strong><br><span class="subtle">${s.otpResendLimit}</span></div>
          <div class="review-box"><strong>Login OTP</strong><br><span class="subtle">Required before portal access</span></div>
        </div>
      </section>
      <section class="card section">
        <div class="section-head"><h2>Theme Mode</h2></div>
        <div class="segmented">
          <button class="${s.theme === "light" ? "active" : ""}" onclick="updateSetting('theme', 'light')">Light</button>
          <button class="${s.theme === "dark" ? "active" : ""}" onclick="updateSetting('theme', 'dark')">Dark</button>
        </div>
      </section>
      <section class="card section install-panel">
        <div>
          <div class="section-head"><h2>Install App</h2></div>
          <p class="subtle">Add BUMU Agent Portal to the device so agents can launch it from the desktop or home screen.</p>
          <div class="install-status">${state.installStatus}</div>
        </div>
        <button class="btn primary" onclick="installApp()">Install App</button>
      </section>
      <section class="card section">
        <div class="section-head"><h2>Notification Templates Preview</h2></div>
        <div class="template-list">
          ${templates.map(([title, text]) => `<div class="template-item"><strong>${title}</strong><span>${text}</span></div>`).join("")}
        </div>
      </section>
      <section class="card section">
        <div class="section-head"><h2>Data & Privacy</h2></div>
        <div class="privacy-grid">
          <div class="review-box"><strong>Document Handling</strong><br><span class="subtle">KYC photos and ID images are treated as private rider documents.</span></div>
          <div class="review-box"><strong>Access Scope</strong><br><span class="subtle">Agents should only view riders registered under their portfolio.</span></div>
          <div class="review-box"><strong>Audit Trail</strong><br><span class="subtle">Production should log application submissions, edits, OTP events, and status changes.</span></div>
          <div class="review-box"><strong>Browser Storage</strong><br><span class="subtle">Agents, riders, settings, drafts, and commissions are saved in this browser with localStorage.</span></div>
        </div>
      </section>
      <section class="card section danger-zone">
        <div>
          <h2>Reset Demo Data</h2>
          <p class="subtle">Clears the active registration draft, OTP state, filters, and returns the portal to the dashboard.</p>
        </div>
        <button class="btn warn" onclick="resetDemoData()">Reset Demo Data</button>
      </section>
    </div>
  `;
  return shell(content, "Settings", "Frontend-only controls for agent preferences and registration defaults.");
}

function toggleRow(name, title, description, checked) {
  return `<label class="toggle-row">
    <span><strong>${title}</strong><br><span class="subtle">${description}</span></span>
    <input type="checkbox" ${checked ? "checked" : ""} onchange="updateSetting('${name}', this.checked)" />
  </label>`;
}
