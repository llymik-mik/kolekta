function cont() {
  S.err = {};
  if (!S.name.trim()) S.err.name = "Enter your name.";
  if (!S.brgy) S.err.brgy = "Select your barangay.";
  if (Object.keys(S.err).length) return R();
  S.tab = "home";
  S.screen = "res";
  V.res = V.home;
  go("home_");
}
V.home_ = () => V[S.tab]();
function login() {
  const u = $("#u").value.trim().toLowerCase(),
    p = $("#p").value,
    b = B.find((b) => acc(b) == u);
  S.err = {};
  if (b && S.locked[u])
    S.err.login =
      "This account is blocked after 5 failed attempts. Contact the person who issued the account.";
  else if (b) {
    S.off = b;
    S.tab = "sched";
    S.fails = 0;
    return go("off_");
  } else {
    if (b) {
      S.fails = (S.fails || 0) + 1;
      if (S.fails >= 5) S.locked[u] = 1;
    }
    S.err.login = "Invalid username or password.";
  }
  R();
  $("#u").value = u;
}
V.off_ = () => V[S.tab]();
function chk() {
  const r = S.rep.find(
    (x) => x.ref.toLowerCase() == S.chk.trim().toLowerCase(),
  );
  S.chkRes = r || "none";
  R();
}
function addPh(i) {
  const d = S.d;
  S.err = {};
  [...i.files].forEach((f) => {
    if (d.ph.length >= 3) return;
    if (!/^image\/(jpeg|png)$/.test(f.type) || f.size > 5e6)
      S.err.ph = "Choose a JPG or PNG photo under 5 MB.";
    else d.ph.push(URL.createObjectURL(f));
  });
  R();
}
function sub() {
  const d = S.d;
  S.err = {};
  if (d.type == "Missed collection" && !d.date)
    S.err.date = "Enter the date missed.";
  if (!d.pin) S.err.pin = "Drop a pin on the map.";
  if (!d.desc.trim()) S.err.desc = "Describe the problem.";
  if (Object.keys(S.err).length) return R();
  const r = {
    ref: `KOL-2026-${String(++S.seq).padStart(3, "0")}`,
    b: S.brgy,
    type: d.type,
    dm: d.date,
    desc: d.desc.trim(),
    pin: d.pin,
    ph: d.ph,
    status: "Submitted",
    date: now(),
    upd: now(),
    ts: Date.now(),
    action: "",
    reason: "",
  };
  S.rep.push(r);
  S.done = r;
  S.d = null;
  R();
}
function addScheduleZone(i, label) {
  const x = S.dayDraft;
  if (
    !label ||
    !PUROK_OPTIONS[S.off].includes(label) ||
    x.zones.some((zone) => zone.label == label)
  )
    return;
  x.zones.push({ label, start: "", end: "" });
  markDayDirty();
  keep();
}
function removeScheduleZone(i, j) {
  S.dayDraft.zones.splice(j, 1);
  markDayDirty();
  keep();
}
function openScheduleDay(i) {
  S.editDay = i;
  S.daySnapshot = JSON.stringify(S.sched[S.off][i]);
  S.dayDraft = JSON.parse(S.daySnapshot);
  S.dayDirty = false;
  S.err = {};
  keep();
}
function markDayDirty() {
  if (S.editDay == null || !S.dayDraft) return;
  S.dayDirty = JSON.stringify(S.dayDraft) != S.daySnapshot;
  const save = $("#save-day");
  if (save) save.disabled = !S.dayDirty;
}
function setCollectionStatus(i, enabled) {
  S.dayDraft.type = enabled ? "Collection" : "No collection";
  S.err = {};
  markDayDirty();
  keep();
}
function setWasteType(i, value) {
  S.dayDraft.wasteType = value;
  markDayDirty();
  keep();
}
function setZoneTime(j, field, value) {
  S.dayDraft.zones[j][field] = value;
  markDayDirty();
}
function validateScheduleDay(x, i) {
  S.err = {};
  if (x.type != "Collection") return;
  if (!x.zones.length)
    S.err["s" + i] = "Choose at least one purok or zone.";
  else if (
    x.zones.some((zone) => {
      const { start, end } = zoneTimes(zone);
      return !start || !end || timeMinutes(end) <= timeMinutes(start);
    })
  )
    S.err["s" + i] =
      "Set a valid start and end time for every selected purok or zone.";
  if (S.err["s" + i]) return;
  const driver = x.drv.trim(),
    crew = x.crew.map((name) => name.trim()).filter(Boolean);
  if (!driver) return (S.err["a" + i] = "Enter the driver.");
  if (!crew.length)
    return (S.err["a" + i] = "Enter at least one crew member (up to 5).");
  const all = [driver, ...crew];
  if (crew.length > 5)
    return (S.err["a" + i] = "A maximum of 5 crew members can be assigned.");
  if (new Set(all.map((name) => name.toLowerCase())).size < all.length)
    return (S.err["a" + i] = "A person can only be listed once.");
  for (const barangay of B) {
    if (barangay == S.off) continue;
    const other = S.sched[barangay][i];
    if (other.type != "Collection") continue;
    const assigned = [other.drv, ...other.crew].map((name) =>
        name.trim().toLowerCase(),
      ),
      conflict = x.zones.find((zone) => {
        const times = zoneTimes(zone);
        return other.zones.some((otherZone) => {
          const otherTimes = zoneTimes(otherZone);
          return (
            times.start &&
            times.end &&
            otherTimes.start &&
            otherTimes.end &&
            timeMinutes(times.start) < timeMinutes(otherTimes.end) &&
            timeMinutes(otherTimes.start) < timeMinutes(times.end)
          );
        });
      }),
      person = all.find((name) => assigned.includes(name.toLowerCase()));
    if (person && conflict) {
      const times = zoneTimes(conflict);
      return (S.err["a" + i] =
        `${person} is already assigned in Barangay ${barangay} on ${D[i]} during ${timeWindow(times.start, times.end)}.`);
    }
  }
}
function saveScheduleDay(i) {
  if (!S.dayDirty) return;
  const x = S.dayDraft;
  validateScheduleDay(x, i);
  if (Object.keys(S.err).length) return R();
  x.drv = x.drv.trim();
  x.wasteType = x.wasteType.trim();
  const crew = x.crew.map((name) => name.trim()).filter(Boolean);
  x.crew = crew.length ? crew : [""];
  S.sched[S.off][i] = x;
  const previous = S.stops[S.off],
    custom = previous.filter((stop) => stop.id.startsWith("custom-")),
    otherDays = previous.filter(
      (stop) => !stop.id.startsWith("custom-") && stop.day != D[i],
    ),
    dayStops =
      x.type == "Collection" && x.zones.length
        ? makeScheduleStops(
            S.off,
            i,
            x.zones,
            previous,
          )
        : [];
  S.stops[S.off] = [...otherDays, ...dayStops, ...custom];
  S.editDay = null;
  S.daySnapshot = null;
  S.dayDraft = null;
  S.dayDirty = false;
  S.err = {};
  tst(`${D[i]} saved.`);
}
function leaveScheduleDay() {
  if (S.dayDirty && !confirm("Discard your unsaved changes to this day?"))
    return;
  S.editDay = null;
  S.daySnapshot = null;
  S.dayDraft = null;
  S.dayDirty = false;
  S.err = {};
  R();
}
function showScheduleMap(i) {
  if (S.dayDirty && !confirm("Discard your unsaved changes to this day?"))
    return;
  S.editDay = null;
  S.daySnapshot = null;
  S.dayDraft = null;
  S.dayDirty = false;
  S.err = {};
  S.mapDay = D[i];
  S.mapAddLabel = "";
  S.rd = null;
  S.rs = 1;
  S.tab = "route";
  R();
}
function post() {
  const t = $("#at").value.trim(),
    m = $("#am").value.trim();
  S.err = {};
  if (!t) S.err.t = "Enter a title.";
  if (!m) S.err.m = "Enter a message.";
  if (Object.keys(S.err).length) {
    R();
    $("#at").value = t;
    $("#am").value = m;
    return;
  }
  S.ann.push({
    b: S.off,
    k: S.ak,
    title: t,
    msg: m,
    date: now(),
    ts: Date.now(),
  });
  tst("Announcement posted.");
}
function saveR() {
  const e = S.ed,
    r = S.rep.find((x) => x.ref == S.sel);
  S.err = {};
  if (e.status != "Submitted" && !e.action.trim())
    S.err.a = "Record the action taken.";
  if (e.status == "Rejected" && !e.reason.trim()) S.err.r = "Enter the reason.";
  if (Object.keys(S.err).length) return R();
  Object.assign(r, e, { upd: now(), ts: Date.now() });
  S.sel = null;
  tst("Status updated and posted to News.");
}
