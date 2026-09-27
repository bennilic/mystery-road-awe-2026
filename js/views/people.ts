// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS VIEW
// ---------------------------------------------------------------------
import { state } from "../state.ts";
import { evidenceMentionsPerson } from "../lookup.ts";
import { navigateTo } from "../navigation.ts";
import { renderEvidenceList } from "./evidence.ts";
import { el } from "../dom.ts";
import type { Person } from "../types.ts";

// Reached only through the inline onclick="switchPeopleTab(...)" buttons in
// index.html — exported purely for main.js's window wiring, no module calls
// it directly.
export function switchPeopleTab(tab: "people" | "locations"): void {
  state.currentPeopleTab = tab;
  const peoplePanel = el<HTMLElement>("peoplePanel")!;
  const locationsPanel = el<HTMLElement>("locationsPanel")!;
  const peopleTabBtn = el<HTMLElement>("tabPeopleBtn")!;
  const locationsTabBtn = el<HTMLElement>("tabLocationsBtn")!;

  if (tab === "people") {
    peoplePanel.classList.remove("hidden");
    locationsPanel.classList.add("hidden");
    peopleTabBtn.classList.add("active");
    locationsTabBtn.classList.remove("active");
  } else {
    peoplePanel.classList.add("hidden");
    locationsPanel.classList.remove("hidden");
    peopleTabBtn.classList.remove("active");
    locationsTabBtn.classList.add("active");
  }
}

// Only called from renderPeople in this same file — private.
function countEvidenceForPerson(person: Person): number {
  let count = 0;
  for (const item of state.allEvidence) {
    if (evidenceMentionsPerson(item, person)) count++;
  }
  return count;
}

// Called from navigation.js's handleHashChange — needs to be exported.
export function renderPeople(): void {
  const container = el<HTMLElement>("peoplePanel")!;
  let html = "";
  for (const person of state.allPeople) {
    const count = countEvidenceForPerson(person);

    html += '<div class="person-card">';
    html += '<div class="person-card-header">';
    html +=
      '<img class="person-avatar" src="' +
      person.avatar +
      '" alt="Portrait of ' +
      person.name +
      '">';
    html +=
      "<div><h3>" + person.name + '</h3><div class="person-role">' + person.role + "</div></div>";
    html += "</div>";
    html += "<p><strong>Speciality:</strong> " + person.speciality + "</p>";
    html += "<ul>";
    for (const responsibility of person.responsibilities) {
      html += "<li>" + responsibility + "</li>";
    }
    html += "</ul>";
    html += '<div class="person-statement">&ldquo;' + person.statement + "&rdquo;</div>";
    html += "<p>" + count + " related evidence item" + (count === 1 ? "" : "s") + " &mdash; ";
    html +=
      '<button type="button" class="evidence-count-link" data-person-id="' +
      person.id +
      '">view</button></p>';
    html += "</div>";
  }
  container.innerHTML = html;

  const links = container.querySelectorAll<HTMLButtonElement>(".evidence-count-link");
  for (const link of links) {
    link.addEventListener("click", function (e) {
      const personId = (e.target as HTMLElement).getAttribute("data-person-id")!;
      el<HTMLSelectElement>("filterPerson")!.value = personId;
      navigateTo("evidence");
      setTimeout(function () {
        renderEvidenceList();
      }, 0);
    });
  }
}

// Called from navigation.js's handleHashChange — needs to be exported.
export function renderLocations(): void {
  const container = el<HTMLElement>("locationsPanel")!;
  let html = "";
  for (const loc of state.allLocations) {
    html += '<div class="location-card">';
    html += "<h3>" + loc.id + " &mdash; " + loc.name + "</h3>";
    html += "<p>" + loc.description + "</p>";
    html += "<p><strong>Contains:</strong></p><ul>";
    for (const item of loc.contains) {
      html += "<li>" + item + "</li>";
    }
    html += "</ul></div>";
  }
  container.innerHTML = html;
}
