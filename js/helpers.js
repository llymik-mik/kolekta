const $ = (s) => document.querySelector(s),
  R = () => {
    const app = $("#app");
    app.innerHTML =
      V[S.screen]() +
      (S.toast ? `<div class="toast" role="status">${E(S.toast)}</div>` : "");
    app.classList.toggle(
      "schedule-overview",
      S.screen == "off_" && S.tab == "sched" && S.editDay == null,
    );
    afterR();
  },
  go = (s) => {
    S.screen = s;
    S.err = {};
    R();
  };
const tst = (m) => {
  S.toast = m;
  R();
  setTimeout(() => {
    S.toast = "";
    R();
  }, 2200);
};
const pc = (t) => (t == "Collection" ? "" : "x");
const head = (h, p) => `<header><h1>${h}</h1><p>${p || ""}</p></header>`;
const nav = (a, c) =>
  `<nav>${a.map(([k, l]) => `<button class="${k == c ? "on" : ""}" onclick="S.tab='${k}';S.sel=null;S.done=null;S.chkRes=null;R()">${l}</button>`).join("")}</nav>`;
const er = (k) =>
  S.err[k] ? `<div class="err" role="alert">${E(S.err[k])}</div>` : "";
const shell = (a, body) =>
  `${a === ON && !S.sel && S.tab != "sched" ? '<button class="back" onclick="signOut()">SIGN OUT</button>' : ""}${body}${nav(a, S.tab)}`;
const RN = [
    ["home", "Home"],
    ["route", "Map"],
    ["news", "News"],
    ["report", "Report"],
    ["guide", "Sort Guide"],
  ],
  ON = [
    ["sched", "Schedule"],
    ["ann", "Announce"],
    ["reps", "Reports"],
  ];
const gmapPin = (p) =>
  `<div class="map" id="rmap" data-lat="${p.lat}" data-lng="${p.lng}"></div>`;
const coords = (p) => `${(+p.lat).toFixed(5)}, ${(+p.lng).toFixed(5)}`;
