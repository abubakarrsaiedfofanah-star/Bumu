function updateForm(name, value) {
  state.form[name] = value;
  if (["phone", "nationalId", "riderCardId", "chassis"].includes(name)) state.duplicateOverride = false;
  state.lastSavedAt = friendlyTime();
  saveData();
}

function validateStep(step = state.step) {
  const f = state.form;
  const errors = {};
  const required = (name, label) => {
    if (!String(f[name] || "").trim()) errors[name] = `${label} is required`;
  };

  if (step === 0) {
    ["fullName", "nationalId", "phone", "dob", "gender", "location", "occupation"].forEach((key) => required(key, key.replace(/([A-Z])/g, " $1")));
    if (f.phone && !isKenyanPhone(f.phone)) errors.phone = "Use +2547..., +2541..., 07..., or 01...";
    if (f.nationalId && !/^\d{7,8}$/.test(f.nationalId.trim())) errors.nationalId = "National ID should be 7 to 8 digits";
    if (activeDebtMatches().length) errors.duplicate = "Registration blocked: rider already has active debt with another record";
    else if (identityMatches().length && !state.duplicateOverride) errors.duplicate = "Possible duplicate: cleared rider can only continue as returning rider";
    if (f.dob) {
      const dob = new Date(f.dob);
      const age = (Date.now() - dob.getTime()) / 31557600000;
      if (Number.isNaN(dob.getTime()) || dob > new Date()) errors.dob = "Enter a valid date of birth";
      if (age < 18) errors.dob = "Rider must be at least 18 years old";
      if (age > 85) errors.dob = "Check the date of birth";
    }
  }
  if (step === 1) {
    ["passport", "idFront", "idBack"].forEach((key) => required(key, key.replace(/([A-Z])/g, " $1")));
    if (activeDebtMatches().length) errors.passport = "Duplicate has active debt. Registration blocked.";
    else if (identityMatches().length && !state.duplicateOverride) errors.passport = "Possible cleared returning rider found. Confirm duplicate check before continuing";
  }
  if (step === 2 && !state.customerOtp) errors.customerOtpCode = "Rider OTP must be verified";
  if (step === 3) {
    ["kinName", "kinPhone", "relationship"].forEach((key) => required(key, key.replace(/([A-Z])/g, " $1")));
    if (f.kinPhone && !isKenyanPhone(f.kinPhone)) errors.kinPhone = "Use +2547..., +2541..., 07..., or 01...";
  }
  if (step === 4 && !state.kinOtp) errors.kinOtpCode = "Next-of-kin OTP must be verified";
  if (step === 5) {
    ["bikeModel", "chassis", "deposit", "installment"].forEach((key) => required(key, key.replace(/([A-Z])/g, " $1")));
    const deposit = Number(String(f.deposit).replace(/[^\d.]/g, ""));
    if (f.deposit && (!deposit || deposit < 1000)) errors.deposit = "Deposit must be at least KES 1,000";
    if (deposit > 500000) errors.deposit = "Deposit looks too high; check the amount";
  }

  state.errors = errors;
  return Object.keys(errors).length === 0;
}

function isKenyanPhone(value) {
  return /^(?:\+254|254|0)(?:7|1)\d{8}$/.test(String(value).replace(/[\s-]/g, ""));
}

function nextStep() {
  if (validateStep() && state.step < steps.length - 1) state.step += 1;
  render();
}

function prevStep() {
  state.step = Math.max(0, state.step - 1);
  render();
}

function goStep(index) {
  state.step = index;
  render();
}

