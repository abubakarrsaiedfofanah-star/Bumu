const app = document.getElementById("app");
let deferredInstallPrompt = null;

const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z"/></svg>',
  userPlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H5a3 3 0 0 1 0-6h13v4"/><path d="M5 6h16v14H5a3 3 0 0 1-3-3V5"/><path d="M18 14h.01"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.52a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.52a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  logOut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-5"/></svg>',
};

const state = {
  loggedIn: false,
  authMode: "login",
  route: "dashboard",
  selectedCustomerId: 1,
  filter: "All",
  search: "",
  step: 0,
  loginOtpSent: false,
  loginOtpVerified: false,
  loginOtpCode: "",
  login: {
    email: "",
    password: "",
  },
  agent: {
    fullName: "Ann Mwangi",
    agentCode: "AG-2048",
    phone: "0710 888 222",
    email: "ann.mwangi@bumu.co.ke",
    region: "Nairobi",
  },
  registeredAgents: [
    {
      fullName: "Ann Mwangi",
      agentCode: "AG-2048",
      phone: "0710 888 222",
      email: "ann.mwangi@bumu.co.ke",
      region: "Nairobi",
      password: "password",
    },
  ],
  registration: {
    fullName: "",
    nationalId: "",
    phone: "",
    email: "",
    region: "",
    password: "",
    confirmPassword: "",
  },
  settings: {
    smsNotifications: true,
    inAppNotifications: true,
    paymentReminders: true,
    compactTables: false,
    defaultBikeModel: "Boxer 150",
    defaultInstallment: "Daily KES 300",
    defaultRegion: "Nairobi",
    otpExpiry: "10 minutes",
    sessionTimeout: "30 minutes",
    otpResendLimit: "3 attempts",
    theme: "light",
  },
  password: {
    current: "",
    next: "",
    confirm: "",
    message: "",
  },
  installStatus: "Install button appears when your browser allows app installation.",
  updateAvailable: false,
  loading: "",
  toast: "",
  lastSavedAt: "",
  security: {
    locked: false,
    pin: "1234",
    unlockPin: "",
    privacyMode: false,
    auditLog: [],
    failedUnlocks: 0,
  },
  customerOtp: false,
  kinOtp: false,
  otpSent: { customer: false, kin: false },
  otpAttempts: { customer: 0, kin: 0 },
  documentPreviews: {},
  documentMeta: {},
  editingCustomerId: null,
  duplicateOverride: false,
  form: {
    fullName: "",
    nationalId: "",
    phone: "",
    dob: "",
    gender: "",
    location: "",
    occupation: "",
    passport: "",
    idFront: "",
    idBack: "",
    customerOtpCode: "",
    kinName: "",
    kinPhone: "",
    relationship: "",
    kinOtpCode: "",
    bikeModel: "Boxer 150",
    chassis: "",
    deposit: "",
    installment: "Daily KES 300",
  },
  errors: {},
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  state.installStatus = "Ready to install on this device.";
  render();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  state.installStatus = "BUMU Agent Portal is installed on this device.";
  render();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              state.updateAvailable = true;
              state.toast = "App updated, reload now.";
              render();
            }
          });
        });
      })
      .catch(() => {
        state.installStatus = "Install support needs localhost or HTTPS.";
      });
  });
}

function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem("bumuAgentPortalData") || "{}");
    if (saved.state) {
      Object.assign(state, saved.state);
      migrateSavedAgents();
      migrateSecurityState();
      state.loading = "";
      state.toast = "";
      state.updateAvailable = false;
    }
    if (Array.isArray(saved.customers)) customers = saved.customers;
    if (Array.isArray(saved.commissions)) commissions = saved.commissions;
  } catch {
    localStorage.removeItem("bumuAgentPortalData");
  }
}

