const wasteTypeHtml = (x) =>
  x.type == "Collection" && x.wasteType
    ? `<div class="waste-type"><strong>Waste type: ${E(x.wasteType)}</strong></div>`
    : "";
const dayReadiness = (x) => {
  if (x.type == "No collection")
    return { status: "Off", key: "none", gaps: [] };
  const missingTimes = x.zones.some((zone) => {
    const { start, end } = zoneTimes(zone);
    return !start || !end || timeMinutes(end) <= timeMinutes(start);
  });
  const crew = x.crew.map((name) => name.trim()).filter(Boolean),
    gaps = [];
  if (!x.zones.length) gaps.push("No puroks");
  if (!x.drv.trim()) gaps.push("No driver");
  if (x.zones.length && missingTimes) gaps.push("Times not set");
  if (!crew.length) gaps.push("No crew");
  return {
    status: gaps.length ? "Needs setup" : "Ready",
    key: gaps.length ? "setup" : "ready",
    gaps,
  };
};
const dayZoneSummary = (zones) => {
  if (!zones.length) return "No purok selected";
  const first = zones[0],
    firstMatch = first.label.match(/^(Purok|Zone)\s+(\d+)$/i),
    lastMatch = zones[zones.length - 1].label.match(/\d+$/),
    lastNumber = lastMatch ? Number(lastMatch[0]) : NaN,
    firstNumber = firstMatch ? Number(firstMatch[2]) : NaN,
    step = lastNumber >= firstNumber ? 1 : -1,
    isRange =
      zones.length > 1 &&
      firstMatch &&
      zones.every((zone, index) => {
        const match = zone.label.match(/^(Purok|Zone)\s+(\d+)$/i);
        return (
          match &&
          match[1].toLowerCase() == firstMatch[1].toLowerCase() &&
          Number(match[2]) == firstNumber + step * index
        );
      });
  return isRange
    ? `${first.label} to ${zones[zones.length - 1].label}`
    : zones.map((zone) => zone.label).join(", ");
};
const officialScheduleDayCard = (x, i) => {
  const readiness = dayReadiness(x),
    gaps = readiness.gaps,
    missingStaff = [
      gaps.includes("No driver") && "driver",
      gaps.includes("No crew") && "crew",
    ].filter(Boolean),
    warnings =
      x.type == "No collection"
        ? ""
        : [
            !x.zones.length && "No puroks selected",
            x.zones.length && gaps.includes("Times not set") && "Purok times not set",
            missingStaff.length == 2
              ? "No driver or crew assigned yet"
              : missingStaff.length
                ? `No ${missingStaff[0]} assigned yet`
                : "",
          ]
            .filter(Boolean)
            .join(" · "),
    zoneSummary =
      x.type == "No collection" ? "—" : dayZoneSummary(x.zones),
    wasteSummary = `Waste type: ${x.wasteType.trim() || "Not set"}`,
    details =
      x.type == "No collection"
        ? "—"
        : `${zoneSummary} · ${wasteSummary}`;
  return `<button type="button" class="schedule-day-card ${x.type == "No collection" ? "schedule-day-card--none" : ""}" aria-label="${D[i]}: ${E(x.type == "No collection" ? "No collection" : `${details}${warnings ? `, ${warnings}` : ""}`)}. Edit schedule" onclick="openScheduleDay(${i})"><span class="schedule-day-content"><strong>${D[i]}</strong><span class="schedule-day-details">${E(zoneSummary)}</span>${x.type == "Collection" ? `<span class="schedule-day-details">${E(wasteSummary)}</span>` : ""}${warnings ? `<span class="schedule-day-warning">${E(warnings)}</span>` : ""}</span><span class="pill ${x.type == "No collection" ? "x" : ""}">${x.type}</span></button>`;
};
const dayScheduleCard = (x, i) =>
  `<div class="card row resident-schedule-day ${x.type == "No collection" ? "resident-schedule-day--none" : "resident-schedule-day--collection"}"><div><b>${D[i]}</b><div class="mut">${x.type == "No collection" ? "—" : x.zones.length ? x.zones.map((zone) => { const { start, end } = zoneTimes(zone); return `${E(zone.label)}${start && end ? ` · ${timeWindow(start, end)}` : ""}`; }).join("<br>") : "No purok or zone selected"}</div>${wasteTypeHtml(x)}${x.delay ? `<div style="color:var(--amb);font-size:12px">Delayed: ${E(x.delay)}</div>` : ""}</div><span class="pill ${pc(x.type)}">${x.type}</span></div>`;
