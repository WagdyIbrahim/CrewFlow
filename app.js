document.addEventListener("DOMContentLoaded", function () {

  setupNavigation();

  setupGlobalActions();

});


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(function (item) {

    item.addEventListener("click", function (event) {

      event.preventDefault();

      navItems.forEach(function (nav) {
        nav.classList.remove("active");
      });

      item.classList.add("active");

      const page = item.textContent.trim();

      if (page === "Events") {
        showEventsPage();
        return;
      }

      if (page === "Dashboard") {
        showDashboard();
        return;
      }

    });

  });

}


/* =========================================================
   GLOBAL ACTIONS
========================================================= */

function setupGlobalActions() {

  document.addEventListener("click", function (event) {

    const createButton = event.target.closest(".primary-button");

    if (
      createButton &&
      createButton.textContent.includes("Create Event")
    ) {
      showCreateEvent();
      return;
    }

  });

}


/* =========================================================
   DASHBOARD
========================================================= */

function showDashboard() {

  window.location.reload();

}


/* =========================================================
   EVENTS PAGE
========================================================= */

function showEventsPage() {

  const dashboard = document.querySelector(".dashboard");

  if (!dashboard) {
    return;
  }


  const events = JSON.parse(
    localStorage.getItem("crewflow_events") || "[]"
  );


  let eventsContent = "";


  if (events.length === 0) {

    eventsContent = `

      <div class="empty-state">

        <div class="empty-icon">
          📅
        </div>

        <h3>
          No events yet
        </h3>

        <p>
          Create your first event to start building your crew.
        </p>

        <button
          type="button"
          class="primary-button"
          id="createEventEmptyButton"
        >
          + Create Event
        </button>

      </div>

    `;

  } else {

    eventsContent = `

      <div class="events-list">

        ${events.map(function (event) {

          return `

            <div class="event-card">

              <div class="event-card-main">

                <div class="event-icon">
                  📅
                </div>

                <div>

                  <h3>
                    ${event.name || "Unnamed Event"}
                  </h3>

                  <p>
                    ${event.client || "No client specified"}
                  </p>

                </div>

              </div>


              <div class="event-details">

                <span>
                  📆 ${event.date || "No date"}
                </span>

                <span>
                  🕐 ${event.startTime || "--"} - ${event.endTime || "--"}
                </span>

                <span>
                  📍 ${event.location || "No location"}
                </span>

                <span>
                  👥 ${event.headcount || "0"} crew
                </span>


                <button
                  type="button"
                  class="secondary-button event-view-button"
                  data-event-id="${event.id}"
                >
                  View Details
                </button>

              </div>

            </div>

          `;

        }).join("")}

      </div>

    `;

  }


  dashboard.innerHTML = `

    <div class="page-header">

      <div>

        <h2>
          Events
        </h2>

        <p>
          Manage events, schedules, locations and crew requirements.
        </p>

      </div>


      <button
        type="button"
        class="primary-button"
        id="createEventTopButton"
      >
        + Create Event
      </button>

    </div>


    <section class="dashboard-section">

      <div class="section-header">

        <div>

          <h3>
            All Events
          </h3>

          <p>
            ${events.length} event${events.length === 1 ? "" : "s"} registered.
          </p>

        </div>

      </div>


      ${eventsContent}

    </section>

  `;


  /* =========================================================
     CREATE EVENT BUTTONS
  ========================================================= */

  const createTopButton =
    document.getElementById("createEventTopButton");

  if (createTopButton) {

    createTopButton.addEventListener("click", function () {

      showCreateEvent();

    });

  }


  const createEmptyButton =
    document.getElementById("createEventEmptyButton");

  if (createEmptyButton) {

    createEmptyButton.addEventListener("click", function () {

      showCreateEvent();

    });

  }


  /* =========================================================
     VIEW DETAILS BUTTONS
  ========================================================= */

  const viewButtons =
    document.querySelectorAll(".event-view-button");


  viewButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {

      event.preventDefault();

      event.stopPropagation();

      const eventId =
        button.getAttribute("data-event-id");


      showEventDetails(eventId);

    });

  });

}


/* =========================================================
   EVENT DETAILS
========================================================= */

