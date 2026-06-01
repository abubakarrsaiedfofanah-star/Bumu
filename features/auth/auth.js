function renderLogin() {
  app.innerHTML = `
    <div class="login-shell">
      <section class="login-art">
        <h1>BUMU Agent Portal</h1>
        <p>Register riders, capture KYC, verify OTPs, assign bikes, and track every application from one work-focused desk.</p>
      </section>
      <section class="login-panel">
        ${state.authMode === "login" ? loginForm() : registerAgentForm()}
      </section>
    </div>
  `;
}

function loginForm() {
  return `
        <form class="login-card" onsubmit="login(event)">
          <div class="brand-row">
            <div class="brand-mark">B</div>
            <div><strong>BUMU</strong><br><span class="subtle">Frontend demo</span></div>
          </div>
          <h2>Agent Login</h2>
          <p class="subtle">Use any email and password to enter the demo portal.</p>
          <div class="field">
            <label>Email</label>
            <input required type="email" value="${state.login.email}" placeholder="agent@bumu.co.ke" oninput="updateLoginField('email', this.value)" />
          </div>
          <div class="field">
            <label>Password</label>
            <input required type="password" value="${state.login.password}" placeholder="Enter password" oninput="updateLoginField('password', this.value)" />
            <span class="error">${state.errors.loginCredentials || ""}</span>
          </div>
          <div class="field">
            <label>Login OTP</label>
            <input value="${state.loginOtpCode}" maxlength="6" placeholder="Send OTP first" oninput="state.loginOtpCode = this.value" />
            <span class="error">${state.errors.loginOtp || ""}</span>
          </div>
          <div class="inline-actions" style="margin-bottom:16px">
            <button class="btn" type="button" onclick="sendLoginOtp()">Send OTP</button>
            <button class="btn ghost" type="button" onclick="verifyLoginOtp()">Verify OTP</button>
            ${badge(state.loginOtpVerified ? "Verified" : "Pending")}
          </div>
          <button class="btn primary full" type="submit">${icons.arrow} Login</button>
          <div class="auth-switch">
            New agent?
            <button type="button" onclick="setAuthMode('register')">Create agent account</button>
          </div>
        </form>
  `;
}

function registerAgentForm() {
  const r = state.registration;
  return `
    <form class="login-card register-card" onsubmit="registerAgent(event)">
      <div class="brand-row">
        <div class="brand-mark">B</div>
        <div><strong>BUMU</strong><br><span class="subtle">Agent onboarding</span></div>
      </div>
      <h2>Agent Registration</h2>
      <p class="subtle">Create an active agent account. Admin approval is currently disabled for this frontend demo.</p>
      <div class="registration-banner">
        <strong>Instant access</strong>
        <span>Your agent code will be generated immediately after registration.</span>
      </div>
      <div class="form-grid compact">
        ${registerField("fullName", "Full Name", r.fullName)}
        ${registerField("nationalId", "National ID Number", r.nationalId)}
        ${registerField("phone", "Phone Number", r.phone, "tel")}
        ${registerField("email", "Email Address", r.email, "email")}
        ${registerField("region", "Region / Branch", r.region)}
        ${registerField("password", "Password", r.password, "password")}
        ${registerField("confirmPassword", "Confirm Password", r.confirmPassword, "password", "span-2")}
      </div>
      <button class="btn primary full" type="submit">${icons.userPlus} Register & Enter Portal</button>
      <div class="auth-switch">
        Already registered?
        <button type="button" onclick="setAuthMode('login')">Back to login</button>
      </div>
    </form>
  `;
}

function registerField(name, label, value, type = "text", extra = "") {
  return `<div class="field ${extra}">
    <label>${label}</label>
    <input type="${type}" value="${value || ""}" oninput="state.registration.${name} = this.value" />
    <span class="error">${state.errors[`reg_${name}`] || ""}</span>
  </div>`;
}

function setAuthMode(mode) {
  state.authMode = mode;
  state.errors = {};
  render();
}

function updateLoginField(name, value) {
  state.login[name] = value;
  state.loginOtpVerified = false;
  state.errors.loginCredentials = "";
  saveData();
}

function login(event) {
  event.preventDefault();
  const agent = state.registeredAgents.find(
    (item) => item.email.toLowerCase() === state.login.email.trim().toLowerCase() && item.password === state.login.password
  );
  if (!agent) {
    state.errors.loginCredentials = "Use the email and password from agent registration";
    render();
    return;
  }
  if (!state.loginOtpVerified) {
    state.errors.loginOtp = "Verify the agent login OTP first";
    render();
    return;
  }
  state.agent = {
    fullName: agent.fullName,
    agentCode: agent.agentCode,
    phone: agent.phone,
    email: agent.email,
    region: agent.region,
  };
  state.loggedIn = true;
  state.errors = {};
  audit("Agent login", `${agent.agentCode} signed in`);
  render();
}

function registerAgent(event) {
  event.preventDefault();
  const r = state.registration;
  const errors = {};
  ["fullName", "nationalId", "phone", "email", "region", "password", "confirmPassword"].forEach((key) => {
    if (!String(r[key] || "").trim()) errors[`reg_${key}`] = "Required";
  });
  if (r.password && r.password.length < 6) errors.reg_password = "Use at least 6 characters";
  if (r.password !== r.confirmPassword) errors.reg_confirmPassword = "Passwords must match";

  state.errors = errors;
  if (Object.keys(errors).length) {
    render();
    return;
  }

  const codeSeed = String(r.nationalId).slice(-4).padStart(4, "0");
  state.agent = {
    fullName: r.fullName,
    agentCode: `BPG-${codeSeed}`,
    phone: r.phone,
    email: r.email,
    region: r.region,
  };
  state.registeredAgents = [
    { ...state.agent, password: r.password },
    ...state.registeredAgents.filter((agent) => agent.email !== state.agent.email && agent.agentCode !== state.agent.agentCode),
  ];
  state.loggedIn = true;
  state.authMode = "login";
  state.route = "dashboard";
  audit("Agent registered", `${state.agent.agentCode} created`);
  render();
}

function sendLoginOtp() {
  const agent = state.registeredAgents.find(
    (item) => item.email.toLowerCase() === state.login.email.trim().toLowerCase() && item.password === state.login.password
  );
  if (!agent) {
    state.errors.loginCredentials = "Enter your registered email and password first";
    render();
    return;
  }
  state.loading = "Sending secure login OTP...";
  render();
  setTimeout(() => {
    state.loginOtpSent = true;
    state.loginOtpCode = "654321";
    state.errors.loginOtp = "";
    state.loading = "";
    showToast("Login OTP sent. Demo code filled automatically.");
    audit("Login OTP sent", agent.agentCode);
    render();
  }, 450);
}

function verifyLoginOtp() {
  state.loginOtpVerified = state.loginOtpSent && state.loginOtpCode === "654321";
  state.errors.loginOtp = state.loginOtpVerified ? "" : "Enter the 6-digit OTP sent to the agent phone";
  if (state.loginOtpVerified) showToast("Agent OTP verified.");
  render();
}