function migrateSavedAgents() {
  if (!Array.isArray(state.registeredAgents)) state.registeredAgents = [];
  state.registeredAgents = state.registeredAgents.map((agent) => ({
    ...agent,
    password: agent.password || (agent.email === state.registration.email ? state.registration.password : "password"),
  }));
  const hasCurrentAgent = state.registeredAgents.some((agent) => agent.email === state.agent.email);
  if (!hasCurrentAgent && state.agent.email) {
    state.registeredAgents.unshift({
      ...state.agent,
      password: state.registration.email === state.agent.email ? state.registration.password || "password" : "password",
    });
  }
}

function saveData() {
  const savedState = {
    loggedIn: state.loggedIn,
    authMode: state.authMode,
    route: state.route,
    selectedCustomerId: state.selectedCustomerId,
    filter: state.filter,
    search: state.search,
    step: state.step,
    login: state.login,
    agent: state.agent,
    registeredAgents: state.registeredAgents,
    registration: state.registration,
    settings: state.settings,
    customerOtp: state.customerOtp,
    kinOtp: state.kinOtp,
    otpSent: state.otpSent,
    otpAttempts: state.otpAttempts,
    form: state.form,
    documentPreviews: state.documentPreviews,
    documentMeta: state.documentMeta,
    editingCustomerId: state.editingCustomerId,
    duplicateOverride: state.duplicateOverride,
    lastSavedAt: state.lastSavedAt,
    security: state.security,
  };
  localStorage.setItem("bumuAgentPortalData", JSON.stringify({ state: savedState, customers, commissions }));
}

function showToast(message) {
  state.toast = message;
  render();
  setTimeout(() => {
    if (state.toast === message) {
      state.toast = "";
      render();
    }
  }, 2600);
}

function friendlyTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function migrateSecurityState() {
  state.security = {
    locked: false,
    pin: "1234",
    unlockPin: "",
    privacyMode: false,
    auditLog: [],
    failedUnlocks: 0,
    ...state.security,
  };
  if (!Array.isArray(state.security.auditLog)) state.security.auditLog = [];
  state.security.locked = false;
  state.security.unlockPin = "";
}

function audit(action, details = "") {
  state.security.auditLog = [
    { action, details, agent: state.agent.agentCode, time: new Date().toLocaleString() },
    ...(state.security.auditLog || []),
  ].slice(0, 80);
  saveData();
}

function ensureCustomerCardIds() {
  customers.forEach((customer) => {
    if (!customer.customerCardId) customer.customerCardId = generateUniqueCustomerCardId(customer.id);
  });
}

function generateUniqueCustomerCardId(seed = Date.now()) {
  let sequence = Math.max(seed, customers.length + 1);
  let cardId = "";
  do {
    const serial = String(sequence).padStart(4, "0");
    const check = cardChecksum(`${serial}:${Date.now()}:${Math.random()}`);
    cardId = `BUMU-KE-${serial}-${check}`;
    sequence += 1;
  } while (customers.some((customer) => customer.customerCardId === cardId));
  return cardId;
}

function cardChecksum(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 65535;
  }
  return hash.toString(16).toUpperCase().padStart(4, "0");
}

function reloadForUpdate() {
  window.location.reload();
}

