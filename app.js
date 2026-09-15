document.addEventListener("DOMContentLoaded",function(){
  setupNavigation();
  setupGlobalActions();
  updateDashboardStats();
});

function setupNavigation(){
  const navItems=document.querySelectorAll(".nav-item");

  navItems.forEach(function(item){
    item.addEventListener("click",function(event){
      event.preventDefault();

      navItems.forEach(function(nav){
        nav.classList.remove("active");
      });

      item.classList.add("active");

      const page=item.textContent.trim();

      if(page==="Events"){
        showEventsPage();
        return;
      }

      if(page==="Dashboard"){
        showDashboard();
        return;
      }

      if(page==="People"){
        showPeoplePage();
        return;
      }

      if(page==="Clients"){
        showComingSoon("Clients");
        return;
      }

      if(page==="Assignments"){
        showAssignmentsPage();
        return;
      }

      if(page==="Availability"){
        showComingSoon("Availability");
        return;
      }

      if(page==="Resources"){
        showComingSoon("Resources");
        return;
      }

      if(page==="Notifications"){
        showComingSoon("Notifications");
        return;
      }
    });
  });
}

function setupGlobalActions(){
  document.addEventListener("click",function(event){
    const button=event.target.closest("button");

    if(!button){
      return;
    }

    const isDashboardHome=!!document.querySelector(".dashboard .stats-grid");

    if(
      isDashboardHome &&
      button.textContent.trim().toLowerCase().includes("create event")
    ){
      showCreateEvent();
    }
  });
}

function getEvents(){
  try{
    return JSON.parse(localStorage.getItem("crewflow_events")||"[]");
  }catch(error){
    return [];
  }
}

function saveEvents(events){
  localStorage.setItem("crewflow_events",JSON.stringify(events));
}

function getPeople(){
  try{
    return JSON.parse(localStorage.getItem("crewflow_people")||"[]");
  }catch(error){
    return [];
  }
}

function savePeople(people){
  localStorage.setItem("crewflow_people",JSON.stringify(people));
}

function getAssignments(){
  try{
    return JSON.parse(localStorage.getItem("crewflow_assignments")||"[]");
  }catch(error){
    return [];
  }
}

function saveAssignments(assignments){
  localStorage.setItem(
    "crewflow_assignments",
    JSON.stringify(assignments)
  );
}

function getAssignmentHistory(){
  try{
    return JSON.parse(
      localStorage.getItem("crewflow_assignment_history")||"[]"
    );
  }catch(error){
    return [];
  }
}

function saveAssignmentHistory(history){
  localStorage.setItem(
    "crewflow_assignment_history",
    JSON.stringify(history)
  );
}
function escapeHtml(value){
  return String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function normalizeList(value){
  if(Array.isArray(value)){
    return value
      .map(function(item){
        return String(item).trim().toLowerCase();
      })
      .filter(Boolean);
  }

  return String(value||"")
    .split(",")
    .map(function(item){
      return item.trim().toLowerCase();
    })
    .filter(Boolean);
}

function parseList(value){
  return normalizeList(value);
}

function formatAssignmentDate(value){
  if(!value){
    return "--";
  }

  const date=new Date(value);

  if(isNaN(date.getTime())){
    return "--";
  }

  return date.toLocaleString();
}

function generateId(prefix){
  return (
    String(prefix||"id")+
    "_"+
    Date.now()+
    "_"+
    Math.random().toString(36).slice(2,8)
  );
}

function getEventById(eventId){
  return getEvents().find(function(event){
    return String(event.id)===String(eventId);
  });
}

function getPersonById(personId){
  return getPeople().find(function(person){
    return String(person.id)===String(personId);
  });
}

function getActiveAssignmentsForEvent(eventId){
  return getAssignments().filter(function(assignment){
    return (
      String(assignment.eventId)===String(eventId) &&
      assignment.status!=="cancelled"
    );
  });
}

function getActiveAssignmentsForPerson(personId){
  return getAssignments().filter(function(assignment){
    return (
      String(assignment.personId)===String(personId) &&
      assignment.status!=="cancelled"
    );
  });
}

function statusLabel(status){
  const labels={
    draft:"Draft",
    open:"Open",
    assigned:"Assigned",
    "in-progress":"In Progress",
    completed:"Completed",
    cancelled:"Cancelled"
  };

  return labels[status]||"Draft";
}

function statusClass(status){
  return "status-"+(status||"draft");
}

function syncEventAssignmentStatus(eventId){
  const events=getEvents();
  const assignments=getAssignments();

  const event=events.find(function(item){
    return String(item.id)===String(eventId);
  });

  if(!event){
    return;
  }

  if(
    event.status==="completed"||
    event.status==="cancelled"||
    event.status==="in-progress"
  ){
    saveEvents(events);
    return;
  }

  const required=Number(event.headcount)||0;

  const assignedCount=assignments.filter(function(assignment){
    return (
      String(assignment.eventId)===String(event.id) &&
      assignment.status!=="cancelled"
    );
  }).length;

  if(required>0&&assignedCount>=required){
    event.status="assigned";
  }else if(event.status==="assigned"){
    event.status="open";
  }

  saveEvents(events);
}

function showDashboard(){
  window.location.reload();
}

function updateDashboardStats(){
  const events=getEvents();
  const people=getPeople();
  const assignments=getAssignments();

  const today=new Date();

  const todayString=
    today.getFullYear()+
    "-"+
    String(today.getMonth()+1).padStart(2,"0")+
    "-"+
    String(today.getDate()).padStart(2,"0");

  const todayEvents=events.filter(function(event){
    return event.date===todayString;
  });

  const activeEvents=events.filter(function(event){
    return (
      event.status==="open"||
      event.status==="assigned"||
      event.status==="in-progress"
    );
  });

  let missingCrewSlots=0;

  activeEvents.forEach(function(event){
    const required=Number(event.headcount)||0;

    if(required<=0){
      return;
    }

    const assignedCount=assignments.filter(function(assignment){
      return (
        String(assignment.eventId)===String(event.id)&&
        assignment.status!=="cancelled"
      );
    }).length;

    missingCrewSlots+=Math.max(required-assignedCount,0);
  });

  const activeJobs=events.filter(function(event){
    return event.status==="in-progress";
  });

  const availablePeople=people.filter(function(person){
    return (person.availability||"Available")!=="Unavailable";
  });

  const statCards=document.querySelectorAll(".stat-card");

  if(statCards.length>=4){

    statCards[0].querySelector("strong").textContent=
      todayEvents.length;

    statCards[0].querySelector("small").textContent=
      todayEvents.length===1
        ?"1 event scheduled"
        :todayEvents.length+" events scheduled";

    statCards[1].querySelector("strong").textContent=
      availablePeople.length;

    statCards[1].querySelector("small").textContent=
      "Available for assignment";

    statCards[2].querySelector("strong").textContent=
      missingCrewSlots;

    statCards[2].querySelector("small").textContent=
      missingCrewSlots===1
        ?"1 crew slot remaining"
        :missingCrewSlots+" crew slots remaining";

    statCards[3].querySelector("strong").textContent=
      activeJobs.length;

    statCards[3].querySelector("small").textContent=
      activeJobs.length===1
        ?"1 job currently in progress"
        :activeJobs.length+" jobs currently in progress";
  }
}

function showEventsPage(){
  const dashboard=document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  const events=getEvents();

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Events</h2>
        <p>Manage events, schedules, locations and crew requirements.</p>
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
          <h3>All Events</h3>
          <p>
            ${events.length}
            event${events.length===1?"":"s"}
            registered.
          </p>
        </div>
      </div>

      <div
        style="
          display:flex;
          gap:12px;
          flex-wrap:wrap;
          margin-bottom:24px;
        "
      >
        <input
          id="eventSearch"
          type="text"
          placeholder="Search events..."
          style="
            flex:1;
            min-width:220px;
            padding:14px 16px;
            border:1px solid var(--border);
            border-radius:10px;
            font-size:15px;
          "
        >

        <select
          id="eventStatusFilter"
          style="
            min-width:180px;
            padding:14px 16px;
            border:1px solid var(--border);
            border-radius:10px;
            font-size:15px;
          "
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div id="eventsContainer"></div>

    </section>
  `;

  document
    .getElementById("createEventTopButton")
    .addEventListener("click",showCreateEvent);

  const search=document.getElementById("eventSearch");
  const filter=document.getElementById("eventStatusFilter");

  function renderEvents(){

    const searchValue=
      search.value.toLowerCase().trim();

    const statusValue=filter.value;

    const filtered=events.filter(function(event){

      const text=
        (
          (event.name||"")+
          " "+
          (event.client||"")+
          " "+
          (event.location||"")+
          " "+
          (event.skills||"")
        ).toLowerCase();

      const matchesSearch=
        !searchValue||
        text.includes(searchValue);

      const matchesStatus=
        statusValue==="all"||
        (event.status||"draft")===statusValue;

      return matchesSearch&&matchesStatus;
    });

    const container=
      document.getElementById("eventsContainer");

    if(filtered.length===0){

      container.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No events found</h3>
          <p>Try another search or create a new event.</p>

          <button
            type="button"
            class="primary-button"
            id="createEventEmptyButton"
          >
            + Create Event
          </button>
        </div>
      `;

      document
        .getElementById("createEventEmptyButton")
        .addEventListener("click",showCreateEvent);

      return;
    }

    container.innerHTML=`
      <div class="events-list">

        ${filtered.map(function(event){

          const assignedCount=
            getActiveAssignmentsForEvent(event.id).length;

          const required=
            Number(event.headcount)||0;

          const remaining=
            Math.max(required-assignedCount,0);

          return `
            <div class="event-card">

              <div class="event-card-main">

                <div class="event-icon">📅</div>

                <div>
                  <h3>
                    ${escapeHtml(event.name||"Unnamed Event")}
                  </h3>

                  <p>
                    ${escapeHtml(
                      event.client||"No client specified"
                    )}
                  </p>
                </div>

              </div>

              <div class="event-details">

                <span>
                  📆 ${escapeHtml(event.date||"No date")}
                </span>

                <span>
                  🕐
                  ${escapeHtml(event.startTime||"--")}
                  -
                  ${escapeHtml(event.endTime||"--")}
                </span>

                <span>
                  📍
                  ${escapeHtml(event.location||"No location")}
                </span>

                <span>
                  👥
                  ${required}
                  crew
                </span>

                <span>
                  ✅
                  ${assignedCount}
                  assigned
                </span>

                ${
                  remaining>0&&required>0
                  ?`
                    <span>
                      ⚠️
                      ${remaining}
                      remaining
                    </span>
                  `
                  :""
                }

                <span>
                  📌
                  ${statusLabel(event.status)}
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

    container
      .querySelectorAll(".event-view-button")
      .forEach(function(button){

        button.addEventListener("click",function(){

          showEventDetails(
            button.getAttribute("data-event-id")
          );

        });

      });
  }

  search.addEventListener("input",renderEvents);
  filter.addEventListener("change",renderEvents);

  renderEvents();
}

