
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const SECTIONS = [
  "home", "classes", "schedule", "planner", "tour",
  "coaches", "gallery", "plans", "contact"
];

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let currentSection = "";

const CLASSES = [
  { name: "Barbell 101", description: "Learn the big lifts with a coach on every rack.", category: "Strength", intensity: 2, minutes: 50 },
  { name: "Heavy Hour", description: "Squat, press and pull in a structured heavy block.", category: "Strength", intensity: 5, minutes: 60 },
  { name: "Engine", description: "Intervals on rowers, bikes and sleds.", category: "Conditioning", intensity: 4, minutes: 45 },
  { name: "Mobility Flow", description: "Move with control and improve your mobility.", category: "Recovery", intensity: 1, minutes: 30 },
  { name: "Olympic Lifting", description: "Technique-focused weightlifting in small groups.", category: "Strength", intensity: 4, minutes: 75 },
  { name: "Kettlebell Fast", description: "Swings, carries and full-body training.", category: "Conditioning", intensity: 3, minutes: 40 }
];

const COACHES = [
  ["Mara Voss", "MV", "Strength & powerlifting", "Technique, confidence and thoughtful strength coaching."],
  ["Dante Kole", "DK", "Olympic lifting", "Weightlifting technique and small group coaching."],
  ["Iris Han", "IH", "Mobility & recovery", "Movement, flexibility and comfortable training progress."],
  ["Theo Brandt", "TB", "Conditioning", "Group sessions and endurance training."]
];

const PLANS = [
  {
    name: "Floor",
    price: 39,
    features: ["Open gym access", "Showers & lockers", "Intro session"]
  },
  {
    name: "Club",
    price: 69,
    features: ["Everything in Floor", "Unlimited classes", "Recovery room", "Guest visit monthly"]
  },
  {
    name: "Lab",
    price: 119,
    features: ["Everything in Club", "2 coaching sessions monthly", "Custom programme", "Progress check-ins"]
  }
];

const STORAGE_BOOKINGS = "tensile-demo-bookings-v3";
const STORAGE_WEEK = "tensile-demo-week-v3";
const STORAGE_BILLING = "tensile-demo-billing-v3";

function loadStored(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function animateNumber(element, start, end, duration = 550) {
  if (reduceMotion) {
    element.textContent = end.toLocaleString("en-US");
    return;
  }

  const startTime = performance.now();

  function frame(now) {
    const step = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - step, 3);

    element.textContent = Math.round(
      start + (end - start) * eased
    ).toLocaleString("en-US");

    if (step < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

const animationObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("in");
        animationObserver.unobserve(entry.target);

        $$("[data-n]", entry.target).forEach(el => {
          animateNumber(el, 0, Number(el.dataset.n), 1400);
        });
      });
    }, { rootMargin: "40px" })
  : null;

function observeAnimations(root = document) {
  const elements = $$(".fi", root);

  if (reduceMotion || !animationObserver) {
    elements.forEach(element => element.classList.add("in"));
    return;
  }

  elements.forEach(element => animationObserver.observe(element));
}

$$(".hh.sp").forEach(heading => {
  heading.style.background = "none";
  heading.style.color = "#e6e6ea";
  heading.style.webkitTextFillColor = "#e6e6ea";
  heading.classList.add("in");
});

