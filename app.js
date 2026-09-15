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
      navItems.forEach(function(nav){nav.classList.remove("active");});
      item.classList.add("active");
      const page=item.textContent.trim();
      if(page==="Events"){showEventsPage();return;}
      if(page==="Dashboard"){showDashboard();return;}
      if(page==="People"){showPeoplePage();return;}
      if(page==="Clients"){showComingSoon("Clients");return;}
      if(page==="Assignments"){showAssignmentsPage();return;}
      if(page==="Availability"){showComingSoon("Availability");return;}
      if(page==="Resources"){showComingSoon("Resources");return;}
      if(page==="Notifications"){showComingSoon("Notifications");return;}
    });
  });
}

function setupGlobalActions(){
  document.addEventListener("click",function(event){
    const createButton=event.target.closest("#dashboardCreateEventButton");
    if(createButton){showCreateEvent();}
  });
}

function getEvents(){
  return JSON.parse(localStorage.getItem("crewflow_events")||"[]");
}

function saveEvents(events){
  localStorage.setItem("crewflow_events",JSON.stringify(events));
}

function getPeople(){
  return JSON.parse(localStorage.getItem("crewflow_people")||"[]");
}

function savePeople(people){
  localStorage.setItem("crewflow_people",JSON.stringify(people));
}

function getAssignments(){
  return JSON.parse(localStorage.getItem("crewflow_assignments")||"[]");
}