function handleFile(input, name) {
  const file = input.files[0];
  const errorKey = `${name}File`;
  delete state.errors[errorKey];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    state.errors[errorKey] = "Image files only";
    input.value = "";
  } else if (file.size > 5 * 1024 * 1024) {
    state.errors[errorKey] = "Maximum file size is 5MB";
    input.value = "";
  } else {
    state.form[name] = file.name;
    if (["passport", "idFront", "idBack"].includes(name)) state.duplicateOverride = false;
    state.lastSavedAt = friendlyTime();
    state.documentMeta[name] = {
      name: file.name,
      size: file.size,
      hash: simpleHash(`${file.name}:${file.size}:${file.lastModified}`),
      checkedAt: new Date().toLocaleString(),
    };
    const reader = new FileReader();
    reader.onload = () => {
      state.documentPreviews[name] = reader.result;
      audit("Document captured", `${name} saved with hash ${state.documentMeta[name].hash}`);
      saveData();
      render();
    };
    reader.readAsDataURL(file);
  }
  saveData();
  render();
}

function field(name, label, type = "text", extra = "", hint = "") {
  return `<div class="field ${extra}">
    <label>${label}</label>
    <input type="${type}" value="${state.form[name] || ""}" oninput="updateForm('${name}', this.value)" />
    ${hint ? `<span class="field-hint">${hint}</span>` : ""}
    <span class="error">${state.errors[name] || ""}</span>
  </div>`;
}

function selectField(name, label, options) {
  return `<div class="field">
    <label>${label}</label>
    <select onchange="updateForm('${name}', this.value)">
      <option value="">Select ${label}</option>
      ${options.map((option) => `<option ${state.form[name] === option ? "selected" : ""}>${option}</option>`).join("")}
    </select>
    <span class="error">${state.errors[name] || ""}</span>
  </div>`;
}

function dateSearchField(name, label) {
  return `<div class="field">
    <label>${label}</label>
    <div class="date-search">
      <span>Date</span>
      <input type="search" inputmode="numeric" placeholder="YYYY-MM-DD" value="${state.form[name] || ""}" oninput="updateForm('${name}', this.value)" />
    </div>
    <span class="error">${state.errors[name] || ""}</span>
  </div>`;
}

function fileField(name, label) {
  return `<div class="field file-drop">
    <label>${label}</label>
    <input type="file" accept="image/*" onchange="handleFile(this, '${name}')" />
    ${state.documentPreviews[name] ? `<img class="upload-preview" src="${state.documentPreviews[name]}" alt="${label} preview" />` : ""}
    <span class="subtle">${state.form[name] || "Image only, maximum 5MB"}</span>
    <span class="error">${state.errors[name] || state.errors[`${name}File`] || ""}</span>
  </div>`;
}