function showSection() {
  let target = location.hash.slice(1);
  if (!SECTIONS.includes(target)) target = "home";
  if (target === currentSection) return;

  const previous = currentSection;
  const scene = window.GL;

  function switchSection() {
    currentSection = target;

    $$(".v").forEach(section => {
      section.classList.toggle("on", section.id === target);
    });

    $$(".nl a").forEach(link => {
      const active = link.hash === `#${target}`;
      link.classList.toggle("on", active);

      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    window.scrollTo(0, 0);

    const navActive = $(".nl a.on");
    if (navActive) {
      navActive.scrollIntoView({
        inline: "nearest",
        block: "nearest"
      });
    }

    if (target === "schedule") renderSchedule();
    if (target === "planner") renderPlanner();

    const page = document.getElementById(target);

    $$(".sp", page).forEach(element => {
      element.classList.add("in");
      element.style.background = "none";
      element.style.color = "#e6e6ea";
      element.style.webkitTextFillColor = "#e6e6ea";
    });

    $$(".fi", page).forEach(element => {
      if (reduceMotion || !animationObserver) {
        element.classList.add("in");
      } else if (!element.classList.contains("in")) {
        animationObserver.observe(element);
      }
    });

    if (scene?.ok) {
      scene.on = target === "home";
      if (target === "home") scene.fly(0);
    }
  }

  if (previous === "home" && scene?.ok && target !== "home") {
    scene.fly(1, switchSection);
  } else {
    switchSection();
  }
}

window.addEventListener("hashchange", showSection);

$("#cl").innerHTML = CLASSES.map((item, i) => `
  <article class="cd tl fi" data-k="${item.category}" style="--d:${i * .07}s">
    <h3>${item.name}</h3>
    <p>${item.description}</p>
    <div class="mt">
      <i>${item.minutes} min</i>
      <i>${item.category}</i>
    </div>
    <div class="bars">
      ${[1, 2, 3, 4, 5].map(n =>
        `<u class="${n <= item.intensity ? "f" : ""}"></u>`
      ).join("")}
    </div>
    <small>Intensity ${item.intensity} / 5</small>
    <a class="pill gh" href="#schedule">See schedule ↗</a>
  </article>
`).join("");

$("#fl").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  $$("#fl button").forEach(b => {
    const active = b === button;
    b.classList.toggle("on", active);
    b.setAttribute("aria-pressed", String(active));
  });

  $$("#cl .cd").forEach(card => {
    card.classList.toggle(
      "off",
      !!button.dataset.f && card.dataset.k !== button.dataset.f
    );
  });
});

$("#co").innerHTML = COACHES.map((coach, i) => `
  <article class="cd tl fi" style="--d:${i * .08}s">
    <div class="av">${coach[1]}</div>
    <h3>${coach[0]}</h3>
    <small>${coach[2]}</small>
    <p style="margin-top:12px">${coach[3]}</p>
    <a class="pill gh" href="#contact">Ask about coaching ↗</a>
  </article>
`).join("");

let yearly = !!loadStored(STORAGE_BILLING, false);

const COMPARE_FEATURES = [
  ["Open gym access", [true, true, true]],
  ["Showers and lockers", [true, true, true]],
  ["Intro session", [true, true, true]],
  ["Unlimited group classes", [false, true, true]],
  ["Recovery room access", [false, true, true]],
  ["Guest visit each month", [false, true, true]],
  ["Personal coaching sessions", [false, false, true]],
  ["Individual training plan", [false, false, true]]
];

$("#comparisonBody").innerHTML = COMPARE_FEATURES.map(([label, values]) => `
  <tr>
    <th scope="row">${label}</th>
    ${values.map(value => `
      <td>
        <span class="comparison-icon ${value ? "yes" : "no"}"
              aria-label="${value ? "Included" : "Not included"}">
          ${value ? "✓" : "—"}
        </span>
      </td>
    `).join("")}
  </tr>
`).join("");

$("#pn").innerHTML = PLANS.map((plan, i) => `
  <div class="pl fi ${i === 1 ? "hot" : ""}" style="--d:${i * .1}s">
    <div class="pi">
      <h3>${plan.name}${i === 1 ? " · most popular" : ""}</h3>
      <div class="num">
        $<span data-price="${plan.price}">${plan.price}</span>
        <small>/ mo</small>
      </div>
      <small class="billing-caption" data-bill-caption>Monthly billing</small>
      <ul>
        ${plan.features.map(text => `<li>${text}</li>`).join("")}
      </ul>
      <button class="pill ${i === 1 ? "" : "gh"}"
              type="button" data-select-plan="${plan.name}">
        Enquire about ${plan.name} ↗
      </button>
    </div>
  </div>
`).join("");

function renderBilling() {
  $$("#tg button").forEach(button => {
    const active = Number(button.dataset.y) === Number(yearly);
    button.classList.toggle("on", active);
    button.setAttribute("aria-pressed", String(active));
  });

  $$("[data-price]").forEach((node, index) => {
    const next = Math.round(PLANS[index].price * (yearly ? .8 : 1));
    const previous = Number(node.textContent.replaceAll(",", "")) || next;
    animateNumber(node, previous, next, 450);
  });

  $$("[data-bill-caption]").forEach(node => {
    node.textContent = yearly
      ? "Billed yearly · 20% off"
      : "Monthly billing";
  });
}

