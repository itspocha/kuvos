(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── buyers first, served users second ── */
  var BUYERS = [
    { k: "Hospitals", primary: 1, kind: "Primary commercial customer",
      h: "For hospitals and health systems",
      p: "Extend discharge, rehabilitation, palliative, and home-care plans into the home. Keep the authorised plan visible across the patient's smartphone and Smart TV, show one next step, provide permissioned Care Circle support, and surface configured status signals to the responsible team.",
      rows: [["i-hospital", "Care-transition execution layer", "Not a readmission-prevention guarantee"],
             ["i-tv", "Phone + Smart TV reach", "No new dedicated hardware for the core experience"],
             ["i-pulse", "Measurable handoff", "Discharge-to-activation and first-action completion"]] },
    { k: "Insurers", primary: 1, kind: "Primary commercial customer",
      h: "For insurers and risk-bearing care organisations",
      p: "Support defined high-need cohorts and understand activation, completion, exception, and follow-up signals. Fragmented care can lead to duplicated work, missed follow-up, medication confusion, avoidable escalation, and poor member experience.",
      rows: [["i-umbrella", "Bounded member support", "Care Circle reduces uncertainty without exposing clinical detail"],
             ["i-doc", "Shared operational view", "Source-linked protocol and authorisation history"],
             ["i-pulse", "Cohort-level evidence", "Compared with a defined baseline or control"]] },
    { k: "Healthcare-data buyers", primary: 1, kind: "Primary commercial customer",
      h: "For healthcare-data and pharmaceutical research buyers",
      p: "Access only consented, governed, aggregated or pseudonymized datasets for approved purposes. Any research or analytics use requires explicit authorization, purpose limitation, data minimization, governance review, and withdrawal mechanisms.",
      rows: [["i-lock", "Consent-scoped by default", "Governed by patient or administrator consent, not by who paid"],
             ["i-receipt", "Confirmation-event data", "A receipt proves an event was recorded — not an outcome"],
             ["i-shield", "No identifiable data sold", "Minimum necessary disclosure, withdrawable"]] },
    { k: "Care teams", primary: 0, kind: "Served user",
      h: "For care teams",
      p: "Turn complex source documents into a reviewable, human-authorized Cross-Screen Adherence Protocol. Keep a traceable history of what was approved, what changed, and what needs attention.",
      rows: [["i-doc", "Source-linked items", "Each field traces to a page or region"],
             ["i-eye", "Uncertainty surfaced", "Conflicts shown, never silently guessed"],
             ["i-lock", "Locked Draft State", "Owner and timestamp on every authorised version"]] },
    { k: "Patients", primary: 0, kind: "Served user",
      h: "For neurodivergent and sensory-impaired patients",
      p: "See one current action instead of navigating a complicated routine. Use large, readable, multimodal cues across smartphone and TV, including visual guidance for people who cannot reliably hear alerts or operate precise touch controls.",
      rows: [["i-tv", "One visible next action", "Low cognitive load, predictable sequencing"],
             ["i-caption", "Multimodal cues", "Captions, contrast, audio, haptics"],
             ["i-tick", "One large confirmation", "Phone, TV remote, or watch"]] },
    { k: "Families", primary: 0, kind: "Served user",
      h: "For relatives of expatriates",
      p: "Stay connected across distance without constant calls or intrusive monitoring. Authorized Care Circle members see the right status at the right time, including completion or configured exception notifications.",
      rows: [["i-people", "Bounded visibility", "Status, not clinical interpretation"],
             ["i-lock", "Permission-based", "The patient controls who sees what"],
             ["i-pulse", "Exception-only alerts", "Quiet unless a check-in helps"]] }
  ];

  var PATH = [
    ["Plan arrives", "Source document", "A prescription or care plan enters the system"],
    ["Draft prepared", "Review view", "The system structures the plan and highlights uncertainty"],
    ["Human authorizes", "Locked Draft State", "An authenticated reviewer approves the actionable version"],
    ["One action now", "Phone + TV", "The patient sees the current task with clear cues"],
    ["Done", "Confirmation", "Completion is recorded and the next step becomes visible"],
    ["Status exception", "Configured response", "The product follows the approved notification and escalation policy"],
    ["Stay connected", "Care Circle", "Authorized family or care-team members see the right level of status"]
  ];

  var INSURER = [
    ["Member loses the plan after leaving a facility",
     "Phone + Smart TV keeps one authorised next action visible at home.",
     "Discharge-to-activation and first-action completion."],
    ["High-risk member needs bounded support",
     "Care Circle and configured status signals reduce uncertainty without exposing unnecessary clinical detail.",
     "Notification usefulness, consent, burden, and escalation appropriateness."],
    ["Multiple providers create fragmented instructions",
     "Source-linked protocol and authorisation history preserve a shared operational view.",
     "Reviewer corrections, conflicts, handoff quality, and workflow time."],
    ["Payer needs measurable care-management evidence",
     "Pilot dashboard reports engagement, completion, follow-up, exceptions, and accessibility signals.",
     "Cohort-level outcomes compared with a defined baseline or control."]
  ];

  var METRICS = ["Discharge-to-activation conversion", "Time to first understandable action",
    "Completion confirmation", "Missed-action handling", "Phone + TV vs smartwatch incremental value",
    "Provider workload", "Authorization turnaround", "Consent coverage", "Notification burden",
    "Receipt integrity", "Willingness to renew or sponsor"];

  var PROOF = [
    ["Can a patient understand the next step quickly?", "Time to first understandable action"],
    ["Does the Smart TV network improve reach?", "Phone-only versus phone + TV activation and completion"],
    ["Can a reviewer safely authorize the plan?", "Correction rate, reviewer minutes, and turnaround time"],
    ["Does Care Circle reduce uncertainty?", "Opt-in, response quality, mute rate, and caregiver confidence"],
    ["Will an organization pay?", "Paid pilot, renewal condition, and expansion intent"],
    ["Does the product remain accessible?", "Completion success across hearing, vision, mobility, cognitive, and neurodivergent needs"]
  ];

  var FAQ = [
    ["Does Kuvos replace a doctor?",
     "No. Kuvos is a care-plan execution and coordination layer. A clinician or authorized caregiver must review and authorize the actionable protocol."],
    ["What exactly does a confirmation receipt prove?",
     "That a configured confirmation event was recorded — with protocol version, event type, timestamp, device or session signal, and consent scope. It does not prove that a medicine was taken, that an instruction was followed perfectly, or that a clinical outcome occurred."],
    ["Does the patient need to use a phone?",
     "No. The experience is designed to work across phone and Smart TV, with remote-control and large-control paths where supported."],
    ["How is Kuvos introduced commercially?",
     "Through provider sponsorship, per-member licensing, or a family subscription. Providers, insurers, home-care agencies, palliative organisations and assisted-living operators can sponsor access for an eligible cohort."],
    ["Can family members living abroad use it?",
     "Yes. Authorized relatives can receive configured status updates and exception notifications without needing to manage the patient's entire clinical record."],
    ["What happens if the internet goes down?",
     "Previously authorized protocol information can continue within defined offline limits, with synchronization when connectivity returns. New or changed instructions require the appropriate authorization and integrity checks."],
    ["Is Kuvos a medication reminder app?",
     "It is broader than a reminder app. Kuvos structures complex care plans, creates a human-authorized protocol, delivers cross-screen cues, records completion, and coordinates the right level of family or care-team visibility."]
  ];

  /* ── build: buyers ── */
  var tabs = $("#buyerTabs"), panel = $("#buyerPanel");
  tabs.innerHTML = BUYERS.map(function (b, i) {
    return '<button class="tab' + (i ? "" : " on") + (b.primary ? "" : " sec") +
      '" role="tab" id="btab' + i + '" aria-controls="buyerPanel" aria-selected="' +
      (i ? "false" : "true") + '" tabindex="' + (i ? "-1" : "0") +
      '" data-i="' + i + '">' + b.k + "</button>";
  }).join("");
  function paintBuyer(i) {
    var b = BUYERS[i];
    panel.innerHTML = '<div class="swap"><span class="kind' + (b.primary ? "" : " s") + '">' + b.kind +
      "</span><h3>" + b.h + "</h3><p>" + b.p + "</p></div>" +
      '<div class="bvis swap">' + b.rows.map(function (r) {
        return '<div class="brow"><i><svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><use href="#' + r[0] +
          '"/></svg></i><div>' + r[1] + "<span>" + r[2] + "</span></div></div>";
      }).join("") + "</div>";
  }
  function selectBuyer(i, focus) {
    $$(".tab", tabs).forEach(function (t, k) {
      var on = k === i;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panel.setAttribute("aria-labelledby", "btab" + i);
    paintBuyer(i);
  }
  selectBuyer(0);
  tabs.addEventListener("click", function (e) {
    var b = e.target.closest(".tab"); if (!b) return;
    selectBuyer(+b.dataset.i);
  });
  tabs.addEventListener("keydown", function (e) {
    var cur = $$(".tab", tabs).indexOf(e.target.closest(".tab"));
    if (cur < 0) return;
    var n = BUYERS.length, to = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (cur + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (cur - 1 + n) % n;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    if (to < 0) return;
    e.preventDefault(); selectBuyer(to, true);
  });

  /* ── build: tables and lists ── */
  $("#pathBody").innerHTML = PATH.map(function (r) {
    return "<tr><td>" + r[0] + '</td><td><span class="chipx">' + r[1] + '</span></td><td><span class="m">' + r[2] + "</span></td></tr>";
  }).join("");

  $("#insurerBody").innerHTML = INSURER.map(function (r) {
    return "<tr><td>" + r[0] + '</td><td><span class="m">' + r[1] + '</span></td><td><span class="chipx">' + r[2] + "</span></td></tr>";
  }).join("");

  $("#pilotMetrics").innerHTML = METRICS.map(function (m) { return "<span>" + m + "</span>"; }).join("");

  $("#proof").innerHTML = PROOF.map(function (r) {
    return '<div class="proof-row rv"><b>' + r[0] +
      '</b><span><svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><use href="#i-pulse"/></svg>' + r[1] + "</span></div>";
  }).join("");

  $("#faq").innerHTML = FAQ.map(function (f, k) {
    return '<div class="q"><h3><button class="q-btn" aria-expanded="false" aria-controls="a' + k + '">' + f[0] +
      '<svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><use href="#i-chev"/></svg></button></h3>' +
      '<div class="q-body" id="a' + k + '"><div><p>' + f[1] + "</p></div></div></div>";
  }).join("");
  $("#faq").addEventListener("click", function (e) {
    var b = e.target.closest(".q-btn"); if (!b) return;
    var q = b.closest(".q"), open = q.classList.toggle("open");
    b.setAttribute("aria-expanded", open);
  });

  /* ── announcement ── */
  var items = $$(".ann-item"), ai = 0, t = null, playing = !still;
  var PLAY_ICON = '<svg width="13" height="13" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M5 3.6 14 9l-9 5.4V3.6Z" fill="currentColor"/></svg>';
  var PAUSE_ICON = '<svg width="13" height="13" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><rect x="5" y="3.5" width="2.6" height="11" rx="1.1" fill="currentColor"/><rect x="10.4" y="3.5" width="2.6" height="11" rx="1.1" fill="currentColor"/></svg>';
  function go() { items[ai].classList.remove("on"); ai = (ai + 1) % items.length; items[ai].classList.add("on"); }
  function start() { clearInterval(t); t = setInterval(go, 5200); }
  if (playing) start();
  else {
    $("#annPlay").innerHTML = PLAY_ICON;
    $("#annPlay").setAttribute("aria-label", "Play announcements");
  }
  $("#annPlay").addEventListener("click", function () {
    playing = !playing;
    this.setAttribute("aria-label", playing ? "Pause announcements" : "Play announcements");
    this.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
    if (playing) start(); else { clearInterval(t); t = null; }
  });

  /* ── drawer ── */
  var drawer = $("#drawer"), scrim = $("#scrim"), burger = $("#burger");
  var opened = false;
  function focusables() {
    return $$("a[href], button", drawer).filter(function (el) { return !el.disabled; });
  }
  function close() {
    if (!opened) return;
    opened = false;
    drawer.classList.remove("on"); scrim.classList.remove("on");
    drawer.setAttribute("aria-hidden", "true"); drawer.setAttribute("inert", "");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("lock");
    burger.focus();
  }
  burger.addEventListener("click", function () {
    opened = true;
    drawer.classList.add("on"); scrim.classList.add("on");
    drawer.setAttribute("aria-hidden", "false"); drawer.removeAttribute("inert");
    this.setAttribute("aria-expanded", "true");
    document.body.classList.add("lock");
    // the drawer is visibility:hidden until .on lands, and .focus() does not
    // flush style — so move focus on the next frame, once it is focusable
    requestAnimationFrame(function () {
      var f = focusables(); if (f.length) f[0].focus();
    });
  });
  drawer.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  scrim.addEventListener("click", close);
  document.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  /* ── marquee ── */
  var row = $("#mqRow"); row.innerHTML += row.innerHTML;

  /* ── header, progress, active nav ── */
  var hdr = $("#hdr"), bar = $("#scrollbar"), ticking = false;
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle("stuck", y > 8);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    var best = "";
    $$("main section[id]").forEach(function (s) { if (s.getBoundingClientRect().top <= 160) best = s.id; });
    $$("#nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + best); });
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ── counters ── */
  function count(el) {
    var to = parseFloat(el.dataset.count), t0 = null;
    if (still) { el.textContent = to.toFixed(1); return; }
    requestAnimationFrame(function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 1600, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (to * e).toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    });
  }

  /* ── scroll-fired sequences (long, staggered, Whoop-smooth) ── */
  function fire(el) {
    if (el.id === "rhythm") {
      $$(".fill", el).forEach(function (f, k) {
        setTimeout(function () { f.style.height = f.dataset.h + "%"; }, 150 * k);
      });
    }
    if (el.id === "flow") {
      $$(".node", el).forEach(function (n, k) {
        setTimeout(function () { n.classList.add("lit"); }, still ? 0 : 320 * k);
      });
    }
    if (el.id === "revCard") {
      $$("[data-f]", el).forEach(function (f, k) {
        setTimeout(function () { f.classList.add("in"); }, still ? 0 : 200 + 320 * k);
      });
    }
    if (el.id === "circleCard") {
      $$("[data-msg]", el).forEach(function (m, k) {
        setTimeout(function () { m.classList.add("in"); }, still ? 0 : 360 + 620 * k);
      });
    }
    $$("[data-count]", el).forEach(count);
  }
  var watch = $$(".rv").concat([$("#rhythm"), $("#circleCard"), $("#flow"), $("#revCard")]).filter(Boolean);
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in"); fire(e.target); io.unobserve(e.target);
      });
    }, { threshold: .14, rootMargin: "0px 0px -60px" });
    watch.forEach(function (el) { io.observe(el); });
  } else {
    watch.forEach(function (el) { el.classList.add("in"); fire(el); });
  }

  /* ── hero phone ring ── */
  var arc = $("#phoneArc"), C = 113, target = C - C * 0.8;
  if (still) arc.style.strokeDashoffset = target;
  else setTimeout(function () {
    arc.style.transition = "stroke-dashoffset 1.8s cubic-bezier(.22,1,.36,1)";
    arc.style.strokeDashoffset = target;
  }, 800);
})();