const defaultCustomers = [
  { id: 1, customerCardId: "BUMU-KE-0001-7A3C", name: "John Doe", phone: "0712 345 678", nationalId: "23456789", bike: "Boxer 150", status: "Approved", progress: 45, lastPayment: "KES 300 today", occupation: "Courier", location: "Nairobi", chassis: "BX150-24-9182", deposit: "KES 18,000", installment: "Daily KES 300", docs: {} },
  { id: 2, customerCardId: "BUMU-KE-0002-8B4D", name: "Mary Wanjiku", phone: "0798 100 400", nationalId: "28661102", bike: "TVS Star", status: "Pending", progress: 20, lastPayment: "No payment yet", occupation: "Retailer", location: "Kiambu", chassis: "TVS-91-4408", deposit: "KES 12,000", installment: "Weekly KES 2,000", docs: {} },
  { id: 3, customerCardId: "BUMU-KE-0003-9C5E", name: "Peter Otieno", phone: "0701 904 222", nationalId: "31880044", bike: "Boxer 150", status: "Info Required", progress: 10, lastPayment: "KES 300, May 27", occupation: "Rider", location: "Kisumu", chassis: "BX150-73-1160", deposit: "KES 15,000", installment: "Daily KES 300", docs: {} },
  { id: 4, customerCardId: "BUMU-KE-0004-0D6F", name: "Amina Hassan", phone: "0744 780 900", nationalId: "25119005", bike: "TVS Star", status: "Rejected", progress: 0, lastPayment: "No payment yet", occupation: "Trader", location: "Mombasa", chassis: "TVS-12-7002", deposit: "KES 10,000", installment: "Weekly KES 2,000", docs: {} },
];

let customers = JSON.parse(JSON.stringify(defaultCustomers));

const activities = [
  ["New registration", "Mary Wanjiku submitted for screening", "Today"],
  ["Approval update", "John Doe application approved", "Yesterday"],
  ["Payment update", "KES 300 received from John Doe", "2 days ago"],
  ["More information", "Peter Otieno needs clearer ID back image", "3 days ago"],
];

const defaultCommissions = [
  ["John Doe", "Registration", "KES 500", "Paid"],
  ["Mary Wanjiku", "Registration", "KES 500", "Earned"],
  ["Amina Hassan", "Registration", "KES 500", "Cancelled"],
];

let commissions = JSON.parse(JSON.stringify(defaultCommissions));

const notifications = [
  ["Application Approved", "John Doe application is approved and ready for bike handover.", true],
  ["More Information Required", "Peter Otieno needs updated ID back image.", true],
  ["Commission Paid", "KES 500 commission has been paid.", false],
  ["Rider Payment Reminder", "John Doe daily installment is due today.", false],
  ["Application Rejected", "Amina Hassan application did not pass screening.", false],
];

loadSavedData();
ensureCustomerCardIds();

function setRoute(route, id) {
  state.route = route;
  if (id) state.selectedCustomerId = id;
  if (route === "register") applyRegistrationDefaults();
  audit("Navigation", `Opened ${route}`);
  render();
}

function applyRegistrationDefaults() {
  if (!state.form.location) state.form.location = state.settings.defaultRegion;
  if (!state.form.bikeModel) state.form.bikeModel = state.settings.defaultBikeModel;
  if (!state.form.installment) state.form.installment = state.settings.defaultInstallment;
}

function statusClass(status) {
  return status.toLowerCase().replace("pending screening", "screening").replace("info required", "info").replace(/\s+/g, "-");
}

function badge(status) {
  return `<span class="status ${statusClass(status)}">${status}</span>`;
}