const scheduleDayEditor = (x, i) => {
  const customWasteType = WASTE_TYPE_PRESETS.includes(x.wasteType)
      ? ""
      : x.wasteType,
    controls =
      x.type == "Collection"
        ? `<section class="editor-section">
            <h2>Waste type</h2>
            <div class="seg waste-segments">${WASTE_TYPE_PRESETS.map((type) => `<button type="button" class="${x.wasteType == type ? "on" : ""}" aria-pressed="${x.wasteType == type}" onclick="setWasteType(${i},'${type}')">${type}</button>`).join("")}</div>
            <label for="waste-${i}">Other waste type</label>
            <input id="waste-${i}" aria-label="Other waste type" value="${E(customWasteType)}" placeholder="Or enter your chosen waste type" oninput="S.dayDraft.wasteType=this.value;markDayDirty()">
          </section>
          <section class="editor-section">
            <h2>Purok times</h2>
            <p class="mut">Set start and end times separately for each purok.</p>
            <label for="add-zone-${i}">Puroks to collect</label>
            <select id="add-zone-${i}" aria-label="Add a purok or zone for ${D[i]}" onchange="addScheduleZone(${i},this.value)">
              <option value="">Add a purok or zone</option>
              ${PUROK_OPTIONS[S.off].map((label) => `<option value="${E(label)}" ${x.zones.some((zone) => zone.label == label) ? "disabled" : ""}>${E(label)}</option>`).join("")}
            </select>
            ${x.zones.length ? `<div class="zone-editor-list">${x.zones.map((zone, j) => {
              const times = zoneTimes(zone);
              return `<div class="zone-editor-row">
                <div class="zone-editor-title"><b>${E(zone.label)}</b></div>
                <label for="zone-start-${i}-${j}">Start</label>
                <input id="zone-start-${i}-${j}" type="time" aria-label="${E(zone.label)} start time" value="${E(times.start)}" oninput="setZoneTime(${j},'start',this.value)">
                <label for="zone-end-${i}-${j}">End</label>
                <input id="zone-end-${i}-${j}" type="time" aria-label="${E(zone.label)} end time" value="${E(times.end)}" oninput="setZoneTime(${j},'end',this.value)">
                <button type="button" class="rm" aria-label="Remove ${E(zone.label)}" onclick="removeScheduleZone(${i},${j})">✕</button>
              </div>`;
            }).join("")}</div>` : '<p class="mut">No puroks added yet.</p>'}
            ${er("s" + i)}
          </section>
          ${asg(x, i)}`
        : "";
  return `<div class="day-editor-page">
    <header class="day-editor-header">
      <div class="day-editor-header-actions">
        <button type="button" class="day-back" onclick="leaveScheduleDay()">‹ Week overview</button>
      </div>
      <h1>Edit ${D[i]}</h1>
      <p>Update and save this day only.</p>
    </header>
    <div class="day-editor-body">
      <section class="editor-section collection-toggle">
        <div><b>Collection this day</b><div class="mut">Turn off to mark ${D[i]} as a no-collection day.</div></div>
        <label class="switch"><input type="checkbox" aria-label="Collection this day" ${x.type == "Collection" ? "checked" : ""} onchange="setCollectionStatus(${i},this.checked)"><span></span></label>
      </section>
      ${controls}
    </div>
    <footer class="day-editor-footer">
      <button id="save-day" class="btn" onclick="saveScheduleDay(${i})" ${S.dayDirty ? "" : "disabled"}>Save ${D[i]}</button>
      <button type="button" class="btn alt" onclick="leaveScheduleDay()">Cancel</button>
    </footer>
  </div>`;
};
const V = {
  welcome: () =>
    `<div class="hero w"><h1>Kolekta<span class="em">🗑️</span></h1><p class="mut">Garbage collection schedule, citizen reports and drainage monitoring</p><h2>Welcome!</h2><p class="mut">Who is using the app today?</p><button class="btn" onclick="go('setup')">I am a Resident</button><button class="btn" onclick="go('login')">I am a Barangay Official</button></div>`,
  setup: () =>
    `<button class="back" onclick="go('welcome')">BACK</button>${head("Let’s get you set up", "Tell us who you are")}<div class="body"><label for=n>Your name</label><input id=n placeholder="Enter your name" value="${E(S.name)}" oninput="S.name=this.value">${er("name")}<label for=b>Your barangay</label><select id=b onchange="S.brgy=this.value"><option value="">Select barangay</option>${B.map((b) => `<option ${b == S.brgy ? "selected" : ""} value="${b}">Barangay ${b}</option>`).join("")}</select>${er("brgy")}<button class="btn" onclick="cont()">Continue</button></div>`,
  home: () => {
    const s = S.sched[S.brgy],
      a = S.ann.filter((x) => x.b == S.brgy)[0];
    return shell(
      RN,
      `<button class="back" onclick="go('setup')">BACK</button>` +
        head(`Hello, ${E(S.name)}!`, `Barangay ${S.brgy}`) +
        `<div class="body">${s
          .map((x, i) => ({ ...x, day: D[i] }))
          .filter((x) => x.delay)
          .map(
            (x) =>
              `<div class="banner"><b>Delay notice, ${x.day || ""}</b> ${E(x.delay)}</div>`,
          )
          .join(
            "",
          )}<h2>Weekly collection schedule <span class="em" style="font-size:1.6em">🗑️</span></h2>${s.every((x) => x.type == "No collection") ? '<p class="mut">No schedule is available yet.</p>' : s.map(dayScheduleCard).join("")}${a ? `<div class="banner"><b>Latest announcement</b><br>${E(a.title)}</div>` : ""}</div>`,
    );
  },
  news: () => {
    const it = [
      ...S.ann.filter((x) => x.b == S.brgy),
      ...S.rep
        .filter((r) => r.b == S.brgy && r.status != "Submitted")
        .map((r) => ({
          k: "Report",
          title: `Report ${r.ref}: ${r.status}`,
          msg:
            r.status == "Rejected"
              ? `Reason: ${r.reason}`
              : `Action: ${r.action}`,
          date: r.upd,
          ts: r.ts,
        })),
    ].sort((a, b) => b.ts - a.ts);
    const c = S.chkRes;
    return shell(
      RN,
      head("Announcements", `Barangay ${S.brgy}`) +
        `<div class="body"><div class="card"><label for=rf>Check a report status</label><input id=rf placeholder="e.g. KOL-2026-001" value="${E(S.chk)}" oninput="S.chk=this.value"><button class="btn" style="margin-top:0" onclick="chk()">Check status</button>${c === "none" ? '<div class="err" style="margin:8px 0 0">Reference number not found. Check it and try again.</div>' : c ? `<p style="margin:10px 0 0"><span class="pill ${c.status == "Rejected" ? "bad" : c.status == "Resolved" ? "" : "n"}">${c.status}</span> <b>${E(c.type)}</b><br><span class="mut">Updated ${c.upd}${c.action ? `. Action: ${E(c.action)}` : ""}${c.reason ? `. Reason: ${E(c.reason)}` : ""}</span></p>` : ""}</div>${it.length ? it.map((x) => `<div class="card"><div class="row"><span class="pill ${x.k == "Urgent" ? "bad" : x.k == "Notice" ? "n" : x.k == "Report" ? "r" : ""}">${x.k}</span><span class="mut">${x.date}</span></div><b>${E(x.title)}</b><div class="mut">${E(x.msg)}</div></div>`).join("") : '<p class="mut">No announcements yet.</p>'}</div>`,
    );
  },
  report: () => {
    if (S.done) {
      const r = S.done;
      return shell(
        RN,
        head(
          "Report submitted",
          "Thank you for helping keep our barangay clean",
        ) +
          `<div class="body"><div class="card"><div class="mut">Your reference number</div><h1 style="color:var(--lime)">${r.ref}</h1><div class="mut">${r.date}. Status: Submitted</div><p>Keep this number. Use it on the News page to check your report status.</p></div><button class="btn" onclick="S.done=null;R()">Done</button></div>`,
      );
    }
    const d =
        S.d ||
        (S.d = {
          type: "Missed collection",
          date: "",
          desc: "",
          pin: null,
          ph: [],
        }),
      m = d.type == "Missed collection";
    return shell(
      RN,
      head("Report a problem", "Help keep our barangay clean") +
        `<div class="body"><div class="seg"><button class="${m ? "on" : ""}" onclick="S.d.type='Missed collection';R()">Missed Collection</button><button class="${m ? "" : "on"}" onclick="S.d.type='Clogged canal';R()">Clogged drainage</button></div><div class="mut" style="margin-bottom:6px">Reporting for Barangay ${S.brgy}. We save this barangay, your description, the pinned location and any photo. No name or contact number is collected.</div>${m ? `<label for=dt>Date missed</label><input id=dt type=date value="${d.date}" oninput="S.d.date=this.value">${er("date")}` : ""}<label>Photo evidence <span class=mut>(optional, up to 3, JPG or PNG, 5 MB each)</span></label><div class="ph">${[0, 1, 2].map((i) => (d.ph[i] ? `<div onclick="S.d.ph.splice(${i},1);R()" title="Remove photo"><img src="${d.ph[i]}" alt="Attached photo ${i + 1}"></div>` : `<div onclick="$('#pf').click()">+ Add</div>`)).join("")}</div><input id=pf type=file accept="image/jpeg,image/png" multiple hidden onchange="addPh(this)">${er("ph")}<label>Pin the location <span class=mut>(required)</span></label><div class="map" id="pinmap" role="application" aria-label="Map for pinning the location"></div><a style="font-size:12px" onclick="useLoc()">Use my current location</a><div class="mut" id="pintxt" style="margin:4px 0 8px">${d.pin ? `Pinned at ${coords(d.pin)}. Tap the map or drag the pin to move it.` : "Tap the map to drop a pin"}</div><div id="pinerr">${er("pin")}</div><label for=ds>Description</label><textarea id=ds placeholder="What is the problem?" oninput="S.d.desc=this.value">${E(d.desc)}</textarea>${er("desc")}<button class="btn" onclick="sub()">Submit report</button></div>`,
    );
  },
  guide: () =>
    shell(
      RN,
      head("How to sort your garbage", "Segregate before collection") +
        `<div class="body"><div class="banner"><b>No segregation, no collection</b><br>Unsorted garbage will not be collected.</div>${[
          [
            "Biodegradable",
            "Green bin",
            "Food scraps, fruit and vegetable peels, leaves, grass, eggshells, paper",
            "",
          ],
          [
            "Non-biodegradable",
            "Black bin",
            "Plastic wrappers, bottles, cans, styrofoam, glass, rubber, diapers",
            "n",
          ],
          [
            "Residual",
            "Gray bin",
            "Items that cannot be recycled or composted, such as sanitary waste",
            "r",
          ],
        ]
          .map(
            (x) =>
              `<div class="card"><div class="row"><b>${x[0]}</b><span class="pill ${x[3]}">${x[1]}</span></div><div class="mut">${x[2]}</div></div>`,
          )
          .join(
            "",
          )}<div class="card"><b>Quick tips</b><div class="mut">1. Keep separate bags.<br>2. Rinse containers before disposal.<br>3. Tie bags and set them out on your collection day.</div></div></div>`,
    ),
  login: () =>
    `<button class="back" onclick="go('welcome')">BACK</button><div class="hero" style="padding-top:40px"><h1 style="font-size:24px">Barangay Official</h1><div style="margin-top:30px"><label for=u>Username</label><input id=u autocomplete=username><label for=p>Password</label><input id=p type=password autocomplete=current-password>${er("login")}<button class="btn" onclick="login()">Log in</button><p class="mut" style="text-align:center;margin-top:12px">Authorized officials only</p></div></div>`,
  sched: () => {
    const s = S.sched[S.off];
    if (S.editDay != null)
      return scheduleDayEditor(S.dayDraft, S.editDay);
    const today = (new Date().getDay() + 6) % 7;
    return shell(
      ON,
      `<button class="back" onclick="signOut()">SIGN OUT</button>` +
        head("Current schedule", "Edit the Collection schedule of your Barangay!") +
        `<div class="body schedule-overview-body"><div class="schedule-day-list">${s.map(officialScheduleDayCard).join("")}</div><button type="button" class="btn show-schedule-map" onclick="showScheduleMap(${today})">Show Map</button></div>`,
    );
  },
  ann: () =>
    shell(
      ON,
      head(
        "Post announcement",
        "Posted announcements appear in the News tab of your barangay residents",
      ) +
        `<div class="body"><div class="seg">${["Urgent", "Notice", "Reminder"].map((k) => `<button class="${S.ak == k ? "on" : ""}" onclick="S.ak='${k}';R()">${k}</button>`).join("")}</div><label for=at>Title</label><input id=at placeholder="e.g. No collection today">${er("t")}<label for=am>Message</label><textarea id=am placeholder="e.g. Garbage truck broke down. Collection resumes tomorrow."></textarea>${er("m")}<button class="btn" onclick="post()">Post announcement</button><h2>Recent posts</h2>${S.ann
          .filter((x) => x.b == S.off)
          .sort((a, b) => b.ts - a.ts)
          .map(
            (x) =>
              `<div class="card row"><span>${E(x.title)}</span><span class="mut">${x.date}</span></div>`,
          )
          .join("")}</div>`,
    ),
  reps: () => {
    const L = S.rep.filter((r) => r.b == S.off),
      r = L.find((x) => x.ref == S.sel);
    if (r) {
      const e = S.ed;
      return `<button class="back" onclick="S.sel=null;R()">BACK</button>${head(r.ref, `${r.type}, ${r.date}`)}<div class="body"><div class="card">${r.type == "Missed collection" ? `<div class="mut">Date missed: ${r.dm}</div>` : ""}<p style="margin:6px 0">${E(r.desc)}</p>${gmapPin(r.pin)}<div class="mut">Pin: ${coords(r.pin)}</div>${r.ph.length ? `<div class="ph">${r.ph.map((u) => `<div><img src="${u}" alt="Evidence photo"></div>`).join("")}</div>` : '<div class="mut">No photo attached</div>'}</div><label for=ac>Local action taken (or referral to the LGU, recorded here)</label><textarea id=ac oninput="S.ed.action=this.value">${E(e.action)}</textarea>${er("a")}<label for=st>Status</label><select id=st onchange="S.ed.status=this.value;R()">${ST.map((s) => `<option ${s == e.status ? "selected" : ""}>${s}</option>`).join("")}</select>${e.status == "Rejected" ? `<label for=rs>Reason for rejecting</label><input id=rs value="${E(e.reason)}" oninput="S.ed.reason=this.value">${er("r")}` : ""}<button class="btn" onclick="saveR()">Update status</button></div>`;
    }
    return shell(
      ON,
      head(
        "Citizen reports",
        `Barangay ${S.off}. Updates are shown to residents`,
      ) +
        `<div class="body"><div class="seg" style="flex-wrap:wrap">${["All", ...ST].map((f) => `<button style="flex:none;padding:7px 10px" class="${S.filter == f ? "on" : ""}" onclick="S.filter='${f}';R()">${f}</button>`).join("")}</div>${
          L.filter((x) => S.filter == "All" || x.status == S.filter)
            .sort((a, b) => b.ts - a.ts)
            .map(
              (x) =>
                `<div class="card" style="cursor:pointer" onclick="openRep('${x.ref}')"><div class="row"><b>${x.type}</b><span class="pill ${x.status == "Rejected" ? "bad" : x.status == "Resolved" ? "" : "n"}">${x.status}</span></div><div class="mut">${x.ref}, ${x.date}</div></div>`,
            )
            .join("") || '<p class="mut">No reports to show.</p>'
        }</div>`,
    );
  },
};