function renderStepContent() {
  const f = state.form;
  if (state.step === 0) {
    return `${duplicateWarning()}<div class="form-grid">
      ${field("fullName", "Full Name")}
      ${field("nationalId", "National ID Number", "text", "", "7 to 8 digits")}
      ${field("phone", "Phone Number", "tel", "", "Example: 0712345678")}
      ${field("riderCardId", "Rider Card ID (if known)")}
      ${dateSearchField("dob", "Date of Birth")}
      ${selectField("gender", "Gender", ["Female", "Male", "Other"])}
      ${field("location", "Location")}
      ${field("occupation", "Occupation", "text", "span-2")}
    </div>`;
  }
  if (state.step === 1) {
    return `${duplicateWarning()}<div class="form-grid">
      ${fileField("passport", "Passport Photo")}
      ${fileField("idFront", "ID Front Image")}
      ${fileField("idBack", "ID Back Image")}
    </div>`;
  }
  if (state.step === 2) {
    return `<div class="otp-box">
      <div class="review-box"><strong>Rider Phone</strong><br><span class="subtle">${f.phone || "Not provided"}</span></div>
      <div>${badge(state.customerOtp ? "Verified" : "Pending")}</div>
      <p class="subtle">OTP expires in 10 minutes. Maximum 3 verification attempts.</p>
      ${field("customerOtpCode", "OTP Code")}
      <span class="error">${state.errors.customerOtpCode || ""}</span>
      <div class="inline-actions">
        <button class="btn" type="button" onclick="mockSendOtp('customer')">Send OTP</button>
        <button class="btn primary" type="button" onclick="verifyOtp('customer')">${icons.check} Verify OTP</button>
      </div>
    </div>`;
  }
  if (state.step === 3) {
    return `<div class="form-grid">
      ${field("kinName", "Full Name")}
      ${field("kinPhone", "Phone Number", "tel", "", "Next-of-kin receives OTP here")}
      ${selectField("relationship", "Relationship", ["Spouse", "Parent", "Sibling", "Friend", "Guardian"])}
    </div>`;
  }
  if (state.step === 4) {
    return `<div class="otp-box">
      <div class="review-box"><strong>Next-of-Kin Phone</strong><br><span class="subtle">${f.kinPhone || "Not provided"}</span></div>
      <div>${badge(state.kinOtp ? "Verified" : "Pending")}</div>
      <p class="subtle">Next-of-kin must confirm before the application can enter screening.</p>
      ${field("kinOtpCode", "OTP Code")}
      <span class="error">${state.errors.kinOtpCode || ""}</span>
      <div class="inline-actions">
        <button class="btn" type="button" onclick="mockSendOtp('kin')">Send OTP</button>
        <button class="btn primary" type="button" onclick="verifyOtp('kin')">${icons.check} Verify OTP</button>
      </div>
    </div>`;
  }
  if (state.step === 5) {
    return `<div class="form-grid">
      ${selectField("bikeModel", "Bike Model", ["Boxer 150", "TVS Star"])}
      ${field("chassis", "Chassis Number")}
      ${field("deposit", "Deposit Amount", "text", "", "Minimum KES 1,000")}
      ${selectField("installment", "Installment Plan", ["Daily KES 300", "Weekly KES 2,000"])}
    </div>`;
  }
  return `<div class="review-grid">
    <div class="review-box"><h3>Rider Information</h3><div class="kv">
      <span><strong>Name:</strong> ${f.fullName || "-"}</span><span><strong>ID:</strong> ${f.nationalId || "-"}</span><span><strong>Phone:</strong> ${f.phone || "-"}</span><span><strong>Location:</strong> ${f.location || "-"}</span>
    </div></div>
    <div class="review-box"><h3>Next of Kin</h3><div class="kv">
      <span><strong>Name:</strong> ${f.kinName || "-"}</span><span><strong>Phone:</strong> ${f.kinPhone || "-"}</span><span><strong>Relationship:</strong> ${f.relationship || "-"}</span>
    </div></div>
    <div class="review-box"><h3>Bike Information</h3><div class="kv">
      <span><strong>Model:</strong> ${f.bikeModel || "-"}</span><span><strong>Chassis:</strong> ${f.chassis || "-"}</span><span><strong>Deposit:</strong> ${f.deposit || "-"}</span><span><strong>Plan:</strong> ${f.installment || "-"}</span>
    </div></div>
  </div>`;
}

function mockSendOtp(type) {
  state.loading = `Sending ${type === "customer" ? "rider" : "next-of-kin"} OTP...`;
  render();
  setTimeout(() => finishSendOtp(type), 450);
}

function finishSendOtp(type) {
  state.otpSent[type] = true;
  if (type === "customer") state.form.customerOtpCode = "123456";
  if (type === "kin") state.form.kinOtpCode = "123456";
  state.errors[type === "customer" ? "customerOtpCode" : "kinOtpCode"] = "";
  state.loading = "";
  showToast("OTP sent. Demo code filled automatically.");
  render();
}

function verifyOtp(type) {
  const key = type === "customer" ? "customerOtpCode" : "kinOtpCode";
  const flag = type === "customer" ? "customerOtp" : "kinOtp";
  if (!state.otpSent[type]) {
    state.errors[key] = "Send OTP before verifying";
  } else if (state.otpAttempts[type] >= 3) {
    state.errors[key] = "Maximum OTP attempts reached";
  } else if (state.form[key] === "123456") {
    state[flag] = true;
    state.errors[key] = "";
    showToast("OTP verified.");
  } else {
    state.otpAttempts[type] += 1;
    state.errors[key] = `Invalid OTP. Attempts used: ${state.otpAttempts[type]}/3`;
  }
  render();
}

