document.addEventListener("DOMContentLoaded", function () {

  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(function (item) {

    item.addEventListener("click", function (event) {

      event.preventDefault();

      navItems.forEach(function (nav) {
        nav.classList.remove("active");
      });

      item.classList.add("active");

      if (item.textContent.trim() === "Events") {
        showEventsPage();
      }

      if (item.textContent.trim() === "Dashboard") {
        showDashboard();
      }

    });

  });

});


function showEventsPage() {

  const dashboard = document.querySelector(".dashboard");

  dashboard.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Events</h2>
        <p>Manage events, schedules, locations and crew requirements.</p>
      </div>

      <button class="primary-button">
        + Create Event
      </button>
    </div>

    <section class="dashboard-section">

      <div class="section-header">
        <div>
          <h3>All Events</h3>
          <p>Your upcoming and previous events will appear here.</p>
        </div>
      </div>

      <div class="empty-state">
        <div class="empty-icon">📅</div>

        <h3>No events yet</h3>

        <p>
          Create your first event to start building your crew.
        </p>

        <button class="primary-button">
          + Create Event
        </button>
      </div>

    </section>
  `;
}


function showDashboard() {

  window.location.reload();

}