function showEventDetails(eventId){

  const events=getEvents();

  const event=events.find(function(item){
    return String(item.id)===String(eventId);
  });

  if(!event){
    alert("Event not found.");
    return;
  }

  const dashboard=document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  const assignments=
    getActiveAssignmentsForEvent(eventId);

  const people=getPeople();

  const required=
    Number(event.headcount)||0;

  const remaining=
    Math.max(required-assignments.length,0);

  dashboard.innerHTML=`

    <div class="page-header">

      <div>
        <h2>Event Details</h2>
        <p>
          Complete operational information for this event.
        </p>
      </div>

      <div
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        "
      >

        <button
          type="button"
          class="primary-button"
          id="editEventButton"
        >
          ✏️ Edit Event
        </button>

        <button
          type="button"
          class="primary-button"
          id="assignCrewFromEvent"
        >
          👥 Assign Crew
        </button>

        <button
          type="button"
          class="secondary-button"
          id="deleteEventButton"
        >
          🗑️ Delete Event
        </button>

        <button
          type="button"
          class="secondary-button"
          id="backToEvents"
        >
          ← Back to Events
        </button>

      </div>

    </div>

    <section class="dashboard-section">

      <div class="section-header">

        <div>
          <h3>
            ${escapeHtml(event.name||"Unnamed Event")}
          </h3>

          <p>
            ${escapeHtml(
              event.client||"No client specified"
            )}
          </p>
        </div>

      </div>

      <div class="event-form">

        <div class="form-grid">

          <div class="form-group">
            <label>Status</label>
            <input
              type="text"
              value="${escapeHtml(statusLabel(event.status))}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Event Date</label>
            <input
              type="text"
              value="${escapeHtml(event.date||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Client</label>
            <input
              type="text"
              value="${escapeHtml(event.client||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Call / Assembly Time</label>
            <input
              type="text"
              value="${escapeHtml(event.callTime||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Start Time</label>
            <input
              type="text"
              value="${escapeHtml(event.startTime||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>End Time</label>
            <input
              type="text"
              value="${escapeHtml(event.endTime||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Required Headcount</label>
            <input
              type="text"
              value="${required}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Assigned Crew</label>
            <input
              type="text"
              value="${assignments.length}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Remaining Crew</label>
            <input
              type="text"
              value="${remaining}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Team Leader</label>
            <input
              type="text"
              value="${escapeHtml(event.teamLeader||"--")}"
              readonly
            >
          </div>

          <div class="form-group full-width">
            <label>Location</label>
            <input
              type="text"
              value="${escapeHtml(event.location||"--")}"
              readonly
            >
          </div>

          <div class="form-group full-width">
            <label>Google Maps</label>

            ${
              event.maps
              ?`
                <a
                  href="${escapeHtml(event.maps)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="maps-link"
                >
                  Open Location in Google Maps
                </a>
              `
              :`
                <input
                  type="text"
                  value="No Google Maps link"
                  readonly
                >
              `
            }

          </div>

          <div class="form-group">
            <label>Required Skills</label>
            <input
              type="text"
              value="${escapeHtml(event.skills||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Required Equipment</label>
            <input
              type="text"
              value="${escapeHtml(event.equipment||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Transportation</label>
            <input
              type="text"
              value="${escapeHtml(event.transportation||"--")}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Travel</label>
            <input
              type="text"
              value="${event.travel?"Yes":"No"}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Overnight</label>
            <input
              type="text"
              value="${event.overnight?"Yes":"No"}"
              readonly
            >
          </div>

          <div class="form-group">
            <label>Weekend</label>
            <input
              type="text"
              value="${event.weekend?"Yes":"No"}"
              readonly
            >
          </div>

          <div class="form-group full-width">
            <label>Notes</label>

            <textarea
              rows="5"
              readonly
            >${escapeHtml(event.notes||"--")}</textarea>

          </div>

        </div>

      </div>

    </section>

    <section class="dashboard-section">

      <div class="section-header">

        <div>
          <h3>Assigned Crew</h3>

          <p>
            ${assignments.length}
            assigned /
            ${required}
            required.
          </p>
        </div>

      </div>

      <div id="eventAssignedCrew"></div>

    </section>
  `;

  renderAssignedCrew(
    event,
    assignments,
    people
  );

  document
    .getElementById("editEventButton")
    .addEventListener("click",function(){
      showEditEvent(eventId);
    });

  document
    .getElementById("assignCrewFromEvent")
    .addEventListener("click",function(){
      showAssignmentWorkspace(eventId);
    });

  document
    .getElementById("deleteEventButton")
    .addEventListener("click",function(){

      if(!confirm(
        "Are you sure you want to delete this event?"
      )){
        return;
      }

      const remainingEvents=
        events.filter(function(item){
          return String(item.id)!==String(eventId);
        });

      saveEvents(remainingEvents);

      saveAssignments(
        getAssignments().filter(function(item){
          return String(item.eventId)!==String(eventId);
        })
      );

      alert("Event deleted successfully.");

      showEventsPage();
    });

  document
    .getElementById("backToEvents")
    .addEventListener("click",showEventsPage);
}

function renderAssignedCrew(
  event,
  assignments,
  people
){

  const container=
    document.getElementById("eventAssignedCrew");

  if(!container){
    return;
  }

  if(assignments.length===0){

    container.innerHTML=`
      <div class="empty-state">

        <div class="empty-icon">👥</div>

        <h3>No crew assigned</h3>

        <p>
          This event does not have any crew assignments yet.
        </p>

        <button
          type="button"
          class="primary-button"
          id="assignCrewEmptyButton"
        >
          Assign Crew
        </button>

      </div>
    `;

    document
      .getElementById("assignCrewEmptyButton")
      .addEventListener("click",function(){
        showAssignmentWorkspace(event.id);
      });

    return;
  }

  container.innerHTML=`

    <div class="events-list">

      ${assignments.map(function(assignment){

        const person=people.find(function(item){
          return String(item.id)===
            String(assignment.personId);
        });

        if(!person){
          return "";
        }

        return `
          <div class="event-card">

            <div class="event-card-main">

              <div class="event-icon">👤</div>

              <div>

                <h3>
                  ${escapeHtml(
                    person.name||"Unnamed Person"
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    person.role||"No role specified"
                  )}
                </p>

              </div>

            </div>

            <div class="event-details">

              <span>
                ⭐ Match
                ${assignment.score||0}%
              </span>

              <span>
                👤
                ${person.type==="freelancer"
                  ?"Freelancer"
                  :"Employee"}
              </span>

              <span>
                🛠️
                ${escapeHtml(
                  person.skills||"No skills"
                )}
              </span>

              <span>
                📅 Assigned
                ${formatAssignmentDate(
                  assignment.assignedAt
                )}
              </span>

              <button
                type="button"
                class="secondary-button remove-assignment-button"
                data-assignment-id="${assignment.id}"
              >
                Remove
              </button>

            </div>

          </div>
        `;

      }).join("")}

    </div>
  `;

  container
    .querySelectorAll(".remove-assignment-button")
    .forEach(function(button){

      button.addEventListener("click",function(){

        removeAssignment(
          button.getAttribute("data-assignment-id"),
          event.id
        );

      });

    });
}

function skillMatchScore(event,person){

  const required=
    normalizeList(event.skills);

  const personSkills=
    normalizeList(person.skills);

  if(required.length===0){
    return 40;
  }

  let matched=0;

  required.forEach(function(skill){

    const found=personSkills.some(
      function(personSkill){

        return (
          personSkill===skill||
          personSkill.includes(skill)||
          skill.includes(personSkill)
        );

      }
    );

    if(found){
      matched++;
    }

  });

  return Math.round(
    (matched/required.length)*40
  );
}

function getMatchedSkills(event,person){

  const required=
    normalizeList(event.skills);

  const personSkills=
    normalizeList(person.skills);

  const matched=[];
  const missing=[];

  required.forEach(function(skill){

    const found=personSkills.some(
      function(personSkill){

        return (
          personSkill===skill||
          personSkill.includes(skill)||
          skill.includes(personSkill)
        );

      }
    );

    if(found){
      matched.push(skill);
    }else{
      missing.push(skill);
    }

  });

  return {
    matched:matched,
    missing:missing
  };
}