function submitApplication() {
  const activeMatches = activeDebtMatches();
  if (activeMatches.length) {
    const first = activeMatches[0];
    const payment = tracePaymentSummary(first.customer);
    const agentCode = first.customer.assignedAgentCode || first.customer.agentCode || "another agent";
    state.errors.duplicate = `Blocked: Rider has active debt under ${agentCode}. Balance: ${formatTraceKes(payment.remaining)}. Matched by ${first.reasons.join(", ")}.`;
    audit("Duplicate registration blocked", `${state.form.fullName || "Draft rider"} matched ${first.customer.customerCardId || first.customer.name} by ${first.reasons.join(", ")} with active balance`);
    showToast("Registration blocked: rider has active debt.");
    render();
    return;
  }
  const firstInvalidStep = [0, 1, 2, 3, 4, 5].find((step) => !validateStep(step));
  if (firstInvalidStep !== undefined) {
    state.step = firstInvalidStep;
    render();
    return;
  }
  state.loading = "Submitting application to screening queue...";
  render();
  setTimeout(() => finishSubmitApplication(), 750);
}

function finishSubmitApplication() {
  const existing = customers.find((item) => item.id === state.editingCustomerId);
  const clearedMatch = !existing ? identityMatches().find((match) => tracePaymentSummary(match.customer).remaining <= 0) : null;
  const nextId = existing ? existing.id : Math.max(0, ...customers.map((customer) => customer.id)) + 1;
  const record = {
    id: nextId,
    customerCardId: existing?.customerCardId || generateUniqueCustomerCardId(nextId),
    name: state.form.fullName || "New Rider",
    phone: state.form.phone || "07xx xxx xxx",
    nationalId: state.form.nationalId || "-",
    bike: state.form.bikeModel,
    status: "Pending",
    progress: existing ? existing.progress : 15,
    lastPayment: existing?.lastPayment || "No payment yet",
    occupation: state.form.occupation,
    location: state.form.location,
    chassis: state.form.chassis,
    deposit: state.form.deposit,
    installment: state.form.installment,
    docs: { ...existing?.docs, ...state.documentPreviews },
    docMeta: { ...existing?.docMeta, ...state.documentMeta },
    riskScore: applicationRiskScore(),
    returningRider: !!clearedMatch,
    previousAgentCode: clearedMatch?.customer.agentCode || clearedMatch?.customer.assignedAgentCode || "",
    linkedRiderId: clearedMatch?.customer.customerCardId || "",
    assignmentNote: clearedMatch ? `Returning rider. Previous account ${clearedMatch.customer.customerCardId || ""} is fully paid and linked to this new contract.` : "",
  };
  if (existing) {
    Object.assign(existing, record);
  } else {
    customers.unshift(record);
    commissions.unshift([record.name, "Registration", "KES 500", "Earned"]);
  }
  state.selectedCustomerId = nextId;
  state.route = existing ? "customer-details" : "customers";
  state.step = 0;
  state.loading = "";
  state.editingCustomerId = null;
  resetRegistrationDraft();
  showToast(existing ? "Missing information resubmitted." : clearedMatch ? "Returning rider contract submitted." : "Application submitted to Pending Screening.");
  audit(existing ? "Application resubmitted" : clearedMatch ? "Returning rider contract submitted" : "Application submitted", `${record.name} moved to screening with risk score ${record.riskScore}`);
  saveData();
  render();
}

function resubmitInfoRequired(id) {
  const customer = customers.find((item) => item.id === id);
  if (!customer) return;
  state.form.fullName = customer.name;
  state.form.nationalId = customer.nationalId;
  state.form.phone = customer.phone;
  state.form.location = customer.location;
  state.form.occupation = customer.occupation;
  state.form.bikeModel = customer.bike;
  state.form.chassis = customer.chassis;
  state.form.deposit = customer.deposit;
  state.form.installment = customer.installment;
  state.documentPreviews = { ...(customer.docs || {}) };
  state.documentMeta = { ...(customer.docMeta || {}) };
  state.editingCustomerId = id;
  state.customerOtp = true;
  state.kinOtp = true;
  state.step = 1;
  state.route = "register";
  showToast("Info Required record reopened. Update documents and resubmit.");
  saveData();
  render();
}

