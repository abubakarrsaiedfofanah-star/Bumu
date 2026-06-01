function renderNotifications() {
  const content = `
    <section class="card section">
      <div class="section-head">
        <h2>Agent Inbox</h2>
        <button class="btn ghost" onclick="markNotificationsRead()">Mark all read</button>
      </div>
      <div class="notification-list">
        ${notifications.map(([title, body, unread]) => `<div class="notification-item">
          <div><strong>${title}</strong><br><span class="subtle">${body}</span></div>
          <div class="inline-actions">
            ${title === "More Information Required" ? `<button class="btn ghost" onclick="setRoute('customer-details', 3)">Open</button>` : ""}
            ${unread ? badge("Pending") : badge("Verified")}
          </div>
        </div>`).join("")}
      </div>
    </section>
  `;
  return shell(content, "Notifications", "Application updates, commission events, and payment reminders.");
}

function markNotificationsRead() {
  notifications.forEach((item) => {
    item[2] = false;
  });
  showToast("Notifications marked as read.");
  render();
}
