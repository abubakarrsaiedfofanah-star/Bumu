function logout() {
  state.loggedIn = false;
  state.route = "dashboard";
  render();
}
function renderProfile() {
  const content = `
    <section class="card section">
      <div class="profile-grid">
        ${[["Full Name", state.agent.fullName], ["Agent Code", state.agent.agentCode], ["Phone", state.agent.phone], ["Email", state.agent.email], ["Region", state.agent.region]].map(([label, value]) => `<div class="review-box"><strong>${label}</strong><br><span class="subtle">${value}</span></div>`).join("")}
      </div>
      <div class="inline-actions" style="margin-top:18px">
        <button class="btn">Change Password</button>
        <button class="btn warn" onclick="logout()">${icons.logOut} Logout</button>
      </div>
    </section>
  `;
  return shell(content, "Agent Profile", "Manage your agent information and account actions.");
}