function resetRegistrationDraft() {
  state.customerOtp = false;
  state.kinOtp = false;
  state.otpSent = { customer: false, kin: false };
  state.otpAttempts = { customer: 0, kin: 0 };
  state.form = emptyRegistrationForm();
  state.errors = {};
  state.documentPreviews = {};
  state.documentMeta = {};
  state.duplicateOverride = false;
}

function emptyRegistrationForm() {
  return {
    fullName: "",
    nationalId: "",
    phone: "",
    riderCardId: "",
    dob: "",
    gender: "",
    location: state.settings.defaultRegion,
    occupation: "",
    passport: "",
    idFront: "",
    idBack: "",
    customerOtpCode: "",
    kinName: "",
    kinPhone: "",
    relationship: "",
    kinOtpCode: "",
    bikeModel: state.settings.defaultBikeModel,
    chassis: "",
    deposit: "",
    installment: state.settings.defaultInstallment,
  };
}

function hasDuplicateCustomer() {
  return identityMatches().length > 0;
}

function activeDebtMatches() {
  return identityMatches().filter((match) => tracePaymentSummary(match.customer).remaining > 0);
}

function duplicateWarning() {
  const matches = identityMatches();
  if (!matches.length) return "";
  const hasActiveDebt = matches.some((match) => tracePaymentSummary(match.customer).remaining > 0);
  return `<div class="security-alert">
    <strong>Identity trace found ${matches.length} possible match${matches.length === 1 ? "" : "es"}</strong>
    <span>${hasActiveDebt ? "Registration is blocked because at least one matching rider still has active debt." : "Previous account is fully paid. Continue only as a returning rider / new contract."}</span>
    <div class="duplicate-list">
      ${matches.map((match) => duplicateMatchCard(match)).join("")}
    </div>
    ${hasActiveDebt ? `<small>Blocked until the active balance is cleared.</small>` : state.duplicateOverride ? `<small>Returning rider check approved for this draft.</small>` : `<button class="btn warn" type="button" onclick="approveDuplicateOverride()">Confirm returning rider check</button>`}
  </div>`;
}

function approveDuplicateOverride() {
  state.duplicateOverride = true;
  audit("Duplicate override", `${state.form.fullName || "Draft rider"} confirmed by agent`);
  showToast("Duplicate warning acknowledged.");
  render();
}

function identityMatches() {
  const passportHash = state.documentMeta.passport?.hash;
  const idFrontHash = state.documentMeta.idFront?.hash;
  const idBackHash = state.documentMeta.idBack?.hash;
  return customers
    .filter((customer) => customer.id !== state.editingCustomerId)
    .map((customer) => {
      const reasons = [];
      if (state.form.nationalId && customer.nationalId === state.form.nationalId) reasons.push("National ID");
      if (state.form.phone && cleanPhone(customer.phone) === cleanPhone(state.form.phone)) reasons.push("Phone");
      if (state.form.riderCardId && String(customer.customerCardId || customer.cardId || "").toLowerCase() === String(state.form.riderCardId).toLowerCase()) reasons.push("Rider card ID");
      if (state.form.chassis && String(customer.chassis || "").toLowerCase() === String(state.form.chassis).toLowerCase()) reasons.push("Chassis number");
      if (passportHash && customer.docMeta?.passport?.hash === passportHash) reasons.push("Passport fingerprint");
      if (idFrontHash && customer.docMeta?.idFront?.hash === idFrontHash) reasons.push("ID front fingerprint");
      if (idBackHash && customer.docMeta?.idBack?.hash === idBackHash) reasons.push("ID back fingerprint");
      return reasons.length ? { customer, reasons } : null;
    })
    .filter(Boolean);
}

function duplicateMatchCard(match) {
  const payment = tracePaymentSummary(match.customer);
  const balanceText = payment.remaining > 0 ? `Still owes ${formatTraceKes(payment.remaining)}` : "Fully paid";
  return `<div class="duplicate-card">
    <strong>${match.customer.customerCardId || "No card ID"}</strong>
    <span>${match.customer.name} - matched by ${match.reasons.join(", ")}</span>
    <small>${balanceText}. Paid ${formatTraceKes(payment.paid)} of ${formatTraceKes(payment.total)} (${payment.percent}%).</small>
  </div>`;
}

