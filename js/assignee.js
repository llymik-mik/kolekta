/* ---------- assignee (driver + 1 to 5 crew) ---------- */
function keep(f) {
  const b = $(".day-editor-body") || $(".body"),
    y = b ? b.scrollTop : 0;
  if (f) f();
  R();
  const n = $(".day-editor-body") || $(".body");
  if (n) n.scrollTop = y;
}
const addCrew = (i) =>
    keep(() => {
      const c = S.dayDraft.crew;
      if (c.length < 5) c.push("");
      markDayDirty();
    }),
  rmCrew = (i, j) =>
    keep(() => {
      const c = S.dayDraft.crew;
      if (c.length > 1) {
        c.splice(j, 1);
        markDayDirty();
      }
    });
const staffRoster = () => {
  const names = (S.sched[S.off] || []).flatMap((day) => [
    day.drv,
    ...day.crew,
  ]);
  if (S.dayDraft) names.push(S.dayDraft.drv, ...S.dayDraft.crew);
  return [...new Map(names.map((name) => [name.trim().toLowerCase(), name.trim()]))
    .entries()]
    .filter(([key, name]) => key && name)
    .map(([, name]) => name);
};
const asg = (x, i) => {
  const c = x.crew.length ? x.crew : [""],
    roster = staffRoster(),
    options = roster.map((name) => `<option value="${E(name)}"></option>`).join("");
  return `<section class="editor-section assignee-section"><h2>Driver and crew</h2><p class="mut">Tap to choose a name used on another day, or enter a new name.</p><datalist id="drivers-${i}">${options}</datalist><datalist id="crew-${i}">${options}</datalist><label for="dv${i}">Driver</label><input id="dv${i}" list="drivers-${i}" value="${E(x.drv)}" placeholder="Driver's full name" oninput="S.dayDraft.drv=this.value;markDayDirty()"><label>Collection crew (${c.length} of 5)</label>${c.map((name, j) => `<div class="row" style="gap:6px"><input list="crew-${i}" value="${E(name)}" placeholder="Crew member ${j + 1}" aria-label="Crew member ${j + 1}" oninput="S.dayDraft.crew[${j}]=this.value;markDayDirty()">${c.length > 1 ? `<button type="button" class="rm" aria-label="Remove crew member ${j + 1}" onclick="rmCrew(${i},${j})">✕</button>` : ""}</div>`).join("")}${c.length < 5 ? `<a style="font-size:12px;display:block;width:max-content;margin:2px 0 12px" onclick="addCrew(${i})">+ Add crew member</a>` : ""}${er("a" + i)}</section>`;
};