function showEventDetails(eventId) {

  const events = JSON.parse(
    localStorage.getItem("crewflow_events") || "[]"
  );


  const event = events.find(function (item) {

    return String(item.id) === String(eventId);

  });


  if (!event) {

    alert("Event not found.");

    return;

  }


  const dashboard = document.querySelector(".dashboard");


  if (!dashboard) {
    return;
  }


  dashboard.innerHTML = `

    <div class="page-header">

      <div>

        <h2>
          Event Details
        </h2>

        <p>
          Complete operational information for this event.
        </p>

      </div>


      <button
        type="button"
        class="secondary-button"
        id="backToEvents"
      >
        ← Back to Events
      </button>

    </div>


    <section class="dashboard-section">

      <div class="section-header">

        <h3>
          ${event.name || "Unnamed Event"}
        </h3>

        <p>
          ${event.client || "No client specified"}
        </p>

      </div>


      <div class="event-form">

        <div class="form-grid">


          <div class="form-group">

            <label>
              Event Date
            </label>

            <input
              type="text"
              value="${event.date || "--"}"
              readonly
            >

          </div>


          <div class="form-group">

            <label>
              Client
            </label>

            <input
              type="text"
              value="${event.client || "--"}"
              readonly
            >

          </div>


          <div class="form-group">

            <label>
              Call / Assembly Time
            </label>

            <input
              type="text"
              value="${event.callTime || "--"}"
              readonly
            >

          </div>


          <div class="form-group">

            <label>
              Start Time
            </label>

            <input
              type="text"
              value="${event.startTime || "--"}"
              readonly
            >

          </div>


          <div class="form-group">

            <label>
              End Time
            </label>

            <input
              type="text"
              value="${event.endTime || "--"}"
              readonly
            >

          </div>


          <div class="form-group">

            <label>
              Required Headcount
            </label>

            <input
              type="text"
              value="${event.headcount || "0"}"
              readonly
            >

          </div>


          <div class="form-group full-width">

            <label>
              Location
            </label>

            <input
              type="text"
              value="${event.location || "--"}"
              readonly
            >

          </div>


          <div class="form-group full-width">

            <label>
              Google Maps
            </label>

            ${
              event.maps
                ? `
                  <a
                    href="${event.maps}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="maps-link"
                  >
                    Open Location in Google Maps
                  </a>
                `
                : `
                  <input
                    type="text"
                    value="No Google Maps link"
                    readonly
                  >
                `
            }

          </div>


          <div class="form-group">

            <label>
              Team Leader
            </label>

            <input
              type="text"
              value="${event.teamLeader || "--"}"
              readonly
            >

          </div>


          <div class="form-group full-width">

            <label>
              Notes
            </label>

            <textarea
              rows="5"
              readonly
            >${event.notes || "--"}</textarea>

          </div>


        </div>


        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="backToEventsBottom"
          >
            ← Back to Events
          </button>

        </div>

      </div>

    </section>

  `;


  /* =========================================================
     BACK BUTTONS
  ========================================================= */

  const backTop =
    document.getElementById("backToEvents");

  if (backTop) {

    backTop.addEventListener("click", function () {

      showEventsPage();

    });

  }


  const backBottom =
    document.getElementById("backToEventsBottom");

  if (backBottom) {

    backBottom.addEventListener("click", function () {

      showEventsPage();

    });

  }

}


/* =========================================================
   CREATE EVENT
========================================================= */

function showCreateEvent() {

  const dashboard = document.querySelector(".dashboard");


  if (!dashboard) {
    return;
  }


  dashboard.innerHTML = `

    <div class="page-header">

      <div>

        <h2>
          Create Event
        </h2>

        <p>
          Enter the basic information for the new event.
        </p>

      </div>

    </div>


    <section class="dashboard-section">

      <div class="section-header">

        <h3>
          Event Information
        </h3>

        <p>
          Basic details about the event and its schedule.
        </p>

      </div>


      <form class="event-form">

        <div class="form-grid">


          <div class="form-group">

            <label for="eventName">
              Event Name
            </label>

            <input
              type="text"
              id="eventName"
              placeholder="Enter event name"
              required
            >

          </div>


          <div class="form-group">

            <label for="clientName">
              Client
            </label>

            <input
              type="text"
              id="clientName"
              placeholder="Enter client name"
            >

          </div>


          <div class="form-group">

            <label for="eventDate">
              Event Date
            </label>

            <input
              type="date"
              id="eventDate"
              required
            >

          </div>


          <div class="form-group">

            <label for="callTime">
              Call / Assembly Time
            </label>

            <input
              type="time"
              id="callTime"
            >

          </div>


          <div class="form-group">

            <label for="startTime">
              Start Time
            </label>

            <input
              type="time"
              id="startTime"
            >

          </div>


          <div class="form-group">

            <label for="endTime">
              End Time
            </label>

            <input
              type="time"
              id="endTime"
            >

          </div>


          <div class="form-group full-width">

            <label for="location">
              Location
            </label>

            <input
              type="text"
              id="location"
              placeholder="Enter event location"
            >

          </div>


          <div class="form-group full-width">

            <label for="maps">
              Google Maps Link
            </label>

            <input
              type="url"
              id="maps"
              placeholder="https://maps.google.com/..."
            >

          </div>


          <div class="form-group">

            <label for="headcount">
              Required Headcount
            </label>

            <input
              type="number"
              id="headcount"
              min="1"
              placeholder="Number of crew members"
            >

          </div>


          <div class="form-group">

            <label for="teamLeader">
              Team Leader
            </label>

            <input
              type="text"
              id="teamLeader"
              placeholder="Team leader"
            >

          </div>


          <div class="form-group full-width">

            <label for="notes">
              Notes
            </label>

            <textarea
              id="notes"
              rows="5"
              placeholder="Additional event notes..."
            ></textarea>

          </div>


        </div>


        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelEventButton"
          >
            Cancel
          </button>


          <button
            type="submit"
            class="primary-button"
          >
            Save Event
          </button>

        </div>

      </form>

    </section>

  `;


  const cancelButton =
    document.getElementById("cancelEventButton");


  if (cancelButton) {

    cancelButton.addEventListener("click", function () {

      showEventsPage();

    });

  }

}


/* =========================================================
   SAVE EVENT
========================================================= */

document.addEventListener("submit", function (event) {

  if (!event.target.classList.contains("event-form")) {
    return;
  }


  event.preventDefault();


  const eventData = {

    name:
      document.getElementById("eventName").value.trim(),

    client:
      document.getElementById("clientName").value.trim(),

    date:
      document.getElementById("eventDate").value,

    callTime:
      document.getElementById("callTime").value,

    startTime:
      document.getElementById("startTime").value,

    endTime:
      document.getElementById("endTime").value,

    location:
      document.getElementById("location").value.trim(),

    maps:
      document.getElementById("maps").value.trim(),

    headcount:
      document.getElementById("headcount").value,

    teamLeader:
      document.getElementById("teamLeader").value.trim(),

    notes:
      document.getElementById("notes").value.trim(),

    id:
      Date.now()

  };


  const events = JSON.parse(
    localStorage.getItem("crewflow_events") || "[]"
  );


  events.push(eventData);


  localStorage.setItem(
    "crewflow_events",
    JSON.stringify(events)
  );


  alert("Event saved successfully.");


  showEventsPage();

});