function cleanPhone(value) {
  return String(value || "").replace(/[\s-]/g, "");
}

function simpleHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `DOC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`;
}

function applicationRiskScore() {
  let score = 25;
  if (hasDuplicateCustomer()) score += 35;
  if (Number(String(state.form.deposit).replace(/[^\d.]/g, "")) < 10000) score += 15;
  if (!state.documentMeta.passport || !state.documentMeta.idFront || !state.documentMeta.idBack) score += 20;
  if (state.customerOtp && state.kinOtp) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function tracePaymentSummary(customer) {
  const total = customer.totalPrice || traceBikePrice(customer.bike);
  const percent = Math.max(0, Math.min(100, Number(customer.progress) || 0));
  const paid = Math.round((total * percent) / 100);
  return { total, percent, paid, remaining: Math.max(0, total - paid) };
}

function traceBikePrice(model) {
  return { "Boxer 150": 180000, "TVS Star": 150000 }[model] || 160000;
}

function formatTraceKes(amount) {
  return `KES ${Number(amount || 0).toLocaleString("en-KE")}`;
}
function renderRegister() {
  const hasDraft = Object.values(state.form).some((value) => String(value || "").trim()) || Object.keys(state.documentPreviews).length > 0;
  const content = `
    ${hasDraft ? `<div class="draft-banner"><div><strong>${state.editingCustomerId ? "Resubmission draft saved" : "Registration draft saved"}</strong><span> Autosaved${state.lastSavedAt ? ` at ${state.lastSavedAt}` : ""}. This form restores automatically after refresh.</span></div><button class="btn ghost" onclick="clearRegistrationDraft()">Clear draft</button></div>` : ""}
    <div class="wizard">
      <aside class="card steps">
        ${steps.map((label, index) => `<button class="step-btn ${state.step === index ? "active" : ""}" onclick="goStep(${index})"><span class="step-index">${index + 1}</span><span>${label}</span></button>`).join("")}
      </aside>
      <section class="card section">
        <div class="section-head"><h2>${steps[state.step]}</h2>${state.step === 2 || state.step === 4 ? "" : badge("Draft")}</div>
        ${registrationChecklist()}
        ${renderStepContent()}
        <div class="inline-actions" style="margin-top:18px">
          ${state.step > 0 ? `<button class="btn ghost" onclick="prevStep()">Back</button>` : ""}
          ${state.step < steps.length - 1 ? `<button class="btn primary" onclick="nextStep()">${icons.arrow} Continue</button>` : `<button class="btn ghost" onclick="goStep(0)">${icons.edit} Edit</button><button class="btn primary" onclick="submitApplication()">${icons.check} Submit Application</button>`}
        </div>
      </section>
    </div>
  `;
  return shell(content, "Register Rider", "Capture rider KYC, OTP verification, next-of-kin, and bike assignment.");
}

function clearRegistrationDraft() {
  state.editingCustomerId = null;
  state.step = 0;
  resetRegistrationDraft();
  showToast("Registration draft cleared.");
  render();
}

function registrationChecklist() {
  const checks = [
    ["Customer", Boolean(state.form.fullName && state.form.nationalId && state.form.phone)],
    ["Docs", Boolean(state.form.passport && state.form.idFront && state.form.idBack)],
    ["Customer OTP", state.customerOtp],
    ["Kin", Boolean(state.form.kinName && state.form.kinPhone && state.form.relationship)],
    ["Kin OTP", state.kinOtp],
    ["Bike", Boolean(state.form.bikeModel && state.form.chassis && state.form.deposit)],
  ];
  return `<div class="checklist">
    ${checks.map(([label, done]) => `<span class="${done ? "done" : ""}">${done ? icons.check : ""}${label}</span>`).join("")}
  </div>`;
}