function calculateMatchScore(event,person){

  const reasons=[];
  const warnings=[];

  const availability=
    person.availability||"Available";

  /*
   * HARD EXCLUSION FLAGS
   */

  if(availability==="Unavailable"){

    return {
      eligible:false,
      score:0,
      reasons:[],
      warnings:["Currently unavailable"],
      assignmentCount:getActiveAssignmentsForPerson(
        person.id
      ).length,
      matchedSkills:[],
      missingSkills:normalizeList(event.skills)
    };

  }

  if(event.travel&&!person.travel){

    return {
      eligible:false,
      score:0,
      reasons:[],
      warnings:["Travel is required but this person is not available for travel"],
      assignmentCount:getActiveAssignmentsForPerson(
        person.id
      ).length,
      matchedSkills:[],
      missingSkills:normalizeList(event.skills)
    };

  }

  if(event.overnight&&!person.overnight){

    return {
      eligible:false,
      score:0,
      reasons:[],
      warnings:["Overnight is required but this person is not available"],
      assignmentCount:getActiveAssignmentsForPerson(
        person.id
      ).length,
      matchedSkills:[],
      missingSkills:normalizeList(event.skills)
    };

  }

  if(event.weekend&&!person.weekend){

    return {
      eligible:false,
      score:0,
      reasons:[],
      warnings:["Weekend availability is required but not confirmed"],
      assignmentCount:getActiveAssignmentsForPerson(
        person.id
      ).length,
      matchedSkills:[],
      missingSkills:normalizeList(event.skills)
    };

  }

  /*
   * SKILLS — 40 POINTS
   */

  const skillResult=
    getMatchedSkills(event,person);

  const skillScore=
    skillMatchScore(event,person);

  let score=skillScore;


  if(skillResult.matched.length===normalizeList(event.skills).length&&
     normalizeList(event.skills).length>0){

    reasons.push("All required skills matched");

  }else if(skillResult.matched.length>0){

    reasons.push(
      skillResult.matched.length+
      " required skill"+
      (skillResult.matched.length===1?"":"s")+
      " matched"
    );

    warnings.push(
      "Missing skills: "+
      skillResult.missing.join(", ")
    );

  }else if(normalizeList(event.skills).length>0){

    warnings.push("Required skills not matched");

  }else{

    reasons.push("No specific skills required");

  }

  /*
   * AVAILABILITY — 20 POINTS
   */

  if(availability==="Available"){

    score+=20;
    reasons.push("Available");

  }else if(availability==="Limited"){

    score+=10;
    reasons.push("Limited availability");
    warnings.push("Limited availability");

  }

  /*
   * TRAVEL — 10 POINTS
   */

  if(event.travel){

    score+=10;
    reasons.push("Travel available");

  }else{

    score+=10;
    reasons.push("Travel not required");

  }

  /*
   * OVERNIGHT — 10 POINTS
   */

  if(event.overnight){

    score+=10;
    reasons.push("Overnight available");

  }else{

    score+=10;
    reasons.push("Overnight not required");

  }

  /*
   * WEEKEND — 5 POINTS
   */

  if(event.weekend){

    score+=5;
    reasons.push("Weekend available");

  }else{

    score+=5;
    reasons.push("Weekend not required");

  }

  /*
   * RATING — 10 POINTS
   */

  const rating=
    parseFloat(person.rating)||0;

  const ratingScore=
    Math.min(
      Math.max(rating,0)/5*10,
      10
    );

  score+=ratingScore;

  if(rating>=4){

    reasons.push("Strong rating");

  }else if(rating>0){

    reasons.push(
      "Rating "+
      rating.toFixed(1)+
      "/5"
    );

  }else{

    warnings.push("No rating available");

  }

  /*
   * LOCATION — 5 POINTS
   */

  const eventLocation=
    String(event.location||"")
      .trim()
      .toLowerCase();

  const personLocation=
    String(person.location||"")
      .trim()
      .toLowerCase();

  if(!eventLocation){

    score+=5;
    reasons.push("No location restriction");

  }else if(
    personLocation&&
    (
      personLocation===eventLocation||
      personLocation.includes(eventLocation)||
      eventLocation.includes(personLocation)
    )
  ){

    score+=5;
    reasons.push("Same or matching location");

  }else{

    warnings.push("Different location");

  }

  /*
   * PREVIOUS ASSIGNMENTS
   *
   * Fairness is NOT added to the score yet.
   * We only keep the assignment count for
   * later rotation/fairness logic.
   */

  const completedAssignments=
    getActiveAssignmentsForPerson(person.id).length;

  if(completedAssignments===0){

    reasons.push("No previous assignments");

  }else{

    reasons.push(
      completedAssignments+
      " previous assignment"+
      (completedAssignments===1?"":"s")
    );

  }

  score=
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );

  return {
    eligible:true,
    score:score,
    reasons:reasons,
    warnings:warnings,
    assignmentCount:completedAssignments,
    matchedSkills:skillResult.matched,
    missingSkills:skillResult.missing
  };
}

function isPersonHardExcluded(event,person){

  if(!event||!person){
    return true;
  }

  const availability=
    person.availability||"Available";

  if(availability==="Unavailable"){
    return true;
  }

  if(event.travel&&!person.travel){
    return true;
  }

  if(event.overnight&&!person.overnight){
    return true;
  }

  if(event.weekend&&!person.weekend){
    return true;
  }

  const assignments=
    getActiveAssignmentsForEvent(event.id);

  const alreadyAssigned=
    assignments.some(function(assignment){

      return String(assignment.personId)===
        String(person.id);

    });

  if(alreadyAssigned){
    return true;
  }

  return false;
}

function getAssignmentCandidates(eventId){

  const event=getEventById(eventId);

  if(!event){
    return [];
  }

  const people=getPeople();

  const assignments=
    getActiveAssignmentsForEvent(event.id);

  const assignedIds=
    assignments.map(function(assignment){
      return String(assignment.personId);
    });

  const candidates=
    people
      .filter(function(person){

        if(
          assignedIds.includes(
            String(person.id)
          )
        ){
          return false;
        }

        if(isPersonHardExcluded(event,person)){
          return false;
        }

        return true;

      })
      .map(function(person){

        const match=
          calculateMatchScore(
            event,
            person
          );

        return {
          person:person,
          score:match.score,
          reasons:match.reasons,
          warnings:match.warnings,
          assignmentCount:match.assignmentCount,
          matchedSkills:match.matchedSkills,
          missingSkills:match.missingSkills,
          eligible:match.eligible
        };

      })
      .filter(function(candidate){

        return candidate.eligible!==false;

      })
      .sort(function(a,b){

        if(b.score!==a.score){
          return b.score-a.score;
        }

        /*
         * Fairness tie-breaker only.
         * It does not reduce a person's score.
         */

        if(
          a.assignmentCount!==
          b.assignmentCount
        ){
          return (
            a.assignmentCount-
            b.assignmentCount
          );
        }

        return String(
          a.person.name||""
        ).localeCompare(
          String(
            b.person.name||""
          )
        );

      });

  return candidates;
}

function showAssignmentsPage(){

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  const events=getEvents();

  const activeEvents=
    events.filter(function(event){

      return (
        event.status!=="completed"&&
        event.status!=="cancelled"
      );

    });

  if(activeEvents.length===0){

    dashboard.innerHTML=`

      <div class="page-header">

        <div>
          <h2>Assignments</h2>
          <p>
            Assign the right crew to each event.
          </p>
        </div>

      </div>

      <section class="dashboard-section">

        <div class="empty-state">

          <div class="empty-icon">👥</div>

          <h3>No active events</h3>

          <p>
            Create an event first, then return here
            to assign crew.
          </p>

          <button
            type="button"
            class="primary-button"
            id="assignmentCreateEventButton"
          >
            + Create Event
          </button>

        </div>

      </section>
    `;

    document
      .getElementById(
        "assignmentCreateEventButton"
      )
      .addEventListener(
        "click",
        showCreateEvent
      );

    return;
  }

  dashboard.innerHTML=`

    <div class="page-header">

      <div>
        <h2>Assignment Engine</h2>

        <p>
          Match available crew with event
          operational requirements.
        </p>
      </div>

    </div>

    <section class="dashboard-section">

      <div class="section-header">

        <div>
          <h3>Select Event</h3>

          <p>
            Choose an event to start crew assignment.
          </p>
        </div>

      </div>

      <div class="event-form">

        <div class="form-grid">

          <div class="form-group full-width">

            <label for="assignmentEventSelect">
              Event
            </label>

            <select
              id="assignmentEventSelect"
            >

              <option value="">
                Select an event
              </option>

              ${activeEvents.map(function(event){

                return `
                  <option value="${event.id}">
                    ${escapeHtml(
                      event.name||
                      "Unnamed Event"
                    )}
                    -
                    ${escapeHtml(
                      event.date||
                      "No date"
                    )}
                  </option>
                `;

              }).join("")}

            </select>

          </div>

        </div>

      </div>

    </section>

    <div id="assignmentWorkspace"></div>
  `;

  const select=
    document.getElementById(
      "assignmentEventSelect"
    );

  select.addEventListener(
    "change",
    function(){

      if(!select.value){

        document.getElementById(
          "assignmentWorkspace"
        ).innerHTML="";

        return;
      }

      showAssignmentWorkspace(
        select.value
      );

    }
  );

  if(activeEvents.length===1){

    select.value=
      String(activeEvents[0].id);

    showAssignmentWorkspace(
      activeEvents[0].id
    );

  }
}

