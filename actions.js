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
function saveS() {
  S.err = {};
  const cur = S.sched[S.off];
  cur.forEach((x, i) => {
    if (x.type == "No collection") return;
    if (!x.route.trim())
      S.err["s" + i] = "Enter the purok or zones for this route.";
    const dv = x.drv.trim(),
      cr = x.crew.map((n) => n.trim()).filter(Boolean);
    if (!dv) return (S.err["a" + i] = "Enter the driver.");
    if (!cr.length)
      return (S.err["a" + i] = "Enter at least one crew member (up to 5).");
    const all = [dv, ...cr];
    if (new Set(all.map((n) => n.toLowerCase())).size < all.length)
      return (S.err["a" + i] = "A person can only be listed once.");
    for (const o of B) {
      if (o == S.off) continue;
      const y = S.sched[o][i];
      if (y.type != "Collection" || y.time != x.time) continue;
      const oo = [y.drv, ...y.crew].map((n) => n.trim().toLowerCase()),
        h = all.find((n) => oo.includes(n.toLowerCase()));
      if (h)
        return (S.err["a" + i] =
          `${h} is already assigned in Barangay ${o} on ${D[i]}${x.time ? " at " + t12(x.time) : ""}.`);
    }
  });
  if (Object.keys(S.err).length) return R();
  cur.forEach((x) => {
    if (x.type == "Collection") {
      x.drv = x.drv.trim();
      const c = x.crew.map((n) => n.trim()).filter(Boolean);
      x.crew = c.length ? c : [""];
    }
  });
  const previous = S.stops[S.off],
    custom = previous.filter((stop) => stop.id.startsWith("custom-"));
  S.stops[S.off] = cur.flatMap((x, i) =>
    x.type == "Collection" && x.route.trim()
      ? makeScheduleStops(S.off, i, x.route.trim(), previous)
      : [],
  ).concat(custom);
  S.editing = false;
  tst("Schedule saved. Residents can see it now.");
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
const schedList = (s) =>
  s
    .map((x, i) => {
      const c = x.crew.map((n) => n.trim()).filter(Boolean);
      return `<div class="card row ${x.type == "No collection" ? "dim" : ""}"><div><b>${D[i]}</b><div class="mut">${x.type == "No collection" ? "—" : E(x.route || "Route to be confirmed") + (x.time ? ", " + t12(x.time) : "")}</div>${S.off == "Tibanga" && x.type == "Collection" ? `<div class="mut">Waste type: ${E(x.wasteType || "All waste")}</div>` : ""}${x.type == "Collection" ? (x.drv.trim() ? `<div class="mut">Driver: ${E(x.drv)}<br>Crew (${c.length}): ${E(c.join(", "))}</div>` : `<div style="color:var(--amb);font-size:12px">No driver or crew assigned yet</div>`) : ""}${x.delay ? `<div style="color:var(--amb);font-size:12px">Delayed: ${E(x.delay)}</div>` : ""}</div><span class="pill ${pc(x.type)}">${x.type}</span></div>`;
    })
    .join("");
let snap = null;
function startEdit() {
  snap = JSON.parse(JSON.stringify(S.sched[S.off]));
  S.editing = true;
  S.err = {};
  R();
}
function cancelEdit() {
  if (snap) S.sched[S.off] = snap;
  S.editing = false;
  S.err = {};
  R();
}