$("#tg").addEventListener("click", event => {
  const button = event.target.closest("button[data-y]");
  if (!button) return;

  yearly = button.dataset.y === "1";
  saveStored(STORAGE_BILLING, yearly);
  renderBilling();
});

$("#pn").addEventListener("click", event => {
  const button = event.target.closest("[data-select-plan]");
  if (!button) return;

  $("#requestPlan").value = button.dataset.selectPlan;
  location.hash = "contact";

  $("#formStatus").textContent =
    `Interested in ${button.dataset.selectPlan}? Complete the form to enquire.`;
});

renderBilling();

function localDate(offset = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(date, options = {}) {
  return date.toLocaleDateString("en-GB", options);
}

const upcomingDays = Array.from({ length: 7 }, (_, i) => localDate(i));
const validDateKeys = new Set(upcomingDays.map(dateKey));

let selectedDate = dateKey(upcomingDays[0]);
let scheduleCategory = "All";
let bookings = new Set(loadStored(STORAGE_BOOKINGS, []));
let week = loadStored(STORAGE_WEEK, []);

if (!Array.isArray(week)) week = [];

week = week.filter(item =>
  item &&
  validDateKeys.has(item.date) &&
  CLASSES.some(c => c.name === item.name)
);

function getSessions(dayString) {
  const date = new Date(`${dayString}T12:00:00`);
  const weekend = [0, 6].includes(date.getDay());

  const times = weekend
    ? ["08:00", "10:00", "12:15"]
    : ["06:30", "08:00", "12:15", "17:30", "19:00"];

  return times.map((time, index) => {
    const classIndex = (date.getDay() * 2 + index) % CLASSES.length;
    const classInfo = CLASSES[classIndex];

    const capacity = 12;
    const takenExample = 3 + ((date.getDate() + index * 3) % 6);
    const id = `${dayString}_${index}`;

    return {
      id,
      date: dayString,
      time,
      info: classInfo,
      coach: COACHES[(date.getDay() + index) % COACHES.length][0],
      capacity,
      spots: capacity - takenExample - (bookings.has(id) ? 1 : 0)
    };
  });
}

$("#dy").innerHTML = upcomingDays.map(date => `
  <button type="button" data-date="${dateKey(date)}">
    <span>${dateLabel(date, { weekday: "short" })}</span>
    <strong>${date.getDate()}</strong>
  </button>
`).join("");

function findSession(id) {
  return getSessions(selectedDate).find(s => s.id === id);
}

function renderSchedule() {
  $$("#dy button").forEach(button => {
    const active = button.dataset.date === selectedDate;
    button.classList.toggle("on", active);
    button.setAttribute("aria-pressed", String(active));
  });

  $$("#sf button").forEach(button => {
    const active = button.dataset.kind === scheduleCategory;
    button.classList.toggle("on", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const sessions = getSessions(selectedDate).filter(session =>
    scheduleCategory === "All" ||
    session.info.category === scheduleCategory
  );

  const d = new Date(`${selectedDate}T12:00:00`);

  $("#scheduleCaption").textContent =
    `${dateLabel(d, { weekday: "long", day: "numeric", month: "long" })} · ${sessions.length} demo sessions`;

  $("#ss").innerHTML = sessions.length
    ? sessions.map((session, i) => `
      <article class="sr" style="--i:${i}">
        <time datetime="${session.time}">${session.time}</time>
        <div class="session-main">
          <h3>${session.info.name}</h3>
          <small>
            ${session.coach} · ${session.info.minutes} min ·
            ${session.info.category} · ${session.spots} demo spots left
          </small>
          <div class="sb">
            <u style="width:${session.spots / session.capacity * 100}%"></u>
          </div>
        </div>
        <div class="session-actions">
          <button class="pill gh" type="button"
                  data-detail="${session.id}">Details</button>
          <button class="pill" type="button"
                  data-book="${session.id}">
            ${bookings.has(session.id) ? "Reserved ✓" : "Reserve"}
          </button>
          <button class="mini-action" type="button"
                  data-plan-session="${session.id}">+ My week</button>
        </div>
      </article>
    `).join("")
    : '<p class="empty-state">No sessions in this category on this day.</p>';
}

$("#dy").addEventListener("click", event => {
  const button = event.target.closest("button[data-date]");
  if (!button) return;

  selectedDate = button.dataset.date;
  renderSchedule();
});

$("#sf").addEventListener("click", event => {
  const button = event.target.closest("button[data-kind]");
  if (!button) return;

  scheduleCategory = button.dataset.kind;
  renderSchedule();
});

function toggleReservation(session) {
  if (!session) return;

  if (bookings.has(session.id)) {
    bookings.delete(session.id);
  } else if (session.spots > 0) {
    bookings.add(session.id);
  }

  saveStored(STORAGE_BOOKINGS, [...bookings]);
  renderSchedule();
}

const dialog = $("#sessionDialog");

function openSessionDetails(session) {
  if (!session) return;

  $("#sessionDialogContent").innerHTML = `
    <p class="eyebrow">CLASS DETAILS</p>
    <h2>${session.info.name}</h2>
    <p>${session.info.description}</p>
    <div class="session-facts">
      <span>${dateLabel(new Date(`${session.date}T12:00:00`), {
        weekday: "long", day: "numeric", month: "short"
      })}</span>
      <span>${session.time}</span>
      <span>${session.info.minutes} minutes</span>
      <span>${session.coach}</span>
      <span>${session.info.category}</span>
      <span>Intensity ${session.info.intensity}/5</span>
    </div>
    <p class="demo-note">
      Example class only. Reserving here does not contact a gym.
    </p>
    <div class="action-row">
      <button class="pill" type="button" data-dialog-book="${session.id}">
        ${bookings.has(session.id)
          ? "Cancel demo reservation"
          : "Reserve demo spot"}
      </button>
      <button class="pill gh" type="button"
              data-dialog-plan="${session.id}">
        Add to my week +
      </button>
    </div>
  `;

  dialog.showModal();
}

$("#closeSessionDialog").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

function addToWeek(date, time, name) {
  if (week.some(item =>
    item.date === date &&
    item.time === time &&
    item.name === name
  )) return false;

  week.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date, time, name
  });

  saveStored(STORAGE_WEEK, week);
  renderPlanner();
  return true;
}

$("#ss").addEventListener("click", event => {
  const detail = event.target.closest("[data-detail]");
  const reserve = event.target.closest("[data-book]");
  const plan = event.target.closest("[data-plan-session]");

  if (detail) openSessionDetails(findSession(detail.dataset.detail));

  if (reserve) toggleReservation(findSession(reserve.dataset.book));

  if (plan) {
    const session = findSession(plan.dataset.planSession);
    if (!session) return;

    const added = addToWeek(
      session.date,
      session.time,
      session.info.name
    );

    plan.textContent = added ? "Added ✓" : "Already added ✓";
  }
});

dialog.addEventListener("click", event => {
  const reserve = event.target.closest("[data-dialog-book]");
  const plan = event.target.closest("[data-dialog-plan]");

  if (reserve) {
    toggleReservation(findSession(reserve.dataset.dialogBook));
    dialog.close();
  }

  if (plan) {
    const session = findSession(plan.dataset.dialogPlan);

    if (session) {
      addToWeek(session.date, session.time, session.info.name);
    }

    dialog.close();
    location.hash = "planner";
  }
});

$("#plannerDay").innerHTML = upcomingDays.map(date => `
  <option value="${dateKey(date)}">
    ${dateLabel(date, {
      weekday: "long",
      day: "numeric",
      month: "short"
    })}
  </option>
`).join("");

$("#plannerClass").innerHTML = CLASSES.map(item => `
  <option value="${item.name}">${item.name} · ${item.category}</option>
`).join("");

$("#plannerTime").innerHTML = [
  "06:30", "08:00", "10:00",
  "12:15", "15:00", "17:30", "19:00"
].map(time => `<option value="${time}">${time}</option>`).join("");

$("#plannerForm").addEventListener("submit", event => {
  event.preventDefault();

  const date = $("#plannerDay").value;
  const time = $("#plannerTime").value;
  const name = $("#plannerClass").value;

  if (!validDateKeys.has(date)) return;

  const added = addToWeek(date, time, name);

  $("#plannerSummary").textContent = added
    ? `${name} added to your week.`
    : "This class is already in your plan.";
});

function renderPlanner() {
  const count = week.length;
  const minutes = week.reduce(
    (sum, item) =>
      sum + (CLASSES.find(c => c.name === item.name)?.minutes || 0),
    0
  );

  $("#plannerSummary").textContent =
    `${count} planned ${count === 1 ? "session" : "sessions"} · ${minutes} total minutes · Saved on this device`;

  $("#weekGrid").innerHTML = upcomingDays.map(date => {
    const day = dateKey(date);

    const entries = week
      .filter(item => item.date === day)
      .sort((a, b) => a.time.localeCompare(b.time));

    return `
      <article class="week-day">
        <div class="week-date">
          <span>${dateLabel(date, { weekday: "short" })}</span>
          <strong>${date.getDate()}</strong>
        </div>
        ${entries.length
          ? entries.map(item => `
            <div class="week-entry">
              <time>${item.time}</time>
              <strong>${item.name}</strong>
              <button type="button" data-remove-week="${item.id}"
                      aria-label="Remove ${item.name}">×</button>
            </div>
          `).join("")
          : '<p class="week-empty">Rest / free day</p>'}
      </article>
    `;
  }).join("");
}

$("#weekGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-remove-week]");
  if (!button) return;

  week = week.filter(item => item.id !== button.dataset.removeWeek);
  saveStored(STORAGE_WEEK, week);
  renderPlanner();
});