function showAssignmentWorkspace(eventId){

  const event=
    getEventById(eventId);

  const workspace=
    document.getElementById(
      "assignmentWorkspace"
    );

  if(!event||!workspace){

    if(!event){

      showAssignmentsPage();

    }

    return;
  }

  const assignments=
    getActiveAssignmentsForEvent(
      event.id
    );

  const required=
    Number(event.headcount)||0;

  const remaining=
    Math.max(
      required-assignedCount(assignments),
      0
    );

  const candidates=
    getAssignmentCandidates(
      event.id
    );

  workspace.innerHTML=`

    <section class="dashboard-section">

      <div class="section-header">

        <div>

          <h3>
            ${escapeHtml(
              event.name||
              "Unnamed Event"
            )}
          </h3>

          <p>
            Assignment workspace
          </p>

        </div>

        <div
          style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
          "
        >

          <button
            type="button"
            class="secondary-button"
            id="assignmentViewEventButton"
          >
            View Event
          </button>

        </div>

      </div>

      <div class="stats-grid">

        <div class="stat-card">

          <span class="stat-label">
            Required Crew
          </span>

          <strong>
            ${required}
          </strong>

          <small>
            Total headcount
          </small>

        </div>

        <div class="stat-card">

          <span class="stat-label">
            Assigned
          </span>

          <strong>
            ${assignments.length}
          </strong>

          <small>
            Currently assigned
          </small>

        </div>

        <div class="stat-card">

          <span class="stat-label">
            Remaining
          </span>

          <strong>
            ${remaining}
          </strong>

          <small>
            Crew slots
          </small>

        </div>

        <div class="stat-card">

          <span class="stat-label">
            Candidates
          </span>

          <strong>
            ${candidates.length}
          </strong>

          <small>
            Eligible people
          </small>

        </div>

      </div>

      <div
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin:24px 0;
        "
      >

        <span
          class="${statusClass(event.status)}"
        >
          ${statusLabel(event.status)}
        </span>

        <span>
          📅 ${escapeHtml(event.date||"--")}
        </span>

        <span>
          📍 ${escapeHtml(event.location||"--")}
        </span>

        <span>
          🛠️ ${escapeHtml(event.skills||"No specific skills")}
        </span>

        ${
          event.travel
          ?"<span>✈️ Travel Required</span>"
          :""
        }

        ${
          event.overnight
          ?"<span>🌙 Overnight Required</span>"
          :""
        }

        ${
          event.weekend
          ?"<span>📆 Weekend Required</span>"
          :""
        }

      </div>

    </section>

    <section class="dashboard-section">

      <div class="section-header">

        <div>

          <h3>
            Recommended Crew
          </h3>

          <p>
            Candidates are ranked by operational
            compatibility and match score.
          </p>

        </div>

      </div>

      <div id="assignmentCandidates"></div>

    </section>

    <section class="dashboard-section">

      <div class="section-header">

        <div>

          <h3>
            Current Assigned Crew
          </h3>

          <p>
            ${assignments.length}
            assigned /
            ${required}
            required.
          </p>

        </div>

      </div>

      <div id="assignmentCurrentCrew"></div>

    </section>
  `;

  document
    .getElementById(
      "assignmentViewEventButton"
    )
    .addEventListener(
      "click",
      function(){
        showEventDetails(event.id);
      }
    );

  renderAssignmentCandidates(
    event,
    candidates
  );

  renderCurrentAssignments(
    event
  );
}

function assignedCount(assignments){

  return assignments.filter(
    function(assignment){

      return assignment.status!=="cancelled";

    }
  ).length;
}

function renderAssignmentCandidates(
  event,
  candidates
){

  const container=
    document.getElementById(
      "assignmentCandidates"
    );

  if(!container){
    return;
  }

  if(candidates.length===0){

    const allPeople=
      getPeople();

    let totalExcluded=0;

    allPeople.forEach(function(person){

      if(isPersonHardExcluded(
        event,
        person
      )){
        totalExcluded++;
      }

    });

    container.innerHTML=`

      <div class="empty-state">

        <div class="empty-icon">🔎</div>

        <h3>
          No eligible candidates
        </h3>

        <p>
          No available person currently meets
          the hard operational requirements
          for this event.
        </p>

        ${
          totalExcluded>0
          ?`
            <small>
              ${totalExcluded}
              people were excluded because of
              availability, travel, overnight,
              weekend requirements, or existing
              assignment.
            </small>
          `
          :""
        }

      </div>
    `;

    return;
  }

  container.innerHTML=`

    <div class="events-list">

      ${candidates.map(function(candidate){

        const person=
          candidate.person;

        const matchScore=
          candidate.score;

        const matched=
          candidate.matchedSkills||[];

        const missing=
          candidate.missingSkills||[];

        return `

          <div class="event-card">

            <div class="event-card-main">

              <div class="event-icon">
                👤
              </div>

              <div>

                <h3>
                  ${escapeHtml(
                    person.name||
                    "Unnamed Person"
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    person.role||
                    "No role specified"
                  )}
                </p>

              </div>

            </div>

            <div class="event-details">

              <span>
                ⭐
                Match Score:
                <strong>
                  ${matchScore}%
                </strong>
              </span>

              <span>
                👤
                ${
                  person.type==="freelancer"
                  ?"Freelancer"
                  :"Employee"
                }
              </span>

              <span>
                ⭐ Rating:
                ${escapeHtml(
                  person.rating||
                  "Not rated"
                )}
              </span>

              <span>
                📍
                ${escapeHtml(
                  person.location||
                  "No location"
                )}
              </span>

              <span>
                🛠️ Skills:
                ${escapeHtml(
                  person.skills||
                  "No skills"
                )}
              </span>

              <span>
                📊 Previous assignments:
                ${candidate.assignmentCount}
              </span>

              ${
                matched.length>0
                ?`
                  <span>
                    ✅ Matched:
                    ${escapeHtml(
                      matched.join(", ")
                    )}
                  </span>
                `
                :""
              }

              ${
                missing.length>0
                ?`
                  <span>
                    ⚠️ Missing:
                    ${escapeHtml(
                      missing.join(", ")
                    )}
                  </span>
                `
                :""
              }

              ${
                candidate.reasons.length>0
                ?`
                  <div
                    style="
                      width:100%;
                      margin-top:8px;
                    "
                  >

                    <strong>
                      Why this candidate:
                    </strong>

                    <ul
                      style="
                        margin:8px 0 0 20px;
                      "
                    >

                      ${candidate.reasons.map(
                        function(reason){

                          return `
                            <li>
                              ${escapeHtml(
                                reason
                              )}
                            </li>
                          `;

                        }
                      ).join("")}

                    </ul>

                  </div>
                `
                :""
              }

              ${
                candidate.warnings.length>0
                ?`
                  <div
                    style="
                      width:100%;
                      margin-top:8px;
                    "
                  >

                    <strong>
                      Notes:
                    </strong>

                    <ul
                      style="
                        margin:8px 0 0 20px;
                      "
                    >

                      ${candidate.warnings.map(
                        function(warning){

                          return `
                            <li>
                              ${escapeHtml(
                                warning
                              )}
                            </li>
                          `;

                        }
                      ).join("")}

                    </ul>

                  </div>
                `
                :""
              }

              <button
                type="button"
                class="primary-button assign-person-button"
                data-person-id="${person.id}"
                ${
                  Number(event.headcount)>0&&
                  getActiveAssignmentsForEvent(
                    event.id
                  ).length>=Number(event.headcount)
                  ?"disabled"
                  :""
                }
              >
                Assign to Event
              </button>

            </div>

          </div>

        `;

      }).join("")}

    </div>
  `;

  container
    .querySelectorAll(
      ".assign-person-button"
    )
    .forEach(function(button){

      button.addEventListener(
        "click",
        function(){

          assignPersonToEvent(
            event.id,
            button.getAttribute(
              "data-person-id"
            )
          );

        }
      );

    });
}

