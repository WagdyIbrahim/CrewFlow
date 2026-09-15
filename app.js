document.addEventListener("DOMContentLoaded",function(){setupNavigation();setupGlobalActions();});
function setupNavigation(){
  const navItems=document.querySelectorAll(".nav-item");
  navItems.forEach(function(item){
    item.addEventListener("click",function(event){
      event.preventDefault();
      navItems.forEach(function(nav){nav.classList.remove("active");});
      item.classList.add("active");
      const page=item.textContent.trim();
      if(page==="Events"){showEventsPage();return;}
      if(page==="Dashboard"){showDashboard();return;}
    });
  });
}
function setupGlobalActions(){
  document.addEventListener("click",function(event){
    const createButton=event.target.closest(".primary-button");
    if(createButton&&createButton.textContent.includes("Create Event")){showCreateEvent();}
  });
}
function showDashboard(){window.location.reload();}
function getEvents(){return JSON.parse(localStorage.getItem("crewflow_events")||"[]");}
function saveEvents(events){localStorage.setItem("crewflow_events",JSON.stringify(events));}
function statusLabel(status){
  const labels={draft:"Draft",open:"Open",assigned:"Assigned","in-progress":"In Progress",completed:"Completed",cancelled:"Cancelled"};
  return labels[status]||"Draft";
}
function showEventsPage(){
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;
  const events=getEvents();
  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Events</h2>
        <p>Manage events, schedules, locations and crew requirements.</p>
      </div>
      <button type="button" class="primary-button" id="createEventTopButton">+ Create Event</button>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <div>
          <h3>All Events</h3>
          <p>${events.length} event${events.length===1?"":"s"} registered.</p>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <input id="eventSearch" type="text" placeholder="Search events..." style="flex:1;min-width:220px;padding:14px 16px;border:1px solid var(--border);border-radius:10px;font-size:15px;">
        <select id="eventStatusFilter" style="min-width:180px;padding:14px 16px;border:1px solid var(--border);border-radius:10px;font-size:15px;">
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
  document.getElementById("createEventTopButton").addEventListener("click",showCreateEvent);
  const search=document.getElementById("eventSearch");
  const filter=document.getElementById("eventStatusFilter");
  function renderEvents(){
    const searchValue=search.value.toLowerCase().trim();
    const statusValue=filter.value;
    const filtered=events.filter(function(event){
      const text=((event.name||"")+" "+(event.client||"")+" "+(event.location||"")).toLowerCase();
      const matchesSearch=!searchValue||text.includes(searchValue);
      const matchesStatus=statusValue==="all"||(event.status||"draft")===statusValue;
      return matchesSearch&&matchesStatus;
    });
    const container=document.getElementById("eventsContainer");
    if(filtered.length===0){
      container.innerHTML=`<div class="empty-state"><div class="empty-icon">📅</div><h3>No events found</h3><p>Try another search or create a new event.</p><button type="button" class="primary-button" id="createEventEmptyButton">+ Create Event</button></div>`;
      document.getElementById("createEventEmptyButton").addEventListener("click",showCreateEvent);
      return;
    }
    container.innerHTML=`<div class="events-list">${filtered.map(function(event){
      return `
        <div class="event-card">
          <div class="event-card-main">
            <div class="event-icon">📅</div>
            <div>
              <h3>${event.name||"Unnamed Event"}</h3>
              <p>${event.client||"No client specified"}</p>
            </div>
          </div>
          <div class="event-details">
            <span>📆 ${event.date||"No date"}</span>
            <span>🕐 ${event.startTime||"--"} - ${event.endTime||"--"}</span>
            <span>📍 ${event.location||"No location"}</span>
            <span>👥 ${event.headcount||"0"} crew</span>
            <span>📌 ${statusLabel(event.status)}</span>
            <button type="button" class="secondary-button event-view-button" data-event-id="${event.id}">View Details</button>
          </div>
        </div>
      `;
    }).join("")}</div>`;
    container.querySelectorAll(".event-view-button").forEach(function(button){
      button.addEventListener("click",function(){showEventDetails(button.getAttribute("data-event-id"));});
    });
  }
  search.addEventListener("input",renderEvents);
  filter.addEventListener("change",renderEvents);
  renderEvents();
}
function showEventDetails(eventId){
  const events=getEvents();
  const event=events.find(function(item){return String(item.id)===String(eventId);});
  if(!event){alert("Event not found.");return;}
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;
  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Event Details</h2>
        <p>Complete operational information for this event.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="primary-button" id="editEventButton">✏️ Edit Event</button>
        <button type="button" class="secondary-button" id="deleteEventButton">🗑️ Delete Event</button>
        <button type="button" class="secondary-button" id="backToEvents">← Back to Events</button>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <h3>${event.name||"Unnamed Event"}</h3>
        <p>${event.client||"No client specified"}</p>
      </div>
      <div class="event-form">
        <div class="form-grid">
          <div class="form-group"><label>Status</label><input type="text" value="${statusLabel(event.status)}" readonly></div>
          <div class="form-group"><label>Event Date</label><input type="text" value="${event.date||"--"}" readonly></div>
          <div class="form-group"><label>Client</label><input type="text" value="${event.client||"--"}" readonly></div>
          <div class="form-group"><label>Call / Assembly Time</label><input type="text" value="${event.callTime||"--"}" readonly></div>
          <div class="form-group"><label>Start Time</label><input type="text" value="${event.startTime||"--"}" readonly></div>
          <div class="form-group"><label>End Time</label><input type="text" value="${event.endTime||"--"}" readonly></div>
          <div class="form-group"><label>Required Headcount</label><input type="text" value="${event.headcount||"0"}" readonly></div>
          <div class="form-group"><label>Team Leader</label><input type="text" value="${event.teamLeader||"--"}" readonly></div>
          <div class="form-group full-width"><label>Location</label><input type="text" value="${event.location||"--"}" readonly></div>
          <div class="form-group full-width"><label>Google Maps</label>${event.maps?`<a href="${event.maps}" target="_blank" rel="noopener noreferrer" class="maps-link">Open Location in Google Maps</a>`:`<input type="text" value="No Google Maps link" readonly>`}</div>
          <div class="form-group"><label>Required Skills</label><input type="text" value="${event.skills||"--"}" readonly></div>
          <div class="form-group"><label>Required Equipment</label><input type="text" value="${event.equipment||"--"}" readonly></div>
          <div class="form-group"><label>Transportation</label><input type="text" value="${event.transportation||"--"}" readonly></div>
          <div class="form-group"><label>Travel</label><input type="text" value="${event.travel?"Yes":"No"}" readonly></div>
          <div class="form-group"><label>Overnight</label><input type="text" value="${event.overnight?"Yes":"No"}" readonly></div>
          <div class="form-group"><label>Weekend</label><input type="text" value="${event.weekend?"Yes":"No"}" readonly></div>
          <div class="form-group full-width"><label>Notes</label><textarea rows="5" readonly>${event.notes||"--"}</textarea></div>
        </div>
      </div>
    </section>
  `;
  document.getElementById("editEventButton").addEventListener("click",function(){showEditEvent(eventId);});
  document.getElementById("deleteEventButton").addEventListener("click",function(){
    if(confirm("Are you sure you want to delete this event?")){
      const remaining=events.filter(function(item){return String(item.id)!==String(eventId);});
      saveEvents(remaining);
      alert("Event deleted successfully.");
      showEventsPage();
    }
  });
  document.getElementById("backToEvents").addEventListener("click",showEventsPage);
}
function showEditEvent(eventId){
  const events=getEvents();
  const event=events.find(function(item){return String(item.id)===String(eventId);});
  if(!event){alert("Event not found.");return;}
  const dashboard=document.querySelector(".dashboard");
  dashboard.innerHTML=`
    <div class="page-header"><div><h2>Edit Event</h2><p>Update the operational information for this event.</p></div></div>
    <section class="dashboard-section">
      <div class="section-header"><h3>${event.name||"Unnamed Event"}</h3><p>Edit event information below.</p></div>
      <form class="event-form" id="editEventForm">
        <div class="form-grid">
          <div class="form-group"><label for="editEventName">Event Name</label><input type="text" id="editEventName" value="${event.name||""}" required></div>
          <div class="form-group"><label for="editClientName">Client</label><input type="text" id="editClientName" value="${event.client||""}"></div>
          <div class="form-group"><label for="editEventDate">Event Date</label><input type="date" id="editEventDate" value="${event.date||""}" required></div>
          <div class="form-group"><label for="editCallTime">Call / Assembly Time</label><input type="time" id="editCallTime" value="${event.callTime||""}"></div>
          <div class="form-group"><label for="editStartTime">Start Time</label><input type="time" id="editStartTime" value="${event.startTime||""}"></div>
          <div class="form-group"><label for="editEndTime">End Time</label><input type="time" id="editEndTime" value="${event.endTime||""}"></div>
          <div class="form-group"><label for="editStatus">Status</label><select id="editStatus"><option value="draft">Draft</option><option value="open">Open</option><option value="assigned">Assigned</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <div class="form-group"><label for="editHeadcount">Required Headcount</label><input type="number" id="editHeadcount" min="1" value="${event.headcount||""}"></div>
          <div class="form-group full-width"><label for="editLocation">Location</label><input type="text" id="editLocation" value="${event.location||""}"></div>
          <div class="form-group full-width"><label for="editMaps">Google Maps Link</label><input type="url" id="editMaps" value="${event.maps||""}" placeholder="https://maps.google.com/..."></div>
          <div class="form-group full-width"><label for="editSkills">Required Skills</label><input type="text" id="editSkills" value="${event.skills||""}" placeholder="Camera, Sound, Lighting..."></div>
          <div class="form-group full-width"><label for="editEquipment">Required Equipment</label><input type="text" id="editEquipment" value="${event.equipment||""}" placeholder="Camera, Microphone, Lights..."></div>
          <div class="form-group"><label for="editTransportation">Transportation</label><input type="text" id="editTransportation" value="${event.transportation||""}" placeholder="Company Car / Taxi / None"></div>
          <div class="form-group"><label for="editTeamLeader">Team Leader</label><input type="text" id="editTeamLeader" value="${event.teamLeader||""}"></div>
          <div class="form-group"><label><input type="checkbox" id="editTravel" ${event.travel?"checked":""}> Travel Required</label></div>
          <div class="form-group"><label><input type="checkbox" id="editOvernight" ${event.overnight?"checked":""}> Overnight Required</label></div>
          <div class="form-group"><label><input type="checkbox" id="editWeekend" ${event.weekend?"checked":""}> Weekend Event</label></div>
          <div class="form-group full-width"><label for="editNotes">Notes</label><textarea id="editNotes" rows="6">${event.notes||""}</textarea></div>
        </div>
        <div class="form-actions"><button type="button" class="secondary-button" id="cancelEditEvent">Cancel</button><button type="submit" class="primary-button">Save Changes</button></div>
      </form>
    </section>
  `;
  document.getElementById("editStatus").value=event.status||"draft";
  document.getElementById("cancelEditEvent").addEventListener("click",function(){showEventDetails(eventId);});
  document.getElementById("editEventForm").addEventListener("submit",function(e){
    e.preventDefault();
    const updatedEvent={
      id:event.id,
      name:document.getElementById("editEventName").value.trim(),
      client:document.getElementById("editClientName").value.trim(),
      date:document.getElementById("editEventDate").value,
      callTime:document.getElementById("editCallTime").value,
      startTime:document.getElementById("editStartTime").value,
      endTime:document.getElementById("editEndTime").value,
      status:document.getElementById("editStatus").value,
      location:document.getElementById("editLocation").value.trim(),
      maps:document.getElementById("editMaps").value.trim(),
      headcount:document.getElementById("editHeadcount").value,
      teamLeader:document.getElementById("editTeamLeader").value.trim(),
      skills:document.getElementById("editSkills").value.trim(),
      equipment:document.getElementById("editEquipment").value.trim(),
      transportation:document.getElementById("editTransportation").value.trim(),
      travel:document.getElementById("editTravel").checked,
      overnight:document.getElementById("editOvernight").checked,
      weekend:document.getElementById("editWeekend").checked,
      notes:document.getElementById("editNotes").value.trim()
    };
    saveEvents(events.map(function(item){return String(item.id)===String(eventId)?updatedEvent:item;}));
    alert("Event updated successfully.");
    showEventDetails(eventId);
  });
}
function showCreateEvent(){
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;
  dashboard.innerHTML=`
    <div class="page-header"><div><h2>Create Event</h2><p>Enter the operational information for the new event.</p></div></div>
    <section class="dashboard-section">
      <div class="section-header"><h3>Event Information</h3><p>Basic details about the event and its operational requirements.</p></div>
      <form class="event-form" id="createEventForm">
        <div class="form-grid">
          <div class="form-group"><label for="eventName">Event Name</label><input type="text" id="eventName" placeholder="Enter event name" required></div>
          <div class="form-group"><label for="clientName">Client</label><input type="text" id="clientName" placeholder="Enter client name"></div>
          <div class="form-group"><label for="eventDate">Event Date</label><input type="date" id="eventDate" required></div>
          <div class="form-group"><label for="callTime">Call / Assembly Time</label><input type="time" id="callTime"></div>
          <div class="form-group"><label for="startTime">Start Time</label><input type="time" id="startTime"></div>
          <div class="form-group"><label for="endTime">End Time</label><input type="time" id="endTime"></div>
          <div class="form-group"><label for="eventStatus">Status</label><select id="eventStatus"><option value="draft">Draft</option><option value="open" selected>Open</option><option value="assigned">Assigned</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <div class="form-group"><label for="headcount">Required Headcount</label><input type="number" id="headcount" min="1" placeholder="Number of crew members"></div>
          <div class="form-group full-width"><label for="location">Location</label><input type="text" id="location" placeholder="Enter event location"></div>
          <div class="form-group full-width"><label for="maps">Google Maps Link</label><input type="url" id="maps" placeholder="https://maps.google.com/..."></div>
          <div class="form-group full-width"><label for="skills">Required Skills</label><input type="text" id="skills" placeholder="Camera, Sound, Lighting..."></div>
          <div class="form-group full-width"><label for="equipment">Required Equipment</label><input type="text" id="equipment" placeholder="Camera, Microphone, Lights..."></div>
          <div class="form-group"><label for="transportation">Transportation</label><input type="text" id="transportation" placeholder="Company Car / Taxi / None"></div>
          <div class="form-group"><label for="teamLeader">Team Leader</label><input type="text" id="teamLeader" placeholder="Team leader"></div>
          <div class="form-group"><label><input type="checkbox" id="travel"> Travel Required</label></div>
          <div class="form-group"><label><input type="checkbox" id="overnight"> Overnight Required</label></div>
          <div class="form-group"><label><input type="checkbox" id="weekend"> Weekend Event</label></div>
          <div class="form-group full-width"><label for="notes">Notes</label><textarea id="notes" rows="5" placeholder="Additional event notes..."></textarea></div>
        </div>
        <div class="form-actions"><button type="button" class="secondary-button" id="cancelCreateEvent">Cancel</button><button type="submit" class="primary-button">Save Event</button></div>
      </form>
    </section>
  `;
  document.getElementById("cancelCreateEvent").addEventListener("click",showEventsPage);
  document.getElementById("createEventForm").addEventListener("submit",function(e){
    e.preventDefault();
    const eventData={
      id:Date.now(),
      name:document.getElementById("eventName").value.trim(),
      client:document.getElementById("clientName").value.trim(),
      date:document.getElementById("eventDate").value,
      callTime:document.getElementById("callTime").value,
      startTime:document.getElementById("startTime").value,
      endTime:document.getElementById("endTime").value,
      status:document.getElementById("eventStatus").value,
      location:document.getElementById("location").value.trim(),
      maps:document.getElementById("maps").value.trim(),
      headcount:document.getElementById("headcount").value,
      teamLeader:document.getElementById("teamLeader").value.trim(),
      skills:document.getElementById("skills").value.trim(),
      equipment:document.getElementById("equipment").value.trim(),
      transportation:document.getElementById("transportation").value.trim(),
      travel:document.getElementById("travel").checked,
      overnight:document.getElementById("overnight").checked,
      weekend:document.getElementById("weekend").checked,
      notes:document.getElementById("notes").value.trim()
    };
    const events=getEvents();
    events.push(eventData);
    saveEvents(events);
    alert("Event saved successfully.");
    showEventsPage();
  });
}
