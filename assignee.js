/* ---------- assignee (driver + 1 to 5 crew) ---------- */
function keep(f) {
  const b = $(".body"),
    y = b ? b.scrollTop : 0;
  if (f) f();
  R();
  const n = $(".body");
  if (n) n.scrollTop = y;
}
const addCrew = (i) =>
    keep(() => {
      const c = S.sched[S.off][i].crew;
      if (c.length < 5) c.push("");
    }),
  rmCrew = (i, j) =>
    keep(() => {
      const c = S.sched[S.off][i].crew;
      if (c.length > 1) c.splice(j, 1);
    });
const asg = (x, i) => {
  const c = x.crew.length ? x.crew : [""];
  return `<label>Assignee</label><div class="mut" style="margin-bottom:4px">Who collects on ${D[i]}: one driver and 1 to 5 crew</div><label for=dv${i}>Driver</label><input id=dv${i} value="${E(x.drv)}" placeholder="Driver's full name" oninput="S.sched[S.off][${i}].drv=this.value"><label>Collection crew (${c.length} of 5)</label>${c.map((n, j) => `<div class="row" style="gap:6px"><input value="${E(n)}" placeholder="Crew member ${j + 1}" aria-label="Crew member ${j + 1}" oninput="S.sched[S.off][${i}].crew[${j}]=this.value">${c.length > 1 ? `<button class="rm" aria-label="Remove crew member ${j + 1}" onclick="rmCrew(${i},${j})">✕</button>` : ""}</div>`).join("")}${c.length < 5 ? `<a style="font-size:12px;display:block;width:max-content;margin:2px 0 12px" onclick="addCrew(${i})">+ Add crew member</a>` : ""}${er("a" + i)}`;
};