function renderCurrentAssignments(event){

  const container=
    document.getElementById(
      "assignmentCurrentCrew"
    );

  if(!container){
    return;
  }

  const assignments=
    getActiveAssignmentsForEvent(
      event.id
    );

  const people=
    getPeople();

  if(assignments.length===0){

    container.innerHTML=`

      <div class="empty-state">

        <div class="empty-icon">👥</div>

        <h3>
          No crew assigned yet
        </h3>

        <p>
          Select an eligible candidate above
          to assign them to this event.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML=`

    <div class="events-list">

      ${assignments.map(function(assignment){

        const person=
          people.find(function(item){

            return String(item.id)===
              String(assignment.personId);

          });

        if(!person){
          return "";
        }

        return `

          <div class="event-card">

            <div class="event-card-main">

              <div class="event-icon">
                👤
              </div>

              <div>

                <h3>
                  ${escapeHtml(
                    person.name||
                    "Unnamed Person"
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    person.role||
                    "No role specified"
                  )}
                </p>

              </div>

            </div>

            <div class="event-details">

              <span>
                ⭐
                ${assignment.score||0}%
                Match
              </span>

              <span>
                ${
                  person.type==="freelancer"
                  ?"Freelancer"
                  :"Employee"
                }
              </span>

              <span>
                📅
                ${formatAssignmentDate(
                  assignment.assignedAt
                )}
              </span>

              <button
                type="button"
                class="secondary-button current-remove-assignment"
                data-assignment-id="${assignment.id}"
              >
                Remove Assignment
              </button>

            </div>

          </div>

        `;

      }).join("")}

    </div>
  `;

  container
    .querySelectorAll(
      ".current-remove-assignment"
    )
    .forEach(function(button){

      button.addEventListener(
        "click",
        function(){

          removeAssignment(
            button.getAttribute(
              "data-assignment-id"
            ),
            event.id
          );

        }
      );

    });
}

function assignPersonToEvent(
  eventId,
  personId
){

  const events=getEvents();
  const people=getPeople();

  const event=
    events.find(function(item){

      return String(item.id)===
        String(eventId);

    });

  const person=
    people.find(function(item){

      return String(item.id)===
        String(personId);

    });

  if(!event){

    alert("Event not found.");
    return;

  }

  if(!person){

    alert("Person not found.");
    return;

  }

  if(isPersonHardExcluded(
    event,
    person
  )){

    alert(
      "This person cannot be assigned to this event because one or more hard operational requirements are not satisfied."
    );

    return;
  }

  const assignments=
    getAssignments();

  const duplicate=
    assignments.some(function(assignment){

      return (
        String(assignment.eventId)===
          String(event.id)&&
        String(assignment.personId)===
          String(person.id)&&
        assignment.status!=="cancelled"
      );

    });

  if(duplicate){

    alert(
      "This person is already assigned to this event."
    );

    return;
  }

  const required=
    Number(event.headcount)||0;

  const currentAssigned=
    assignments.filter(function(assignment){

      return (
        String(assignment.eventId)===
          String(event.id)&&
        assignment.status!=="cancelled"
      );

    }).length;

  if(
    required>0&&
    currentAssigned>=required
  ){

    alert(
      "The required headcount for this event is already complete."
    );

    return;
  }

  const match=
    calculateMatchScore(
      event,
      person
    );

  if(!match.eligible){

    alert(
      "This person does not meet the operational requirements for this event."
    );

    return;
  }

  const assignment={
    id:generateId("assignment"),
    eventId:event.id,
    personId:person.id,
    score:match.score,
    reasons:match.reasons,
    matchedSkills:match.matchedSkills,
    missingSkills:match.missingSkills,
    assignedAt:new Date().toISOString(),
    status:"assigned",
    managerOverride:false,
    overrideReason:""
  };

 assignments.push(assignment);

saveAssignments(assignments);

/*
 * ASSIGNMENT HISTORY
 *
 * Keep a permanent record of this assignment
 * for future fairness / rotation calculations.
 */
const history=getAssignmentHistory();

history.push({
  id:generateId("history"),
  assignmentId:assignment.id,
  eventId:event.id,
  personId:person.id,
  score:match.score,
  reasons:match.reasons,
  matchedSkills:match.matchedSkills,
  missingSkills:match.missingSkills,
  assignedAt:assignment.assignedAt,
  status:"assigned",
  completedAt:null,
  cancelledAt:null
});

saveAssignmentHistory(history);

const newAssignedCount=
  currentAssigned+1;
  if(
    required>0&&
    newAssignedCount>=required
  ){

    event.status="assigned";

  }else if(
    event.status==="assigned"
  ){

    event.status="open";

  }else if(
    event.status!=="draft"&&
    event.status!=="in-progress"&&
    event.status!=="completed"&&
    event.status!=="cancelled"
  ){

    event.status="open";

  }

  saveEvents(events);

  alert(
    person.name+
    " has been assigned successfully."
  );

  showAssignmentWorkspace(
    event.id
  );
}

function removeAssignment(
  assignmentId,
  eventId
){

  const assignments=
    getAssignments();

  const assignment=
    assignments.find(function(item){

      return String(item.id)===
        String(assignmentId);

    });

  if(!assignment){

    alert(
      "Assignment not found."
    );

    return;
  }

  const person=
    getPersonById(
      assignment.personId
    );

  const personName=
    person?
      person.name:
      "this person";

  if(!confirm(
    "Remove "+
    personName+
    " from this event?"
  )){

    return;
  }

  const remaining=
    assignments.filter(function(item){

      return String(item.id)!==
        String(assignmentId);

    });

  saveAssignments(remaining);

  const events=getEvents();

  const event=
    events.find(function(item){

      return String(item.id)===
        String(eventId);

    });

  if(event){

    const required=
      Number(event.headcount)||0;

    const assignedCount=
      remaining.filter(function(item){

        return (
          String(item.eventId)===
            String(event.id)&&
          item.status!=="cancelled"
        );

      }).length;

    if(
      event.status==="assigned"&&
      (
        required===0||
        assignedCount<required
      )
    ){

      event.status="open";

    }

    saveEvents(events);
  }

  showAssignmentWorkspace(
    eventId
  );
}

function showEditEvent(eventId){

  const events=getEvents();

  const event=
    events.find(function(item){

      return String(item.id)===
        String(eventId);

    });

  if(!event){

    alert("Event not found.");
    return;

  }

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  dashboard.innerHTML=`

    <div class="page-header">

      <div>

        <h2>Edit Event</h2>

        <p>
          Update event information and
          operational requirements.
        </p>

      </div>

      <button
        type="button"
        class="secondary-button"
        id="cancelEditEvent"
      >
        Cancel
      </button>

    </div>

    <section class="dashboard-section">

      <div class="event-form">

        <div class="form-grid">

          <div class="form-group">

            <label for="editEventName">
              Event Name
            </label>

            <input
              id="editEventName"
              type="text"
              value="${escapeHtml(
                event.name||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventClient">
              Client
            </label>

            <input
              id="editEventClient"
              type="text"
              value="${escapeHtml(
                event.client||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventDate">
              Event Date
            </label>

            <input
              id="editEventDate"
              type="date"
              value="${escapeHtml(
                event.date||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventCallTime">
              Call / Assembly Time
            </label>

            <input
              id="editEventCallTime"
              type="time"
              value="${escapeHtml(
                event.callTime||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventStartTime">
              Start Time
            </label>

            <input
              id="editEventStartTime"
              type="time"
              value="${escapeHtml(
                event.startTime||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventEndTime">
              End Time
            </label>

            <input
              id="editEventEndTime"
              type="time"
              value="${escapeHtml(
                event.endTime||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventHeadcount">
              Required Headcount
            </label>

            <input
              id="editEventHeadcount"
              type="number"
              min="0"
              value="${Number(
                event.headcount||0
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventTeamLeader">
              Team Leader
            </label>

            <input
              id="editEventTeamLeader"
              type="text"
              value="${escapeHtml(
                event.teamLeader||""
              )}"
            >

          </div>

          <div class="form-group full-width">

            <label for="editEventLocation">
              Location
            </label>

            <input
              id="editEventLocation"
              type="text"
              value="${escapeHtml(
                event.location||""
              )}"
            >

          </div>

          <div class="form-group full-width">

            <label for="editEventMaps">
              Google Maps
            </label>

            <input
              id="editEventMaps"
              type="url"
              value="${escapeHtml(
                event.maps||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventSkills">
              Required Skills
            </label>

            <input
              id="editEventSkills"
              type="text"
              placeholder="Camera, Editing, Audio"
              value="${escapeHtml(
                event.skills||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventEquipment">
              Required Equipment
            </label>

            <input
              id="editEventEquipment"
              type="text"
              value="${escapeHtml(
                event.equipment||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventTransportation">
              Transportation
            </label>

            <input
              id="editEventTransportation"
              type="text"
              value="${escapeHtml(
                event.transportation||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editEventStatus">
              Status
            </label>

            <select id="editEventStatus">

              <option
                value="draft"
                ${event.status==="draft"?"selected":""}
              >
                Draft
              </option>

              <option
                value="open"
                ${event.status==="open"?"selected":""}
              >
                Open
              </option>

              <option
                value="assigned"
                ${event.status==="assigned"?"selected":""}
              >
                Assigned
              </option>

              <option
                value="in-progress"
                ${event.status==="in-progress"?"selected":""}
              >
                In Progress
              </option>

              <option
                value="completed"
                ${event.status==="completed"?"selected":""}
              >
                Completed
              </option>

              <option
                value="cancelled"
                ${event.status==="cancelled"?"selected":""}
              >
                Cancelled
              </option>

            </select>

          </div>

          <div class="form-group">

            <label for="editEventTravel">
              Travel Required
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="editEventTravel"
                type="checkbox"
                ${
                  event.travel
                  ?"checked"
                  :""
                }
              >

              Yes

            </label>

          </div>

          <div class="form-group">

            <label for="editEventOvernight">
              Overnight Required
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="editEventOvernight"
                type="checkbox"
                ${
                  event.overnight
                  ?"checked"
                  :""
                }
              >

              Yes

            </label>

          </div>

          <div class="form-group">

            <label for="editEventWeekend">
              Weekend Required
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="editEventWeekend"
                type="checkbox"
                ${
                  event.weekend
                  ?"checked"
                  :""
                }
              >

              Yes

            </label>

          </div>

          <div class="form-group full-width">

            <label for="editEventNotes">
              Notes
            </label>

            <textarea
              id="editEventNotes"
              rows="6"
            >${escapeHtml(
              event.notes||""
            )}</textarea>

          </div>

        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelEditEventBottom"
          >
            Cancel
          </button>

          <button
            type="button"
            class="primary-button"
            id="saveEditedEvent"
          >
            Save Changes
          </button>

        </div>

      </div>

    </section>
  `;

  function cancelEdit(){
    showEventDetails(event.id);
  }

  document
    .getElementById(
      "cancelEditEvent"
    )
    .addEventListener(
      "click",
      cancelEdit
    );

  document
    .getElementById(
      "cancelEditEventBottom"
    )
    .addEventListener(
      "click",
      cancelEdit
    );

  document
    .getElementById(
      "saveEditedEvent"
    )
    .addEventListener(
      "click",
      function(){

        const name=
          document.getElementById(
            "editEventName"
          ).value.trim();

        if(!name){

          alert(
            "Please enter an event name."
          );

          return;
        }

        event.name=name;

        event.client=
          document.getElementById(
            "editEventClient"
          ).value.trim();

        event.date=
          document.getElementById(
            "editEventDate"
          ).value;

        event.callTime=
          document.getElementById(
            "editEventCallTime"
          ).value;

        event.startTime=
          document.getElementById(
            "editEventStartTime"
          ).value;

        event.endTime=
          document.getElementById(
            "editEventEndTime"
          ).value;

        event.headcount=
          Number(
            document.getElementById(
              "editEventHeadcount"
            ).value
          )||0;

        event.teamLeader=
          document.getElementById(
            "editEventTeamLeader"
          ).value.trim();

        event.location=
          document.getElementById(
            "editEventLocation"
          ).value.trim();

        event.maps=
          document.getElementById(
            "editEventMaps"
          ).value.trim();

        event.skills=
          document.getElementById(
            "editEventSkills"
          ).value.trim();

        event.equipment=
          document.getElementById(
            "editEventEquipment"
          ).value.trim();

        event.transportation=
          document.getElementById(
            "editEventTransportation"
          ).value.trim();

        event.status=
          document.getElementById(
            "editEventStatus"
          ).value;

        event.travel=
          document.getElementById(
            "editEventTravel"
          ).checked;

        event.overnight=
          document.getElementById(
            "editEventOvernight"
          ).checked;

        event.weekend=
          document.getElementById(
            "editEventWeekend"
          ).checked;

        event.notes=
          document.getElementById(
            "editEventNotes"
          ).value.trim();

        saveEvents(events);

        syncEventAssignmentStatus(
          event.id
        );

        alert(
          "Event updated successfully."
        );

        showEventDetails(
          event.id
        );

      }
    );
}

function showCreateEvent(){

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  dashboard.innerHTML=`

    <div class="page-header">

      <div>

        <h2>Create Event</h2>

        <p>
          Add a new event and define its
          operational requirements.
        </p>

      </div>

      <button
        type="button"
        class="secondary-button"
        id="cancelCreateEvent"
      >
        Cancel
      </button>

    </div>

    <section class="dashboard-section">

      <div class="event-form">

        <div class="form-grid">

          <div class="form-group">

            <label for="eventName">
              Event Name
            </label>

            <input
              id="eventName"
              type="text"
              placeholder="Example: News Report - Cairo"
            >

          </div>

          <div class="form-group">

            <label for="eventClient">
              Client
            </label>

            <input
              id="eventClient"
              type="text"
              placeholder="Client name"
            >

          </div>

          <div class="form-group">

            <label for="eventDate">
              Event Date
            </label>

            <input
              id="eventDate"
              type="date"
            >

          </div>

          <div class="form-group">

            <label for="eventCallTime">
              Call / Assembly Time
            </label>

            <input
              id="eventCallTime"
              type="time"
            >

          </div>

          <div class="form-group">

            <label for="eventStartTime">
              Start Time
            </label>

            <input
              id="eventStartTime"
              type="time"
            >

          </div>

          <div class="form-group">

            <label for="eventEndTime">
              End Time
            </label>

            <input
              id="eventEndTime"
              type="time"
            >

          </div>

          <div class="form-group">

            <label for="eventHeadcount">
              Required Headcount
            </label>

            <input
              id="eventHeadcount"
              type="number"
              min="0"
              value="1"
            >

          </div>

          <div class="form-group">

            <label for="eventTeamLeader">
              Team Leader
            </label>

            <input
              id="eventTeamLeader"
              type="text"
              placeholder="Team leader name"
            >

          </div>

          <div class="form-group full-width">

            <label for="eventLocation">
              Location
            </label>

            <input
              id="eventLocation"
              type="text"
              placeholder="Cairo"
            >

          </div>

          <div class="form-group full-width">

            <label for="eventMaps">
              Google Maps
            </label>

            <input
              id="eventMaps"
              type="url"
              placeholder="https://maps.google.com/..."
            >

          </div>

          <div class="form-group">

            <label for="eventSkills">
              Required Skills
            </label>

            <input
              id="eventSkills"
              type="text"
              placeholder="Camera, Editing, Audio"
            >

          </div>

          <div class="form-group">

            <label for="eventEquipment">
              Required Equipment
            </label>

            <input
              id="eventEquipment"
              type="text"
              placeholder="Camera, Lights..."
            >

          </div>

          <div class="form-group">

            <label for="eventTransportation">
              Transportation
            </label>

            <input
              id="eventTransportation"
              type="text"
              placeholder="Company car / Uber / Own car"
            >

          </div>

          <div class="form-group">

            <label for="eventStatus">
              Status
            </label>

            <select id="eventStatus">

              <option value="draft">
                Draft
              </option>

              <option value="open">
                Open
              </option>

            </select>

          </div>

          <div class="form-group">

            <label for="eventTravel">
              Travel Required
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="eventTravel"
                type="checkbox"
              >

              Yes

            </label>

          </div>

          <div class="form-group">

            <label for="eventOvernight">
              Overnight Required
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="eventOvernight"
                type="checkbox"
              >

              Yes

            </label>

          </div>

          <div class="form-group">

            <label for="eventWeekend">
              Weekend Required
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="eventWeekend"
                type="checkbox"
              >

              Yes

            </label>

          </div>

          <div class="form-group full-width">

            <label for="eventNotes">
              Notes
            </label>

            <textarea
              id="eventNotes"
              rows="6"
              placeholder="Operational notes..."
            ></textarea>

          </div>

        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelCreateEventBottom"
          >
            Cancel
          </button>

          <button
            type="button"
            class="primary-button"
            id="saveEventButton"
          >
            Create Event
          </button>

        </div>

      </div>

    </section>
  `;

  function cancelCreate(){
    showEventsPage();
  }

  document
    .getElementById(
      "cancelCreateEvent"
    )
    .addEventListener(
      "click",
      cancelCreate
    );

  document
    .getElementById(
      "cancelCreateEventBottom"
    )
    .addEventListener(
      "click",
      cancelCreate
    );

  document
    .getElementById(
      "saveEventButton"
    )
    .addEventListener(
      "click",
      function(){

        const name=
          document.getElementById(
            "eventName"
          ).value.trim();

        if(!name){

          alert(
            "Please enter an event name."
          );

          return;
        }

        const events=getEvents();

        const event={

          id:generateId("event"),

          name:name,

          client:
            document.getElementById(
              "eventClient"
            ).value.trim(),

          date:
            document.getElementById(
              "eventDate"
            ).value,

          callTime:
            document.getElementById(
              "eventCallTime"
            ).value,

          startTime:
            document.getElementById(
              "eventStartTime"
            ).value,

          endTime:
            document.getElementById(
              "eventEndTime"
            ).value,

          headcount:
            Number(
              document.getElementById(
                "eventHeadcount"
              ).value
            )||0,

          teamLeader:
            document.getElementById(
              "eventTeamLeader"
            ).value.trim(),

          location:
            document.getElementById(
              "eventLocation"
            ).value.trim(),

          maps:
            document.getElementById(
              "eventMaps"
            ).value.trim(),

          skills:
            document.getElementById(
              "eventSkills"
            ).value.trim(),

          equipment:
            document.getElementById(
              "eventEquipment"
            ).value.trim(),

          transportation:
            document.getElementById(
              "eventTransportation"
            ).value.trim(),

          status:
            document.getElementById(
              "eventStatus"
            ).value,

          travel:
            document.getElementById(
              "eventTravel"
            ).checked,

          overnight:
            document.getElementById(
              "eventOvernight"
            ).checked,

          weekend:
            document.getElementById(
              "eventWeekend"
            ).checked,

          notes:
            document.getElementById(
              "eventNotes"
            ).value.trim(),

          createdAt:
            new Date().toISOString()

        };

        events.push(event);

        saveEvents(events);

        alert(
          "Event created successfully."
        );

        showEventDetails(
          event.id
        );

      }
    );
}

function showPeoplePage(){

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  const people=getPeople();

  dashboard.innerHTML=`

    <div class="page-header">

      <div>

        <h2>People</h2>

        <p>
          Manage employees and freelancers.
        </p>

      </div>

      <button
        type="button"
        class="primary-button"
        id="createPersonButton"
      >
        + Add Person
      </button>

    </div>

    <section class="dashboard-section">

      <div class="section-header">

        <div>

          <h3>
            Crew Database
          </h3>

          <p>
            ${people.length}
            people registered.
          </p>

        </div>

      </div>

      <div
        style="
          display:flex;
          gap:12px;
          flex-wrap:wrap;
          margin-bottom:24px;
        "
      >

        <input
          id="peopleSearch"
          type="text"
          placeholder="Search people..."
          style="
            flex:1;
            min-width:220px;
            padding:14px 16px;
            border:1px solid var(--border);
            border-radius:10px;
            font-size:15px;
          "
        >

        <select
          id="peopleTypeFilter"
          style="
            min-width:180px;
            padding:14px 16px;
            border:1px solid var(--border);
            border-radius:10px;
            font-size:15px;
          "
        >

          <option value="all">
            All Types
          </option>

          <option value="employee">
            Employees
          </option>

          <option value="freelancer">
            Freelancers
          </option>

        </select>

      </div>

      <div id="peopleContainer"></div>

    </section>
  `;

  document
    .getElementById(
      "createPersonButton"
    )
    .addEventListener(
      "click",
      showCreatePerson
    );

  const search=
    document.getElementById(
      "peopleSearch"
    );

  const filter=
    document.getElementById(
      "peopleTypeFilter"
    );

  function renderPeople(){

    const searchValue=
      search.value.toLowerCase().trim();

    const typeValue=
      filter.value;

    const filtered=
      people.filter(function(person){

        const text=
          (
            (person.name||"")+
            " "+
            (person.role||"")+
            " "+
            (person.skills||"")+
            " "+
            (person.location||"")
          ).toLowerCase();

        const matchesSearch=
          !searchValue||
          text.includes(searchValue);

        const matchesType=
          typeValue==="all"||
          (person.type||"employee")===
            typeValue;

        return (
          matchesSearch&&
          matchesType
        );

      });

    const container=
      document.getElementById(
        "peopleContainer"
      );

    if(filtered.length===0){

      container.innerHTML=`

        <div class="empty-state">

          <div class="empty-icon">
            👥
          </div>

          <h3>
            No people found
          </h3>

          <p>
            Add your first employee or freelancer.
          </p>

          <button
            type="button"
            class="primary-button"
            id="createPersonEmptyButton"
          >
            + Add Person
          </button>

        </div>
      `;

      document
        .getElementById(
          "createPersonEmptyButton"
        )
        .addEventListener(
          "click",
          showCreatePerson
        );

      return;
    }

    container.innerHTML=`

      <div class="events-list">

        ${filtered.map(function(person){

          const assignmentCount=
            getActiveAssignmentsForPerson(
              person.id
            ).length;

          return `

            <div class="event-card">

              <div class="event-card-main">

                <div class="event-icon">
                  👤
                </div>

                <div>

                  <h3>
                    ${escapeHtml(
                      person.name||
                      "Unnamed Person"
                    )}
                  </h3>

                  <p>
                    ${escapeHtml(
                      person.role||
                      "No role specified"
                    )}
                  </p>

                </div>

              </div>

              <div class="event-details">

                <span>
                  ${
                    person.type==="freelancer"
                    ?"Freelancer"
                    :"Employee"
                  }
                </span>

                <span>
                  ⭐
                  ${escapeHtml(
                    person.rating||
                    "Not rated"
                  )}
                </span>

                <span>
                  📍
                  ${escapeHtml(
                    person.location||
                    "No location"
                  )}
                </span>

                <span>
                  🛠️
                  ${escapeHtml(
                    person.skills||
                    "No skills"
                  )}
                </span>

                <span>
                  📊
                  ${assignmentCount}
                  active assignment
                  ${assignmentCount===1?"":"s"}
                </span>

                <button
                  type="button"
                  class="secondary-button person-view-button"
                  data-person-id="${person.id}"
                >
                  View Details
                </button>

              </div>

            </div>

          `;

        }).join("")}

      </div>
    `;

    container
      .querySelectorAll(
        ".person-view-button"
      )
      .forEach(function(button){

        button.addEventListener(
          "click",
          function(){

            showPersonDetails(
              button.getAttribute(
                "data-person-id"
              )
            );

          }
        );

      });
  }

  search.addEventListener(
    "input",
    renderPeople
  );

  filter.addEventListener(
    "change",
    renderPeople
  );

  renderPeople();
}

function showPersonDetails(personId){

  const person=
    getPersonById(personId);

  if(!person){

    alert(
      "Person not found."
    );

    return;
  }

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  const assignments=
    getActiveAssignmentsForPerson(
      person.id
    );

  const events=
    getEvents();

  dashboard.innerHTML=`

    <div class="page-header">

      <div>

        <h2>Person Details</h2>

        <p>
          Crew member profile and operational information.
        </p>

      </div>

      <div
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        "
      >

        <button
          type="button"
          class="primary-button"
          id="editPersonButton"
        >
          ✏️ Edit Person
        </button>

        <button
          type="button"
          class="secondary-button"
          id="deletePersonButton"
        >
          🗑️ Delete Person
        </button>

        <button
          type="button"
          class="secondary-button"
          id="backToPeopleButton"
        >
          ← Back to People
        </button>

      </div>

    </div>

    <section class="dashboard-section">

      <div class="event-form">

        <div class="form-grid">

          <div class="form-group">

            <label>Name</label>

            <input
              type="text"
              value="${escapeHtml(
                person.name||"--"
              )}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Type</label>

            <input
              type="text"
              value="${
                person.type==="freelancer"
                ?"Freelancer"
                :"Employee"
              }"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Role</label>

            <input
              type="text"
              value="${escapeHtml(
                person.role||"--"
              )}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Availability</label>

            <input
              type="text"
              value="${escapeHtml(
                person.availability||
                "Available"
              )}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Location</label>

            <input
              type="text"
              value="${escapeHtml(
                person.location||"--"
              )}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Rate</label>

            <input
              type="text"
              value="${escapeHtml(
                person.rate||"--"
              )}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Rating</label>

            <input
              type="text"
              value="${escapeHtml(
                person.rating||"--"
              )}"
              readonly
            >

          </div>

          <div class="form-group full-width">

            <label>Skills</label>

            <input
              type="text"
              value="${escapeHtml(
                person.skills||"--"
              )}"
              readonly
            >

          </div>

          <div class="form-group full-width">

            <label>Equipment</label>

            <input
              type="text"
              value="${escapeHtml(
                person.equipment||"--"
              )}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Travel</label>

            <input
              type="text"
              value="${person.travel?"Yes":"No"}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Overnight</label>

            <input
              type="text"
              value="${person.overnight?"Yes":"No"}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Weekend</label>

            <input
              type="text"
              value="${person.weekend?"Yes":"No"}"
              readonly
            >

          </div>

          <div class="form-group">

            <label>Active Assignments</label>

            <input
              type="text"
              value="${assignments.length}"
              readonly
            >

          </div>

        </div>

      </div>

    </section>

    <section class="dashboard-section">

      <div class="section-header">

        <div>

          <h3>
            Current Assignments
          </h3>

          <p>
            Events currently assigned to this person.
          </p>

        </div>

      </div>

      <div id="personAssignments"></div>

    </section>
  `;

  const assignmentContainer=
    document.getElementById(
      "personAssignments"
    );

  if(assignments.length===0){

    assignmentContainer.innerHTML=`

      <div class="empty-state">

        <div class="empty-icon">
          📋
        </div>

        <h3>
          No active assignments
        </h3>

        <p>
          This person is currently not assigned
          to any active event.
        </p>

      </div>
    `;

  }else{

    assignmentContainer.innerHTML=`

      <div class="events-list">

        ${assignments.map(function(assignment){

          const event=
            events.find(function(item){

              return String(item.id)===
                String(assignment.eventId);

            });

          if(!event){
            return "";
          }

          return `

            <div class="event-card">

              <div class="event-card-main">

                <div class="event-icon">
                  📅
                </div>

                <div>

                  <h3>
                    ${escapeHtml(
                      event.name||
                      "Unnamed Event"
                    )}
                  </h3>

                  <p>
                    ${escapeHtml(
                      event.client||
                      "No client"
                    )}
                  </p>

                </div>

              </div>

              <div class="event-details">

                <span>
                  📆
                  ${escapeHtml(
                    event.date||
                    "--"
                  )}
                </span>

                <span>
                  📍
                  ${escapeHtml(
                    event.location||
                    "--"
                  )}
                </span>

                <span>
                  ⭐
                  ${assignment.score||0}%
                  Match
                </span>

                <button
                  type="button"
                  class="secondary-button person-event-button"
                  data-event-id="${event.id}"
                >
                  View Event
                </button>

              </div>

            </div>

          `;

        }).join("")}

      </div>
    `;

    assignmentContainer
      .querySelectorAll(
        ".person-event-button"
      )
      .forEach(function(button){

        button.addEventListener(
          "click",
          function(){

            showEventDetails(
              button.getAttribute(
                "data-event-id"
              )
            );

          }
        );

      });
  }

  document
    .getElementById(
      "editPersonButton"
    )
    .addEventListener(
      "click",
      function(){

        showEditPerson(
          person.id
        );

      }
    );

  document
    .getElementById(
      "deletePersonButton"
    )
    .addEventListener(
      "click",
      function(){

        if(!confirm(
          "Are you sure you want to delete this person?"
        )){
          return;
        }

        const people=
          getPeople().filter(
            function(item){

              return String(item.id)!==
                String(person.id);

            }
          );

        savePeople(people);

        const assignments=
          getAssignments().filter(
            function(assignment){

              return String(
                assignment.personId
              )!==String(person.id);

            }
          );

        saveAssignments(
          assignments
        );

        alert(
          "Person deleted successfully."
        );

        showPeoplePage();

      }
    );

  document
    .getElementById(
      "backToPeopleButton"
    )
    .addEventListener(
      "click",
      showPeoplePage
    );
}

function showCreatePerson(){

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  dashboard.innerHTML=`

    <div class="page-header">

      <div>

        <h2>Add Person</h2>

        <p>
          Add an employee or freelancer to the crew database.
        </p>

      </div>

      <button
        type="button"
        class="secondary-button"
        id="cancelCreatePerson"
      >
        Cancel
      </button>

    </div>

    <section class="dashboard-section">

      <div class="event-form">

        <div class="form-grid">

          <div class="form-group">

            <label for="personName">
              Name
            </label>

            <input
              id="personName"
              type="text"
              placeholder="Full name"
            >

          </div>

          <div class="form-group">

            <label for="personType">
              Type
            </label>

            <select id="personType">

              <option value="employee">
                Employee
              </option>

              <option value="freelancer">
                Freelancer
              </option>

            </select>

          </div>

          <div class="form-group">

            <label for="personRole">
              Role
            </label>

            <input
              id="personRole"
              type="text"
              placeholder="Camera Operator"
            >

          </div>

          <div class="form-group">

            <label for="personAvailability">
              Availability
            </label>

            <select id="personAvailability">

              <option value="Available">
                Available
              </option>

              <option value="Limited">
                Limited
              </option>

              <option value="Unavailable">
                Unavailable
              </option>

            </select>

          </div>

          <div class="form-group">

            <label for="personLocation">
              Location
            </label>

            <input
              id="personLocation"
              type="text"
              placeholder="Cairo"
            >

          </div>

          <div class="form-group">

            <label for="personRate">
              Rate
            </label>

            <input
              id="personRate"
              type="text"
              placeholder="Daily / event rate"
            >

          </div>

          <div class="form-group">

            <label for="personRating">
              Rating
            </label>

            <input
              id="personRating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="0 - 5"
            >

          </div>

          <div class="form-group full-width">

            <label for="personSkills">
              Skills
            </label>

            <input
              id="personSkills"
              type="text"
              placeholder="Camera, Editing, Audio"
            >

          </div>

          <div class="form-group full-width">

            <label for="personEquipment">
              Equipment
            </label>

            <input
              id="personEquipment"
              type="text"
              placeholder="Camera, Laptop, Audio kit..."
            >

          </div>

          <div class="form-group">

            <label>
              Travel
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="personTravel"
                type="checkbox"
              >

              Available for travel

            </label>

          </div>

          <div class="form-group">

            <label>
              Overnight
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="personOvernight"
                type="checkbox"
              >

              Available overnight

            </label>

          </div>

          <div class="form-group">

            <label>
              Weekend
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="personWeekend"
                type="checkbox"
              >

              Available weekends

            </label>

          </div>

        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelCreatePersonBottom"
          >
            Cancel
          </button>

          <button
            type="button"
            class="primary-button"
            id="savePersonButton"
          >
            Add Person
          </button>

        </div>

      </div>

    </section>
  `;

  function cancelCreatePerson(){
    showPeoplePage();
  }

  document
    .getElementById(
      "cancelCreatePerson"
    )
    .addEventListener(
      "click",
      cancelCreatePerson
    );

  document
    .getElementById(
      "cancelCreatePersonBottom"
    )
    .addEventListener(
      "click",
      cancelCreatePerson
    );

  document
    .getElementById(
      "savePersonButton"
    )
    .addEventListener(
      "click",
      function(){

        const name=
          document.getElementById(
            "personName"
          ).value.trim();

        if(!name){

          alert(
            "Please enter a name."
          );

          return;
        }

        const people=
          getPeople();

        const person={

          id:generateId("person"),

          name:name,

          type:
            document.getElementById(
              "personType"
            ).value,

          role:
            document.getElementById(
              "personRole"
            ).value.trim(),

          availability:
            document.getElementById(
              "personAvailability"
            ).value,

          location:
            document.getElementById(
              "personLocation"
            ).value.trim(),

          rate:
            document.getElementById(
              "personRate"
            ).value.trim(),

          rating:
            document.getElementById(
              "personRating"
            ).value,

          skills:
            document.getElementById(
              "personSkills"
            ).value.trim(),

          equipment:
            document.getElementById(
              "personEquipment"
            ).value.trim(),

          travel:
            document.getElementById(
              "personTravel"
            ).checked,

          overnight:
            document.getElementById(
              "personOvernight"
            ).checked,

          weekend:
            document.getElementById(
              "personWeekend"
            ).checked,

          createdAt:
            new Date().toISOString()

        };

        people.push(person);

        savePeople(people);

        alert(
          "Person added successfully."
        );

        showPersonDetails(
          person.id
        );

      }
    );
}

function showEditPerson(personId){

  const people=
    getPeople();

  const person=
    people.find(function(item){

      return String(item.id)===
        String(personId);

    });

  if(!person){

    alert(
      "Person not found."
    );

    return;
  }

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  dashboard.innerHTML=`

    <div class="page-header">

      <div>

        <h2>Edit Person</h2>

        <p>
          Update crew member information.
        </p>

      </div>

      <button
        type="button"
        class="secondary-button"
        id="cancelEditPerson"
      >
        Cancel
      </button>

    </div>

    <section class="dashboard-section">

      <div class="event-form">

        <div class="form-grid">

          <div class="form-group">

            <label for="editPersonName">
              Name
            </label>

            <input
              id="editPersonName"
              type="text"
              value="${escapeHtml(
                person.name||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editPersonType">
              Type
            </label>

            <select id="editPersonType">

              <option
                value="employee"
                ${
                  person.type!=="freelancer"
                  ?"selected"
                  :""
                }
              >
                Employee
              </option>

              <option
                value="freelancer"
                ${
                  person.type==="freelancer"
                  ?"selected"
                  :""
                }
              >
                Freelancer
              </option>

            </select>

          </div>

          <div class="form-group">

            <label for="editPersonRole">
              Role
            </label>

            <input
              id="editPersonRole"
              type="text"
              value="${escapeHtml(
                person.role||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editPersonAvailability">
              Availability
            </label>

            <select id="editPersonAvailability">

              <option
                value="Available"
                ${
                  (person.availability||
                  "Available")==="Available"
                  ?"selected"
                  :""
                }
              >
                Available
              </option>

              <option
                value="Limited"
                ${
                  person.availability==="Limited"
                  ?"selected"
                  :""
                }
              >
                Limited
              </option>

              <option
                value="Unavailable"
                ${
                  person.availability==="Unavailable"
                  ?"selected"
                  :""
                }
              >
                Unavailable
              </option>

            </select>

          </div>

          <div class="form-group">

            <label for="editPersonLocation">
              Location
            </label>

            <input
              id="editPersonLocation"
              type="text"
              value="${escapeHtml(
                person.location||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editPersonRate">
              Rate
            </label>

            <input
              id="editPersonRate"
              type="text"
              value="${escapeHtml(
                person.rate||""
              )}"
            >

          </div>

          <div class="form-group">

            <label for="editPersonRating">
              Rating
            </label>

            <input
              id="editPersonRating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value="${escapeHtml(
                person.rating||""
              )}"
            >

          </div>

          <div class="form-group full-width">

            <label for="editPersonSkills">
              Skills
            </label>

            <input
              id="editPersonSkills"
              type="text"
              value="${escapeHtml(
                person.skills||""
              )}"
            >

          </div>

          <div class="form-group full-width">

            <label for="editPersonEquipment">
              Equipment
            </label>

            <input
              id="editPersonEquipment"
              type="text"
              value="${escapeHtml(
                person.equipment||""
              )}"
            >

          </div>

          <div class="form-group">

            <label>
              Travel
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="editPersonTravel"
                type="checkbox"
                ${
                  person.travel
                  ?"checked"
                  :""
                }
              >

              Available for travel

            </label>

          </div>

          <div class="form-group">

            <label>
              Overnight
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="editPersonOvernight"
                type="checkbox"
                ${
                  person.overnight
                  ?"checked"
                  :""
                }
              >

              Available overnight

            </label>

          </div>

          <div class="form-group">

            <label>
              Weekend
            </label>

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
              "
            >

              <input
                id="editPersonWeekend"
                type="checkbox"
                ${
                  person.weekend
                  ?"checked"
                  :""
                }
              >

              Available weekends

            </label>

          </div>

        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelEditPersonBottom"
          >
            Cancel
          </button>

          <button
            type="button"
            class="primary-button"
            id="saveEditedPerson"
          >
            Save Changes
          </button>

        </div>

      </div>

    </section>
  `;

  function cancelEditPerson(){
    showPersonDetails(
      person.id
    );
  }

  document
    .getElementById(
      "cancelEditPerson"
    )
    .addEventListener(
      "click",
      cancelEditPerson
    );

  document
    .getElementById(
      "cancelEditPersonBottom"
    )
    .addEventListener(
      "click",
      cancelEditPerson
    );

  document
    .getElementById(
      "saveEditedPerson"
    )
    .addEventListener(
      "click",
      function(){

        const name=
          document.getElementById(
            "editPersonName"
          ).value.trim();

        if(!name){

          alert(
            "Please enter a name."
          );

          return;
        }

        person.name=name;

        person.type=
          document.getElementById(
            "editPersonType"
          ).value;

        person.role=
          document.getElementById(
            "editPersonRole"
          ).value.trim();

        person.availability=
          document.getElementById(
            "editPersonAvailability"
          ).value;

        person.location=
          document.getElementById(
            "editPersonLocation"
          ).value.trim();

        person.rate=
          document.getElementById(
            "editPersonRate"
          ).value.trim();

        person.rating=
          document.getElementById(
            "editPersonRating"
          ).value;

        person.skills=
          document.getElementById(
            "editPersonSkills"
          ).value.trim();

        person.equipment=
          document.getElementById(
            "editPersonEquipment"
          ).value.trim();

        person.travel=
          document.getElementById(
            "editPersonTravel"
          ).checked;

        person.overnight=
          document.getElementById(
            "editPersonOvernight"
          ).checked;

        person.weekend=
          document.getElementById(
            "editPersonWeekend"
          ).checked;

        person.updatedAt=
          new Date().toISOString();

        savePeople(people);

        alert(
          "Person updated successfully."
        );

        showPersonDetails(
          person.id
        );

      }
    );
}

function showComingSoon(pageName){

  const dashboard=
    document.querySelector(".dashboard");

  if(!dashboard){
    return;
  }

  dashboard.innerHTML=`

    <div class="page-header">

      <div>

        <h2>
          ${escapeHtml(pageName)}
        </h2>

        <p>
          This module is planned for the next stage.
        </p>

      </div>

    </div>

    <section class="dashboard-section">

      <div class="empty-state">

        <div class="empty-icon">
          🚧
        </div>

        <h3>
          Coming Soon
        </h3>

        <p>
          The ${escapeHtml(pageName)}
          module will be added in a future
          CrewFlow release.
        </p>

      </div>

    </section>
  `;
}