function shell(content, title, subtitle = "") {
  const unread = notifications.filter((n) => n[2]).length;
  const nav = [
    { route: "dashboard", label: "Dashboard", detail: "Open overview, tasks, alerts, and today summary", icon: icons.dashboard },
    { route: "register", label: "Register", detail: "Register a new rider step by step", icon: icons.userPlus },
    { route: "customers", label: "Customers", detail: "Find riders, record payments, and follow up", icon: icons.users },
    { route: "commissions", label: "Commissions", detail: "Check commission totals and export records", icon: icons.wallet },
    { route: "notifications", label: "Notifications", detail: "Read reminders and important updates", icon: icons.bell },
    { route: "security", label: "Security", detail: "Lock the app, hide private data, export audit", icon: icons.shield },
    { route: "profile", label: "Profile", detail: "Edit agent details or sign out", icon: icons.profile },
    { route: "settings", label: "Settings", detail: "Change defaults, password, and app setup", icon: icons.settings },
  ];
  const navGroups = [undefined];

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="side-brand">
          <div class="brand-mark">B</div>
          <div><strong>BUMU</strong><br><span class="subtle">Agent Portal</span></div>
        </div>
        <div class="nav-helper">
          <strong>Choose a tab</strong>
          <span>Click one button. The page opens on the right.</span>
        </div>
        <nav class="side-nav">
          ${navGroups.map((group) => `
            <div class="nav-group">
              <div class="nav-group-title">${group}</div>
              ${nav.filter((item) => item.group === group).map((item) => `
                <button class="nav-btn ${state.route === item.route ? "active" : ""}" onclick="setRoute('${item.route}')">
                  ${item.icon}
                  <span class="nav-copy">
                    <strong>${item.label}</strong>
                    <small>${item.detail}</small>
                  </span>
                  ${item.route === "notifications" && unread ? `<span class="badge-count">${unread}</span>` : `<span class="nav-arrow">›</span>`}
                </button>
              `).join("")}
            </div>
          `).join("")}
        </nav>
          <div class="side-advanced">
            <div class="advanced-title subtle">Premium</div>
            <button class="btn" onclick="showToast('Advanced exports coming soon')">${icons.arrow} Advanced exports</button>
            <button class="btn" onclick="showToast('Risk Scoring coming soon')">${icons.shield} Risk Scoring</button>
            <button class="btn" onclick="showToast('Document Integrity coming soon')">${icons.check} Doc Integrity</button>
            <div style="height:8px"></div>
            <button class="btn ghost" onclick="logout()">${icons.logOut} Logout</button>
          </div>
      </aside>
      <main class="main">
        ${state.updateAvailable ? `<div class="update-banner"><strong>App updated, reload now</strong><span>A newer installed version is available.</span><button class="btn primary" onclick="reloadForUpdate()">Reload now</button></div>` : ""}
        ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
        ${state.loading ? `<div class="loading-overlay"><div class="loader"></div><strong>${state.loading}</strong></div>` : ""}
        <header class="topbar">
          <div class="page-title">
            <h1>${title}</h1>
            ${subtitle ? `<div class="subtle">${subtitle}</div>` : ""}
          </div>
          <div class="agent-chip">
            <div class="avatar">${initials(state.agent.fullName)}</div>
            <div><strong>${state.agent.fullName}</strong><br><span class="subtle">${state.agent.agentCode}</span></div>
          </div>
        </header>
        ${routeTip()}
        ${content}
      </main>
    </div>
  `;
}

function routeTip() {
  const tips = {
    dashboard: "Start with Register Rider, then use Rider Portfolio to track screening and repayments.",
    register: "Your draft is saved in this browser while you work. Complete each step, then submit to screening.",
    customers: "Use filters to find riders quickly. Info Required records can be reopened and resubmitted.",
    commissions: "Export CSV when you need a simple ledger for reconciliation.",
    notifications: "Unread items usually need attention from the agent desk.",
    security: "Use privacy mode and session lock when working around riders or shared devices.",
    profile: "Keep agent contact details current so OTP and rider updates reach the right person.",
    settings: "Defaults here make every new rider registration faster.",
  };
  return `<div class="helper-strip"><strong>Tip</strong><span>${tips[state.route] || tips.dashboard}</span></div>`;
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`${filename} exported.`);
}
function applyTheme() {
  document.body.classList.toggle("dark", state.settings.theme === "dark");
  document.body.classList.toggle("compact", state.settings.compactTables);
}
function render() {
  applyTheme();
  saveData();
  if (!state.loggedIn) {
    renderLogin();
    return;
  }
  if (state.security.locked) {
    app.innerHTML = renderSecurityLock();
    return;
  }

  const views = {
    dashboard: renderDashboard,
    register: renderRegister,
    customers: renderCustomers,
    "customer-details": renderCustomerDetails,
    commissions: renderCommissions,
    notifications: renderNotifications,
    security: renderSecurity,
    profile: renderProfile,
    settings: renderSettings,
  };
  app.innerHTML = (views[state.route] || renderDashboard)();
}