$("#clearWeek").addEventListener("click", () => {
  if (!week.length) return;
  if (!confirm("Clear your entire demo training week?")) return;

  week = [];
  saveStored(STORAGE_WEEK, week);
  renderPlanner();
});

function calendarDate(date, time) {
  const d = new Date(`${date}T${time}:00`);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

$("#exportWeek").addEventListener("click", () => {
  if (!week.length) {
    $("#plannerSummary").textContent =
      "Add some sessions before exporting your calendar.";
    return;
  }

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TENSILE//DEMO WEEK//EN",
    "CALSCALE:GREGORIAN"
  ];

  week.forEach(item => {
    const minutes =
      CLASSES.find(c => c.name === item.name)?.minutes || 60;

    const endDate = new Date(`${item.date}T${item.time}:00`);
    endDate.setMinutes(endDate.getMinutes() + minutes);

    const end = endDate.toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@tensile-demo`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${calendarDate(item.date, item.time)}`,
      `DTEND:${end}`,
      `SUMMARY:TENSILE Demo - ${item.name}`,
      "DESCRIPTION:Personal demo training plan. Not a gym booking.",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob(
    [lines.join("\r\n") + "\r\n"],
    { type: "text/calendar;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "tensile-my-week.ics";

  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderPlanner();
renderSchedule();

const TOUR_ROOMS = [
  {
    title: "Strength floor",
    tag: "01 / 04",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1500&q=85",
    text: "A dedicated space for learning and practising the big lifts with guidance from coaches.",
    highlights: [
      "Free-weight stations",
      "Squat racks and platforms",
      "Coached lifting areas"
    ],
    points: [
      {
        x: 26, y: 57,
        label: "Free weights",
        detail: "A flexible free-weight area for controlled strength training and learning the foundational movements.",
        href: "#classes",
        action: "Explore classes"
      },
      {
        x: 67, y: 49,
        label: "Coaching zone",
        detail: "A dedicated area for first-time introductions, technique sessions and coach-guided progress.",
        href: "#coaches",
        action: "Meet the coaches"
      }
    ]
  },
  {
    title: "Conditioning zone",
    tag: "02 / 04",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1500&q=85",
    text: "A flexible space for movement, team sessions and conditioning workouts.",
    highlights: [
      "Group training",
      "Flexible exercise space",
      "Coach-led sessions"
    ],
    points: [
      {
        x: 37, y: 45,
        label: "Group floor",
        detail: "Small-group workouts with coached intervals and a welcoming team atmosphere.",
        href: "#schedule",
        action: "View schedule"
      },
      {
        x: 76, y: 65,
        label: "Training stations",
        detail: "Flexible stations for circuit sessions combining cardio and strength movements.",
        href: "#classes",
        action: "View classes"
      }
    ]
  },
  {
    title: "Recovery lounge",
    tag: "03 / 04",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1500&q=85",
    text: "A calmer corner of the club concept to unwind between sessions.",
    highlights: [
      "Quiet atmosphere",
      "Stretching area",
      "Recovery-focused spaces"
    ],
    points: [
      {
        x: 26, y: 66,
        label: "Stretching",
        detail: "A calm space for mobility classes, gentle movement and stretching after training.",
        href: "#classes",
        action: "Explore recovery classes"
      },
      {
        x: 70, y: 39,
        label: "Relax zone",
        detail: "A quieter part of our concept club for winding down and taking a moment between sessions.",
        href: "#contact",
        action: "Ask about the space"
      }
    ]
  },
  {
    title: "Training studio",
    tag: "04 / 04",
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1500&q=85",
    text: "A bright, adaptable area for introductory sessions and small groups.",
    highlights: [
      "Small classes",
      "Flexible layout",
      "First-visit introductions"
    ],
    points: [
      {
        x: 34, y: 50,
        label: "Studio space",
        detail: "An adaptable studio for beginners, small groups and technique-focused lessons.",
        href: "#schedule",
        action: "See available classes"
      },
      {
        x: 72, y: 72,
        label: "Training corner",
        detail: "An area for warm-ups, individual guidance and selected one-to-one exercises.",
        href: "#coaches",
        action: "Meet our coaches"
      }
    ]
  }
];

let currentRoom = 0;
let activeHotspot = -1;

const tourPopup = document.createElement("div");

tourPopup.id = "tourHotspotPopup";
tourPopup.setAttribute("aria-live", "polite");
tourPopup.hidden = true;

tourPopup.style.cssText = `
  position:absolute;
  z-index:4;
  right:20px;
  bottom:95px;
  width:min(330px, calc(100% - 40px));
  padding:20px;
  background:rgba(9,10,15,.95);
  border:1px solid rgba(185,171,255,.45);
  border-radius:16px;
  box-shadow:0 22px 70px rgba(0,0,0,.65);
  backdrop-filter:blur(14px);
  color:#e6e6ea;
`;

$("#tourVisual").append(tourPopup);

$("#tourTabs").innerHTML = TOUR_ROOMS.map((room, i) => `
  <button type="button" data-tour="${i}">
    ${String(i + 1).padStart(2, "0")} · ${room.title} ↗
  </button>
`).join("");

function showTourRoom(index) {
  currentRoom = (index + TOUR_ROOMS.length) % TOUR_ROOMS.length;

  const room = TOUR_ROOMS[currentRoom];
  const img = $("#tourImage");

  activeHotspot = -1;
  tourPopup.hidden = true;
  tourPopup.replaceChildren();

  img.style.opacity = "0";
  img.alt = `Illustrative photo for ${room.title}`;
  img.onload = () => { img.style.opacity = "1"; };
  img.onerror = () => { img.style.opacity = "0"; };
  img.src = room.image;

  if (img.complete && img.naturalWidth > 0) {
    img.style.opacity = "1";
  }

  $("#tourImageTitle").textContent = room.title;
  $("#tourTitle").textContent = room.title;
  $("#tourNumber").textContent = room.tag;
  $("#tourText").textContent = room.text;

  $("#tourPoints").innerHTML = room.highlights
    .map(text => `<span>✓ ${text}</span>`)
    .join("");

  $("#tourHotspots").innerHTML = room.points.map((point, i) => `
    <button
      type="button"
      class="tour-hotspot"
      style="left:${point.x}%;top:${point.y}%"
      data-hotspot="${i}"
      aria-label="${point.label} details"
      aria-pressed="false"
    >
      <span>+</span>
      <em>${point.label}</em>
    </button>
  `).join("");

  $$("#tourTabs button").forEach(button => {
    const active = Number(button.dataset.tour) === currentRoom;
    button.classList.toggle("on", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function selectHotspot(index) {
  const point = TOUR_ROOMS[currentRoom].points[index];

  if (!point || activeHotspot === index) {
    activeHotspot = -1;
    tourPopup.hidden = true;
    tourPopup.replaceChildren();

    $("#tourPoints").innerHTML = TOUR_ROOMS[currentRoom].highlights
      .map(text => `<span>✓ ${text}</span>`)
      .join("");
  } else {
    activeHotspot = index;

    tourPopup.innerHTML = `
      <button type="button" class="tour-popup-close"
        aria-label="Close hotspot details"
        style="position:absolute;right:10px;top:8px;width:32px;height:32px;
        background:#ffffff18;color:white;border:0;border-radius:50%;
        font-size:22px;cursor:pointer">×</button>

      <span style="display:block;color:#36d67e;font-size:10px;
        letter-spacing:.14em;font-weight:600;margin-bottom:10px">
        DISCOVER THIS SPACE
      </span>

      <strong style="display:block;font-size:20px;margin-bottom:9px">
        ${point.label}
      </strong>

      <p style="color:rgba(255,255,255,.7);font-size:13px;line-height:1.6">
        ${point.detail}
      </p>

      <a href="${point.href}"
         style="display:inline-block;color:#36d67e;margin-top:14px;
         font-size:13px;font-weight:600">
        ${point.action} ↗
      </a>
    `;

    tourPopup.hidden = false;

    $("#tourPoints").innerHTML = `
      <strong style="color:#e6e6ea;font-size:16px">${point.label}</strong>
      <p style="color:rgba(255,255,255,.65);font-size:13px;line-height:1.6">
        ${point.detail}
      </p>
      <a href="${point.href}" style="color:#36d67e;font-size:13px;font-weight:600">
        ${point.action} ↗
      </a>
    `;
  }

  $$("#tourHotspots .tour-hotspot").forEach((button, i) => {
    const selected = i === activeHotspot;

    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.querySelector("span").textContent = selected ? "−" : "+";
  });
}

$("#tourTabs").addEventListener("click", event => {
  const button = event.target.closest("button[data-tour]");
  if (button) showTourRoom(Number(button.dataset.tour));
});

$("#tourHotspots").addEventListener("click", event => {
  const button = event.target.closest("[data-hotspot]");
  if (button) selectHotspot(Number(button.dataset.hotspot));
});

tourPopup.addEventListener("click", event => {
  if (event.target.closest(".tour-popup-close")) {
    selectHotspot(activeHotspot);
  }
});

showTourRoom(0);

const ADDRESS = "YOURCOMPANYNAME — demo gym";

$("#ad").textContent = ADDRESS;
$("#mt").textContent = "YOURCOMPANYNAME";

$$("[data-m]").forEach(link => {
  const query = encodeURIComponent(ADDRESS);

  link.href = link.dataset.m === "s"
    ? `https://www.google.com/maps/search/?api=1&query=${query}`
    : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
});

(function updateHours() {
  const date = new Date();
  const time = date.getHours() + date.getMinutes() / 60;

  const weekend = [0, 6].includes(date.getDay());
  const opening = weekend ? 7 : 5;
  const closing = weekend ? 21 : 23;
  const open = time >= opening && time < closing;

  const el = $("#op");

  el.style.setProperty(
    "--c",
    open ? "#36d67e" : "#e0605a"
  );

  el.textContent = open
    ? `Example hours · open until ${closing}:00`
    : `Example hours · ${String(opening).padStart(2, "0")}:00–${closing}:00`;
})();

$("#f").addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const status = $("#formStatus");
  const button = $("#submitRequest");

  if (
    ["localhost", "127.0.0.1", ""].includes(location.hostname) ||
    location.protocol === "file:"
  ) {
    status.className = "status-warning";
    status.textContent =
      "Preview mode: deploy to Netlify and enable Forms to receive real requests. No message was sent.";
    return;
  }

  button.disabled = true;
  status.className = "";
  status.textContent = "Submitting your request…";

  try {
    const body = new URLSearchParams(new FormData(form));

    const response = await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    status.className = "status-success";
    status.textContent =
      "Request submitted to the website form endpoint. Please confirm it appears in Netlify Forms.";

    form.reset();
  } catch {
    status.className = "status-warning";
    status.textContent =
      "Your request could not be sent. Please try again after the Netlify form is configured.";
  } finally {
    button.disabled = false;
  }
});

const GALLERY_TILES = [
  ["Squat racks", "repeating-linear-gradient(90deg,#26262e 0 6px,transparent 6px 46px),radial-gradient(circle at 30% 70%,#b9abff,transparent 55%)", "pan"],
  ["Plate wall", "repeating-radial-gradient(circle at 50% 50%,#b9abff 0 5px,#141418 5px 16px)", "spin"],
  ["Sled lane", "repeating-linear-gradient(100deg,#36d67e 0 3px,transparent 3px 34px),linear-gradient(#0d1a14,#0b0b0e)", "pan"],
  ["Rower row", "repeating-linear-gradient(0deg,#1f1f27 0 10px,#2d2d38 10px 11px),radial-gradient(circle,#7d6bff,transparent 60%)", "pls"],
  ["Chalk bar", "radial-gradient(circle at 20% 30%,#fff3,transparent 40%),radial-gradient(circle at 70% 60%,#b9abff55,transparent 45%),#101014", "spin"],
  ["Mobility zone", "conic-gradient(from 0deg,#36d67e55,#b9abff55,#36d67e55)", "spin"],
  ["Turf strip", "repeating-linear-gradient(45deg,#0f2a1c 0 12px,#12331f 12px 24px)", "pan"],
  ["Lockers", "repeating-linear-gradient(90deg,#1c1c24 0 30px,#101016 30px 33px),linear-gradient(#b9abff22,transparent)", "pls"],
  ["Recovery room", "radial-gradient(circle at 50% 120%,#ff8a5c,transparent 60%),radial-gradient(circle at 50% -20%,#7d6bff,transparent 60%),#0c0c10", "pls"]
];

$("#gl2").innerHTML = GALLERY_TILES.map((item, i) => `
  <button class="gt fi" data-gallery="${i}"
    style="--bg:${item[1]};--an:${item[2]};
    --d:${i * .06}s;--du:${10 + i * 1.5}s">
    <span>${item[0]}</span>
  </button>
`).join("");

let galleryIndex = 0;
const viewer = $("#lb");

function openGallery(index) {
  galleryIndex =
    (index + GALLERY_TILES.length) % GALLERY_TILES.length;

  const tile = GALLERY_TILES[galleryIndex];

  viewer.innerHTML = `
    <div class="gt"
         style="--bg:${tile[1]};--an:${tile[2]};--du:10s">
      <span>${tile[0]}</span>
    </div>
    <button class="lbb" style="top:16px;right:16px"
            data-action="close" aria-label="Close">✕</button>
    <button class="lbb" style="left:12px;top:50%"
            data-action="prev" aria-label="Previous">‹</button>
    <button class="lbb" style="right:12px;top:50%"
            data-action="next" aria-label="Next">›</button>
  `;

  viewer.classList.add("on");
  viewer.querySelector('[data-action="close"]').focus();
}

$("#gl2").addEventListener("click", event => {
  const button = event.target.closest("[data-gallery]");
  if (button) openGallery(Number(button.dataset.gallery));
});

viewer.addEventListener("click", event => {
  if (
    event.target === viewer ||
    event.target.dataset.action === "close"
  ) {
    viewer.classList.remove("on");
  }

  if (event.target.dataset.action === "prev") {
    openGallery(galleryIndex - 1);
  }

  if (event.target.dataset.action === "next") {
    openGallery(galleryIndex + 1);
  }
});

window.addEventListener("keydown", event => {
  if (!viewer.classList.contains("on")) return;

  if (event.key === "Escape") viewer.classList.remove("on");
  if (event.key === "ArrowLeft") openGallery(galleryIndex - 1);
  if (event.key === "ArrowRight") openGallery(galleryIndex + 1);
});

window.addEventListener("scroll", () => {
  $("#pb").style.scale =
    `${scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)} 1`;
}, { passive: true });

window.addEventListener("pointermove", event => {
  const root = document.documentElement.style;

  root.setProperty("--mx", `${event.clientX}px`);
  root.setProperty("--my", `${event.clientY}px`);

  const magnetic = event.target.closest?.(".pill");

  if (magnetic && event.pointerType === "mouse") {
    const rect = magnetic.getBoundingClientRect();

    magnetic.style.setProperty(
      "--tx",
      `${(event.clientX - rect.left - rect.width / 2) * .18}px`
    );

    magnetic.style.setProperty(
      "--ty",
      `${(event.clientY - rect.top - rect.height / 2) * .3}px`
    );
  }

  const card = event.target.closest?.(".tl");

  if (card && event.pointerType === "mouse") {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    card.style.setProperty("--rx", `${(.5 - y) * 8}deg`);
    card.style.setProperty("--ry", `${(x - .5) * 10}deg`);
    card.style.setProperty("--sx", `${x * 100}%`);
    card.style.setProperty("--sy", `${y * 100}%`);
  }
});

document.addEventListener("pointerout", event => {
  const magnetic = event.target.closest?.(".pill");

  if (magnetic) {
    magnetic.style.setProperty("--tx", "0px");
    magnetic.style.setProperty("--ty", "0px");
  }

  const card = event.target.closest?.(".tl");

  if (card) {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  }
});

observeAnimations();
showSection();