function saveAssignments(assignments){
  localStorage.setItem("crewflow_assignments",JSON.stringify(assignments));
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

function showDashboard(){
  window.location.reload();
}

function updateDashboardStats(){
  const events=getEvents();
  const today=new Date().toISOString().split("T")[0];
  const todayEvents=events.filter(function(event){return event.date===today;});
  const activeEvents=events.filter(function(event){
    return event.status==="open"||event.status==="assigned"||event.status==="in-progress";
  });
  const pendingEvents=events.filter(function(event){
    return event.status==="open"||event.status==="draft";
  });
  const people=getPeople();
  const stats=document.querySelectorAll(".stat-card strong");
  if(stats.length>=4){
    stats[0].textContent=todayEvents.length;
    stats[1].textContent=people.length;
    stats[2].textContent=pendingEvents.length;
    stats[3].textContent=activeEvents.length;
  }
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
      container.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No events found</h3>
          <p>Try another search or create a new event.</p>
          <button type="button" class="primary-button" id="createEventEmptyButton">+ Create Event</button>
        </div>
      `;
      document.getElementById("createEventEmptyButton").addEventListener("click",showCreateEvent);
      return;
    }

    container.innerHTML=`
      <div class="events-list">
        ${filtered.map(function(event){
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
        }).join("")}
      </div>
    `;

    container.querySelectorAll(".event-view-button").forEach(function(button){
      button.addEventListener("click",function(){
        showEventDetails(button.getAttribute("data-event-id"));
      });
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

  const assignments=getAssignments().filter(function(item){
    return String(item.eventId)===String(eventId);
  });

  const people=getPeople();

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Event Details</h2>
        <p>Complete operational information for this event.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="primary-button" id="editEventButton">✏️ Edit Event</button>
        <button type="button" class="primary-button" id="assignCrewFromEvent">👥 Assign Crew</button>
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
    <section class="dashboard-section">
      <div class="section-header">
        <div>
          <h3>Assigned Crew</h3>
          <p>${assignments.length} assigned / ${event.headcount||0} required.</p>
        </div>
      </div>
      <div id="eventAssignedCrew"></div>
    </section>
  `;

  renderAssignedCrew(event,assignments,people);

  document.getElementById("editEventButton").addEventListener("click",function(){
    showEditEvent(eventId);
  });

  document.getElementById("assignCrewFromEvent").addEventListener("click",function(){
    showAssignmentWorkspace(eventId);
  });

  document.getElementById("deleteEventButton").addEventListener("click",function(){
    if(confirm("Are you sure you want to delete this event?")){
      const remaining=events.filter(function(item){return String(item.id)!==String(eventId);});
      saveEvents(remaining);
      saveAssignments(getAssignments().filter(function(item){
        return String(item.eventId)!==String(eventId);
      }));
      alert("Event deleted successfully.");
      showEventsPage();
    }
  });

  document.getElementById("backToEvents").addEventListener("click",showEventsPage);
}

function renderAssignedCrew(event,assignments,people){
  const container=document.getElementById("eventAssignedCrew");
  if(!container)return;

  if(assignments.length===0){
    container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No crew assigned</h3>
        <p>This event does not have any crew assignments yet.</p>
        <button type="button" class="primary-button" id="assignCrewEmptyButton">Assign Crew</button>
      </div>
    `;
    document.getElementById("assignCrewEmptyButton").addEventListener("click",function(){
      showAssignmentWorkspace(event.id);
    });
    return;
  }

  container.innerHTML=`
    <div class="events-list">
      ${assignments.map(function(assignment){
        const person=people.find(function(item){
          return String(item.id)===String(assignment.personId);
        });
        if(!person)return "";
        return `
          <div class="event-card">
            <div class="event-card-main">
              <div class="event-icon">👤</div>
              <div>
                <h3>${person.name||"Unnamed Person"}</h3>
                <p>${person.role||"No role specified"}</p>
              </div>
            </div>
            <div class="event-details">
              <span>⭐ Match ${assignment.score||0}%</span>
              <span>👤 ${person.type==="freelancer"?"Freelancer":"Employee"}</span>
              <span>🛠️ ${person.skills||"No skills"}</span>
              <span>📅 Assigned ${formatAssignmentDate(assignment.assignedAt)}</span>
              <button type="button" class="secondary-button remove-assignment-button" data-assignment-id="${assignment.id}">Remove</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  container.querySelectorAll(".remove-assignment-button").forEach(function(button){
    button.addEventListener("click",function(){
      removeAssignment(button.getAttribute("data-assignment-id"),event.id);
    });
  });
}

function formatAssignmentDate(value){
  if(!value)return "--";
  const date=new Date(value);
  if(isNaN(date.getTime()))return "--";
  return date.toLocaleDateString();
}

function normalizeList(value){
  if(Array.isArray(value)){
    return value.map(function(item){return String(item).trim().toLowerCase();}).filter(Boolean);
  }
  return String(value||"")
    .split(",")
    .map(function(item){return item.trim().toLowerCase();})
    .filter(Boolean);
}

function skillMatchScore(event,person){
  const required=normalizeList(event.skills);
  const personSkills=normalizeList(person.skills);

  if(required.length===0)return 25;

  let matched=0;

  required.forEach(function(skill){
    const found=personSkills.some(function(personSkill){
      return personSkill===skill||personSkill.includes(skill)||skill.includes(personSkill);
    });
    if(found)matched++;
  });

  return Math.round((matched/required.length)*40);
}

function calculateMatchScore(event,person){
  let score=0;
  const reasons=[];
  const warnings=[];

  const skillScore=skillMatchScore(event,person);
  score+=skillScore;

  if(skillScore>=40){
    reasons.push("All required skills matched");
  }else if(skillScore>0){
    reasons.push("Some required skills matched");
    warnings.push("Not all required skills matched");
  }else if(normalizeList(event.skills).length>0){
    warnings.push("Required skills not matched");
  }

  const availability=person.availability||"Available";

  if(availability==="Available"){
    score+=20;
    reasons.push("Available");
  }else if(availability==="Limited"){
    score+=10;
    reasons.push("Limited availability");
    warnings.push("Limited availability");
  }else{
    warnings.push("Currently unavailable");
  }

  if(event.travel){
    if(person.travel){
      score+=8;
      reasons.push("Travel available");
    }else{
      warnings.push("Travel required");
      score-=20;
    }
  }

  if(event.overnight){
    if(person.overnight){
      score+=8;
      reasons.push("Overnight available");
    }else{
      warnings.push("Overnight required");
      score-=20;
    }
  }

  if(event.weekend){
    if(person.weekend){
      score+=7;
      reasons.push("Weekend available");
    }else{
      warnings.push("Weekend availability not confirmed");
      score-=15;
    }
  }

  const rating=parseFloat(person.rating)||0;
  score+=Math.min(rating*2,10);

  if(rating>=4){
    reasons.push("Strong rating");
  }

  const assignments=getAssignments();
  const completedAssignments=assignments.filter(function(assignment){
    return String(assignment.personId)===String(person.id);
  }).length;

  const fairnessBonus=Math.max(0,10-Math.min(completedAssignments,10));
  score+=fairnessBonus;

  if(completedAssignments===0){
    reasons.push("No previous assignments");
  }else{
    reasons.push(completedAssignments+" previous assignment"+(completedAssignments===1?"":"s"));
  }

  if(String(person.location||"").toLowerCase()===String(event.location||"").toLowerCase()&&event.location){
    score+=5;
    reasons.push("Same location");
  }

  score=Math.max(0,Math.min(100,Math.round(score)));

  return {
    score:score,
    reasons:reasons,
    warnings:warnings,
    assignmentCount:completedAssignments
  };
}

function getAssignmentCandidates(eventId){
  const events=getEvents();
  const people=getPeople();
  const assignments=getAssignments();

  const event=events.find(function(item){
    return String(item.id)===String(eventId);
  });

  if(!event)return [];

  const assignedIds=assignments
    .filter(function(item){
      return String(item.eventId)===String(eventId);
    })
    .map(function(item){
      return String(item.personId);
    });

  return people
    .filter(function(person){
      return !assignedIds.includes(String(person.id));
    })
    .map(function(person){
      const match=calculateMatchScore(event,person);
      return {
        person:person,
        score:match.score,
        reasons:match.reasons,
        warnings:match.warnings,
        assignmentCount:match.assignmentCount
      };
    })
    .sort(function(a,b){
      return b.score-a.score;
    });
}

function showAssignmentsPage(){
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  const events=getEvents().filter(function(event){
    return event.status!=="completed"&&event.status!=="cancelled";
  });

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Assignments</h2>
        <p>Match the right crew to each event based on operational requirements.</p>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <div>
          <h3>Assignment Workspace</h3>
          <p>Select an event to see the best crew candidates.</p>
        </div>
      </div>
      <div class="event-form">
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="assignmentEventSelect">Select Event</label>
            <select id="assignmentEventSelect">
              <option value="">Choose an event...</option>
              ${events.map(function(event){
                return `<option value="${event.id}">${event.name||"Unnamed Event"} — ${event.date||"No date"}</option>`;
              }).join("")}
            </select>
          </div>
        </div>
      </div>
      <div id="assignmentWorkspace"></div>
    </section>
  `;

  const select=document.getElementById("assignmentEventSelect");

  select.addEventListener("change",function(){
    if(!select.value){
      document.getElementById("assignmentWorkspace").innerHTML="";
      return;
    }
    showAssignmentWorkspace(select.value);
  });
}

function showAssignmentWorkspace(eventId){
  const events=getEvents();
  const people=getPeople();
  const event=events.find(function(item){
    return String(item.id)===String(eventId);
  });

  if(!event){
    alert("Event not found.");
    return;
  }

  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  const assignments=getAssignments().filter(function(item){
    return String(item.eventId)===String(eventId);
  });

  const candidates=getAssignmentCandidates(eventId);
  const required=parseInt(event.headcount,10)||0;
  const assignedCount=assignments.length;
  const remaining=Math.max(0,required-assignedCount);

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Assign Crew</h2>
        <p>${event.name||"Unnamed Event"} — ${event.date||"No date"}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="secondary-button" id="backToAssignments">← Back to Assignments</button>
        <button type="button" class="secondary-button" id="viewAssignmentEvent">View Event</button>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <div>
          <h3>Event Requirements</h3>
          <p>Compare operational requirements with crew capabilities.</p>
        </div>
      </div>
      <div class="event-form">
        <div class="form-grid">
          <div class="form-group"><label>Event</label><input type="text" value="${event.name||"--"}" readonly></div>
          <div class="form-group"><label>Date</label><input type="text" value="${event.date||"--"}" readonly></div>
          <div class="form-group"><label>Location</label><input type="text" value="${event.location||"--"}" readonly></div>
          <div class="form-group"><label>Required Crew</label><input type="text" value="${required}" readonly></div>
          <div class="form-group"><label>Assigned</label><input type="text" value="${assignedCount}" readonly></div>
          <div class="form-group"><label>Remaining</label><input type="text" value="${remaining}" readonly></div>
          <div class="form-group full-width"><label>Required Skills</label><input type="text" value="${event.skills||"No specific skills entered"}" readonly></div>
          <div class="form-group"><label>Travel</label><input type="text" value="${event.travel?"Required":"Not Required"}" readonly></div>
          <div class="form-group"><label>Overnight</label><input type="text" value="${event.overnight?"Required":"Not Required"}" readonly></div>
          <div class="form-group"><label>Weekend</label><input type="text" value="${event.weekend?"Required":"Not Required"}" readonly></div>
        </div>
      </div>
    </section>
    <section class="dashboard-section">
      <div class="section-header">
        <div>
          <h3>Recommended Crew</h3>
          <p>${candidates.length} available candidate${candidates.length===1?"":"s"} ranked by CrewFlow matching.</p>
        </div>
      </div>
      <div id="assignmentCandidates"></div>
    </section>
    <section class="dashboard-section">
      <div class="section-header">
        <div>
          <h3>Currently Assigned</h3>
          <p>${assignedCount} crew member${assignedCount===1?"":"s"} assigned to this event.</p>
        </div>
      </div>
      <div id="assignmentCurrentCrew"></div>
    </section>
  `;

  document.getElementById("backToAssignments").addEventListener("click",showAssignmentsPage);
  document.getElementById("viewAssignmentEvent").addEventListener("click",function(){
    showEventDetails(eventId);
  });

  renderAssignmentCandidates(event,candidates,eventId);
  renderCurrentAssignments(event,assignments,people,eventId);
}

function renderAssignmentCandidates(event,candidates,eventId){
  const container=document.getElementById("assignmentCandidates");
  if(!container)return;

  if(candidates.length===0){
    container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3>No candidates available</h3>
        <p>There are no unassigned crew members available for this event.</p>
      </div>
    `;
    return;
  }

  container.innerHTML=`
    <div class="events-list">
      ${candidates.map(function(candidate,index){
        const person=candidate.person;
        const scoreClass=candidate.score>=80?"Excellent":candidate.score>=60?"Good":candidate.score>=40?"Possible":"Low Match";
        return `
          <div class="event-card">
            <div class="event-card-main">
              <div class="event-icon">${index===0?"🏆":"👤"}</div>
              <div>
                <h3>${person.name||"Unnamed Person"}</h3>
                <p>${person.role||"No role specified"}${person.specialization?" • "+person.specialization:""}</p>
              </div>
            </div>
            <div class="event-details">
              <span>🎯 <strong>${candidate.score}%</strong> ${scoreClass}</span>
              <span>👤 ${person.type==="freelancer"?"Freelancer":"Employee"}</span>
              <span>⭐ ${person.rating||"Not rated"}</span>
              <span>📊 ${candidate.assignmentCount} previous assignment${candidate.assignmentCount===1?"":"s"}</span>
              <span>🛠️ ${person.skills||"No skills listed"}</span>
            </div>
            <div style="padding:0 20px 18px;">
              <div style="margin-bottom:10px;">
                <strong>Why this person:</strong>
                <div style="margin-top:6px;color:var(--muted);line-height:1.7;">${candidate.reasons.join(" • ")||"General match"}</div>
              </div>
              ${candidate.warnings.length?`
                <div style="margin-bottom:12px;">
                  <strong>Attention:</strong>
                  <div style="margin-top:6px;color:#b45309;line-height:1.7;">${candidate.warnings.join(" • ")}</div>
                </div>
              `:""}
              <button type="button" class="primary-button assign-person-button" data-person-id="${person.id}">+ Assign ${person.name||"Person"}</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  container.querySelectorAll(".assign-person-button").forEach(function(button){
    button.addEventListener("click",function(){
      assignPersonToEvent(eventId,button.getAttribute("data-person-id"));
    });
  });
}

function renderCurrentAssignments(event,assignments,people,eventId){
  const container=document.getElementById("assignmentCurrentCrew");
  if(!container)return;

  if(assignments.length===0){
    container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No crew assigned yet</h3>
        <p>Choose a recommended candidate above.</p>
      </div>
    `;
    return;
  }

  container.innerHTML=`
    <div class="events-list">
      ${assignments.map(function(assignment){
        const person=people.find(function(item){
          return String(item.id)===String(assignment.personId);
        });

        if(!person)return "";

        return `
          <div class="event-card">
            <div class="event-card-main">
              <div class="event-icon">✅</div>
              <div>
                <h3>${person.name||"Unnamed Person"}</h3>
                <p>${person.role||"No role specified"}</p>
              </div>
            </div>
            <div class="event-details">
              <span>🎯 Match ${assignment.score||0}%</span>
              <span>👤 ${person.type==="freelancer"?"Freelancer":"Employee"}</span>
              <span>📍 ${person.location||"No location"}</span>
              <span>📅 ${formatAssignmentDate(assignment.assignedAt)}</span>
              <button type="button" class="secondary-button remove-assignment-button" data-assignment-id="${assignment.id}">Remove Assignment</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  container.querySelectorAll(".remove-assignment-button").forEach(function(button){
    button.addEventListener("click",function(){
      removeAssignment(button.getAttribute("data-assignment-id"),eventId);
    });
  });
}

function assignPersonToEvent(eventId,personId){
  const events=getEvents();
  const people=getPeople();
  const assignments=getAssignments();

  const event=events.find(function(item){
    return String(item.id)===String(eventId);
  });

  const person=people.find(function(item){
    return String(item.id)===String(personId);
  });

  if(!event||!person){
    alert("Event or person not found.");
    return;
  }

  const alreadyAssigned=assignments.some(function(item){
    return String(item.eventId)===String(eventId)&&String(item.personId)===String(personId);
  });

  if(alreadyAssigned){
    alert("This person is already assigned to this event.");
    return;
  }

  const required=parseInt(event.headcount,10)||0;
  const currentCount=assignments.filter(function(item){
    return String(item.eventId)===String(eventId);
  }).length;

  if(required>0&&currentCount>=required){
    alert("This event already has the required number of crew members.");
    return;
  }

  const match=calculateMatchScore(event,person);

  const assignment={
    id:Date.now(),
    eventId:event.id,
    personId:person.id,
    score:match.score,
    reasons:match.reasons,
    assignedAt:new Date().toISOString(),
    status:"assigned"
  };

  assignments.push(assignment);
  saveAssignments(assignments);

  const newCount=currentCount+1;

  const updatedEvents=events.map(function(item){
    if(String(item.id)!==String(eventId))return item;

    let newStatus=item.status;

    if(required>0&&newCount>=required){
      newStatus="assigned";
    }else if(newCount>0&&newStatus==="open"){
      newStatus="assigned";
    }

    return Object.assign({},item,{
      status:newStatus
    });
  });

  saveEvents(updatedEvents);

  alert(person.name+" assigned successfully.");
  showAssignmentWorkspace(eventId);
}

function removeAssignment(assignmentId,eventId){
  const assignments=getAssignments();

  if(!confirm("Remove this crew assignment?"))return;

  const remaining=assignments.filter(function(item){
    return String(item.id)!==String(assignmentId);
  });

  saveAssignments(remaining);

  const events=getEvents();
  const event=events.find(function(item){
    return String(item.id)===String(eventId);
  });

  if(event){
    const assignedCount=remaining.filter(function(item){
      return String(item.eventId)===String(eventId);
    }).length;

    const required=parseInt(event.headcount,10)||0;

    const updatedEvents=events.map(function(item){
      if(String(item.id)!==String(eventId))return item;

      let newStatus=item.status;

      if(assignedCount===0&&item.status==="assigned"){
        newStatus="open";
      }else if(required>0&&assignedCount<required&&item.status==="assigned"){
        newStatus="assigned";
      }

      return Object.assign({},item,{
        status:newStatus
      });
    });

    saveEvents(updatedEvents);
  }

  showAssignmentWorkspace(eventId);
}

function showEditEvent(eventId){
  const events=getEvents();
  const event=events.find(function(item){return String(item.id)===String(eventId);});
  if(!event){alert("Event not found.");return;}

  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Edit Event</h2>
        <p>Update the operational information for this event.</p>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <h3>${event.name||"Unnamed Event"}</h3>
        <p>Edit event information below.</p>
      </div>
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
        <div class="form-actions">
          <button type="button" class="secondary-button" id="cancelEditEvent">Cancel</button>
          <button type="submit" class="primary-button">Save Changes</button>
        </div>
      </form>
    </section>
  `;

  document.getElementById("editStatus").value=event.status||"draft";

  document.getElementById("cancelEditEvent").addEventListener("click",function(){
    showEventDetails(eventId);
  });

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

    saveEvents(events.map(function(item){
      return String(item.id)===String(eventId)?updatedEvent:item;
    }));

    alert("Event updated successfully.");
    showEventDetails(eventId);
  });
}

function showCreateEvent(){
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Create Event</h2>
        <p>Enter the operational information for the new event.</p>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <h3>Event Information</h3>
        <p>Basic details about the event and its operational requirements.</p>
      </div>
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
        <div class="form-actions">
          <button type="button" class="secondary-button" id="cancelCreateEvent">Cancel</button>
          <button type="submit" class="primary-button">Save Event</button>
        </div>
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

function showPeoplePage(){
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;
  const people=getPeople();

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>People</h2>
        <p>Manage employees, freelancers, skills and crew availability.</p>
      </div>
      <button type="button" class="primary-button" id="createPersonButton">+ Add Person</button>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <div>
          <h3>Crew Directory</h3>
          <p>${people.length} person${people.length===1?"":"s"} registered.</p>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <input id="peopleSearch" type="text" placeholder="Search people..." style="flex:1;min-width:220px;padding:14px 16px;border:1px solid var(--border);border-radius:10px;font-size:15px;">
        <select id="peopleTypeFilter" style="min-width:180px;padding:14px 16px;border:1px solid var(--border);border-radius:10px;font-size:15px;">
          <option value="all">All Types</option>
          <option value="employee">Employees</option>
          <option value="freelancer">Freelancers</option>
        </select>
      </div>
      <div id="peopleContainer"></div>
    </section>
  `;

  document.getElementById("createPersonButton").addEventListener("click",showCreatePerson);

  const search=document.getElementById("peopleSearch");
  const filter=document.getElementById("peopleTypeFilter");

  function renderPeople(){
    const searchValue=search.value.toLowerCase().trim();
    const typeValue=filter.value;

    const filtered=people.filter(function(person){
      const text=((person.name||"")+" "+(person.role||"")+" "+(person.specialization||"")+" "+(person.skills||"")+" "+(person.location||"")).toLowerCase();
      const matchesSearch=!searchValue||text.includes(searchValue);
      const matchesType=typeValue==="all"||(person.type||"employee")===typeValue;
      return matchesSearch&&matchesType;
    });

    const container=document.getElementById("peopleContainer");

    if(filtered.length===0){
      container.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No people found</h3>
          <p>Add your first employee or freelancer to CrewFlow.</p>
          <button type="button" class="primary-button" id="createPersonEmptyButton">+ Add Person</button>
        </div>
      `;
      document.getElementById("createPersonEmptyButton").addEventListener("click",showCreatePerson);
      return;
    }

    container.innerHTML=`
      <div class="events-list">
        ${filtered.map(function(person){
          const typeLabel=person.type==="freelancer"?"Freelancer":"Employee";
          return `
            <div class="event-card">
              <div class="event-card-main">
                <div class="event-icon">👤</div>
                <div>
                  <h3>${person.name||"Unnamed Person"}</h3>
                  <p>${person.role||"No role specified"}${person.specialization?" • "+person.specialization:""}</p>
                </div>
              </div>
              <div class="event-details">
                <span>👤 ${typeLabel}</span>
                <span>📍 ${person.location||"No location"}</span>
                <span>🛠️ ${person.skills||"No skills listed"}</span>
                <span>💰 ${person.rate||"0"} ${person.rateCurrency||"EGP"}</span>
                <span>⭐ ${person.rating||"Not rated"}</span>
                <button type="button" class="secondary-button person-view-button" data-person-id="${person.id}">View Details</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    container.querySelectorAll(".person-view-button").forEach(function(button){
      button.addEventListener("click",function(){
        showPersonDetails(button.getAttribute("data-person-id"));
      });
    });
  }

  search.addEventListener("input",renderPeople);
  filter.addEventListener("change",renderPeople);
  renderPeople();
}

function showPersonDetails(personId){
  const people=getPeople();
  const person=people.find(function(item){return String(item.id)===String(personId);});
  if(!person){alert("Person not found.");return;}

  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  const typeLabel=person.type==="freelancer"?"Freelancer":"Employee";

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Person Details</h2>
        <p>Complete crew profile and operational information.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="primary-button" id="editPersonButton">✏️ Edit Person</button>
        <button type="button" class="secondary-button" id="deletePersonButton">🗑️ Delete Person</button>
        <button type="button" class="secondary-button" id="backToPeople">← Back to People</button>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <h3>${person.name||"Unnamed Person"}</h3>
        <p>${person.role||"No role specified"}${person.specialization?" • "+person.specialization:""}</p>
      </div>
      <div class="event-form">
        <div class="form-grid">
          <div class="form-group"><label>Type</label><input type="text" value="${typeLabel}" readonly></div>
          <div class="form-group"><label>Name</label><input type="text" value="${person.name||"--"}" readonly></div>
          <div class="form-group"><label>Role / Job Title</label><input type="text" value="${person.role||"--"}" readonly></div>
          <div class="form-group"><label>Specialization</label><input type="text" value="${person.specialization||"--"}" readonly></div>
          <div class="form-group"><label>Location</label><input type="text" value="${person.location||"--"}" readonly></div>
          <div class="form-group"><label>Rate</label><input type="text" value="${person.rate||"0"} ${person.rateCurrency||"EGP"}" readonly></div>
          <div class="form-group"><label>Rating</label><input type="text" value="${person.rating||"Not rated"}" readonly></div>
          <div class="form-group"><label>Availability</label><input type="text" value="${person.availability||"Available"}" readonly></div>
          <div class="form-group full-width"><label>Skills</label><input type="text" value="${person.skills||"--"}" readonly></div>
          <div class="form-group"><label>Travel</label><input type="text" value="${person.travel?"Available":"Not Available"}" readonly></div>
          <div class="form-group"><label>Overnight</label><input type="text" value="${person.overnight?"Available":"Not Available"}" readonly></div>
          <div class="form-group"><label>Weekend</label><input type="text" value="${person.weekend?"Available":"Not Available"}" readonly></div>
          <div class="form-group"><label>Equipment</label><input type="text" value="${person.equipment||"--"}" readonly></div>
          <div class="form-group full-width"><label>Work History</label><textarea rows="5" readonly>${person.workHistory||"--"}</textarea></div>
          <div class="form-group full-width"><label>Notes</label><textarea rows="5" readonly>${person.notes||"--"}</textarea></div>
        </div>
      </div>
    </section>
  `;

  document.getElementById("editPersonButton").addEventListener("click",function(){
    showEditPerson(personId);
  });

  document.getElementById("deletePersonButton").addEventListener("click",function(){
    if(confirm("Are you sure you want to delete this person?")){
      const remaining=people.filter(function(item){return String(item.id)!==String(personId);});
      savePeople(remaining);
      saveAssignments(getAssignments().filter(function(item){
        return String(item.personId)!==String(personId);
      }));
      alert("Person deleted successfully.");
      showPeoplePage();
    }
  });

  document.getElementById("backToPeople").addEventListener("click",showPeoplePage);
}

function showCreatePerson(){
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Add Person</h2>
        <p>Create an employee or freelancer profile.</p>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <h3>Crew Profile</h3>
        <p>Enter the person's skills, availability and operational information.</p>
      </div>
      <form class="event-form" id="createPersonForm">
        <div class="form-grid">
          <div class="form-group"><label for="personName">Full Name</label><input type="text" id="personName" placeholder="Enter full name" required></div>
          <div class="form-group"><label for="personType">Type</label><select id="personType"><option value="employee">Employee</option><option value="freelancer">Freelancer</option></select></div>
          <div class="form-group"><label for="personRole">Role / Job Title</label><input type="text" id="personRole" placeholder="Camera Operator, Sound Engineer..."></div>
          <div class="form-group"><label for="personSpecialization">Specialization</label><input type="text" id="personSpecialization" placeholder="News, Studio, Live, Production..."></div>
          <div class="form-group"><label for="personLocation">Location</label><input type="text" id="personLocation" placeholder="Cairo, Giza..."></div>
          <div class="form-group"><label for="personRate">Rate</label><input type="number" id="personRate" min="0" placeholder="Daily / Job rate"></div>
          <div class="form-group"><label for="personCurrency">Currency</label><select id="personCurrency"><option value="EGP">EGP</option><option value="USD">USD</option><option value="SAR">SAR</option><option value="EUR">EUR</option></select></div>
          <div class="form-group"><label for="personRating">Rating</label><input type="number" id="personRating" min="0" max="5" step="0.1" placeholder="0 - 5"></div>
          <div class="form-group"><label for="personAvailability">Availability</label><select id="personAvailability"><option value="Available">Available</option><option value="Limited">Limited Availability</option><option value="Unavailable">Unavailable</option></select></div>
          <div class="form-group full-width"><label for="personSkills">Skills</label><input type="text" id="personSkills" placeholder="Camera, Sound, Lighting, Editing..."></div>
          <div class="form-group full-width"><label for="personEquipment">Equipment</label><input type="text" id="personEquipment" placeholder="Camera, Lens, Wireless Mic..."></div>
          <div class="form-group"><label><input type="checkbox" id="personTravel"> Travel Available</label></div>
          <div class="form-group"><label><input type="checkbox" id="personOvernight"> Overnight Available</label></div>
          <div class="form-group"><label><input type="checkbox" id="personWeekend"> Weekend Available</label></div>
          <div class="form-group full-width"><label for="personWorkHistory">Work History</label><textarea id="personWorkHistory" rows="5" placeholder="Previous work, clients, major assignments..."></textarea></div>
          <div class="form-group full-width"><label for="personNotes">Notes</label><textarea id="personNotes" rows="5" placeholder="Additional operational notes..."></textarea></div>
        </div>
        <div class="form-actions">
          <button type="button" class="secondary-button" id="cancelCreatePerson">Cancel</button>
          <button type="submit" class="primary-button">Save Person</button>
        </div>
      </form>
    </section>
  `;

  document.getElementById("cancelCreatePerson").addEventListener("click",showPeoplePage);

  document.getElementById("createPersonForm").addEventListener("submit",function(e){
    e.preventDefault();

    const person={
      id:Date.now(),
      name:document.getElementById("personName").value.trim(),
      type:document.getElementById("personType").value,
      role:document.getElementById("personRole").value.trim(),
      specialization:document.getElementById("personSpecialization").value.trim(),
      location:document.getElementById("personLocation").value.trim(),
      rate:document.getElementById("personRate").value,
      rateCurrency:document.getElementById("personCurrency").value,
      rating:document.getElementById("personRating").value,
      availability:document.getElementById("personAvailability").value,
      skills:document.getElementById("personSkills").value.trim(),
      equipment:document.getElementById("personEquipment").value.trim(),
      travel:document.getElementById("personTravel").checked,
      overnight:document.getElementById("personOvernight").checked,
      weekend:document.getElementById("personWeekend").checked,
      workHistory:document.getElementById("personWorkHistory").value.trim(),
      notes:document.getElementById("personNotes").value.trim(),
      createdAt:new Date().toISOString()
    };

    const people=getPeople();
    people.push(person);
    savePeople(people);
    alert("Person saved successfully.");
    showPeoplePage();
  });
}

function showEditPerson(personId){
  const people=getPeople();
  const person=people.find(function(item){return String(item.id)===String(personId);});
  if(!person){alert("Person not found.");return;}

  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>Edit Person</h2>
        <p>Update the crew member's profile and availability.</p>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="section-header">
        <h3>${person.name||"Unnamed Person"}</h3>
        <p>Edit crew information below.</p>
      </div>
      <form class="event-form" id="editPersonForm">
        <div class="form-grid">
          <div class="form-group"><label for="editPersonName">Full Name</label><input type="text" id="editPersonName" value="${person.name||""}" required></div>
          <div class="form-group"><label for="editPersonType">Type</label><select id="editPersonType"><option value="employee">Employee</option><option value="freelancer">Freelancer</option></select></div>
          <div class="form-group"><label for="editPersonRole">Role / Job Title</label><input type="text" id="editPersonRole" value="${person.role||""}"></div>
          <div class="form-group"><label for="editPersonSpecialization">Specialization</label><input type="text" id="editPersonSpecialization" value="${person.specialization||""}"></div>
          <div class="form-group"><label for="editPersonLocation">Location</label><input type="text" id="editPersonLocation" value="${person.location||""}"></div>
          <div class="form-group"><label for="editPersonRate">Rate</label><input type="number" id="editPersonRate" min="0" value="${person.rate||""}"></div>
          <div class="form-group"><label for="editPersonCurrency">Currency</label><select id="editPersonCurrency"><option value="EGP">EGP</option><option value="USD">USD</option><option value="SAR">SAR</option><option value="EUR">EUR</option></select></div>
          <div class="form-group"><label for="editPersonRating">Rating</label><input type="number" id="editPersonRating" min="0" max="5" step="0.1" value="${person.rating||""}"></div>
          <div class="form-group"><label for="editPersonAvailability">Availability</label><select id="editPersonAvailability"><option value="Available">Available</option><option value="Limited">Limited Availability</option><option value="Unavailable">Unavailable</option></select></div>
          <div class="form-group full-width"><label for="editPersonSkills">Skills</label><input type="text" id="editPersonSkills" value="${person.skills||""}"></div>
          <div class="form-group full-width"><label for="editPersonEquipment">Equipment</label><input type="text" id="editPersonEquipment" value="${person.equipment||""}"></div>
          <div class="form-group"><label><input type="checkbox" id="editPersonTravel" ${person.travel?"checked":""}> Travel Available</label></div>
          <div class="form-group"><label><input type="checkbox" id="editPersonOvernight" ${person.overnight?"checked":""}> Overnight Available</label></div>
          <div class="form-group"><label><input type="checkbox" id="editPersonWeekend" ${person.weekend?"checked":""}> Weekend Available</label></div>
          <div class="form-group full-width"><label for="editPersonWorkHistory">Work History</label><textarea id="editPersonWorkHistory" rows="5">${person.workHistory||""}</textarea></div>
          <div class="form-group full-width"><label for="editPersonNotes">Notes</label><textarea id="editPersonNotes" rows="5">${person.notes||""}</textarea></div>
        </div>
        <div class="form-actions">
          <button type="button" class="secondary-button" id="cancelEditPerson">Cancel</button>
          <button type="submit" class="primary-button">Save Changes</button>
        </div>
      </form>
    </section>
  `;

  document.getElementById("editPersonType").value=person.type||"employee";
  document.getElementById("editPersonCurrency").value=person.rateCurrency||"EGP";
  document.getElementById("editPersonAvailability").value=person.availability||"Available";

  document.getElementById("cancelEditPerson").addEventListener("click",function(){
    showPersonDetails(personId);
  });

  document.getElementById("editPersonForm").addEventListener("submit",function(e){
    e.preventDefault();

    const updatedPerson={
      id:person.id,
      name:document.getElementById("editPersonName").value.trim(),
      type:document.getElementById("editPersonType").value,
      role:document.getElementById("editPersonRole").value.trim(),
      specialization:document.getElementById("editPersonSpecialization").value.trim(),
      location:document.getElementById("editPersonLocation").value.trim(),
      rate:document.getElementById("editPersonRate").value,
      rateCurrency:document.getElementById("editPersonCurrency").value,
      rating:document.getElementById("editPersonRating").value,
      availability:document.getElementById("editPersonAvailability").value,
      skills:document.getElementById("editPersonSkills").value.trim(),
      equipment:document.getElementById("editPersonEquipment").value.trim(),
      travel:document.getElementById("editPersonTravel").checked,
      overnight:document.getElementById("editPersonOvernight").checked,
      weekend:document.getElementById("editPersonWeekend").checked,
      workHistory:document.getElementById("editPersonWorkHistory").value.trim(),
      notes:document.getElementById("editPersonNotes").value.trim(),
      createdAt:person.createdAt||new Date().toISOString()
    };

    savePeople(people.map(function(item){
      return String(item.id)===String(personId)?updatedPerson:item;
    }));

    alert("Person updated successfully.");
    showPersonDetails(personId);
  });
}

function showComingSoon(section){
  const dashboard=document.querySelector(".dashboard");
  if(!dashboard)return;

  dashboard.innerHTML=`
    <div class="page-header">
      <div>
        <h2>${section}</h2>
        <p>CrewFlow ${section} management.</p>
      </div>
    </div>
    <section class="dashboard-section">
      <div class="empty-state">
        <div class="empty-icon">🚀</div>
        <h3>${section} Module</h3>
        <p>This module is ready for the next development stage.</p>
      </div>
    </section>
  `;
}
