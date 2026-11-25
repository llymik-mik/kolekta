const fit = () => {
  const a = document.getElementById("app"),
    k = Math.min(1, (innerWidth - 24) / 360, (innerHeight - 24) / 800);
  a.style.transform = "translate(-50%,-50%) scale(" + k + ")";
};
const B = ["Tibanga", "Poblacion", "Pala-o", "Hinaplanon", "Saray"],
  D = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  WASTE_TYPE_PRESETS = ["Bio", "Non-bio", "Recyclable"],
  PUROK_OPTIONS = {
    Tibanga: Array.from({ length: 21 }, (_, i) => `Purok ${i + 1}`),
    Poblacion: Array.from({ length: 10 }, (_, i) => `Zone ${i + 1}`),
    "Pala-o": [
      ...Array.from({ length: 19 }, (_, i) => `Purok ${i + 1}`),
      "Purok 13a",
      "Purok 14a",
    ],
    Hinaplanon: Array.from({ length: 15 }, (_, i) => `Purok ${i + 1}`),
    Saray: [
      ...Array.from({ length: 10 }, (_, i) => `Purok ${i + 1}`),
      "Purok 3a",
      "Purok 10a",
    ],
  },
  ST = ["Submitted", "In Progress", "Resolved", "Rejected"];
const acc = (b) => b.toLowerCase().replace("-", "");
const now = () =>
  new Date().toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const E = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const t12 = (t) => {
  let [h, m] = t.split(":");
  h = +h;
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
};
const timeMinutes = (t) => {
  const [hour, minute] = t.split(":").map(Number);
  return hour * 60 + minute;
};
const timeWindow = (start, end) => {
  if (!start || !end) return "";
  return `${t12(start)}–${t12(end)}`;
};
const zoneTimes = (zone) => ({
  start: zone.start || "",
  end: zone.end || "",
});
const S = {
  screen: "welcome",
  tab: "home",
  name: "",
  brgy: "",
  off: null,
  fails: 0,
  locked: {},
  sel: null,
  filter: "All",
  seq: 0,
  err: {},
  ann: [],
  rep: [],
  toast: "",
  chk: "",
  chkRes: null,
  done: null,
  d: null,
  ed: null,
  ak: "Urgent",
  sched: {},
  editDay: null,
  daySnapshot: null,
  dayDirty: false,
  geo: {},
  gl: {},
  rd: null,
  rs: 1,
  mapDay: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()],
  mapEditing: false,
  mapAddLabel: "",
  stopSeq: 0,
  stops: {},
};
const MAP_CENTER = {
  Tibanga: [8.239787, 124.237917],
  Poblacion: [8.229138, 124.233733],
  "Pala-o": [8.229705, 124.241766],
  Hinaplanon: [8.22, 124.245],
  Saray: [8.233787, 124.233006],
};
const parseRouteStops = (route) => {
  let prefix = "";
  const stops = [];
  String(route)
    .split(/\s*[;,]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const toRange = part.match(
        /^(Purok|Zone)\s+(\d+)\s+to\s+(?:(Purok|Zone)\s+)?(\d+)$/i,
      );
      if (
        toRange &&
        (!toRange[3] || toRange[3].toLowerCase() == toRange[1].toLowerCase())
      ) {
        prefix = toRange[1][0].toUpperCase() + toRange[1].slice(1).toLowerCase();
        const first = +toRange[2],
          last = +toRange[4],
          step = first <= last ? 1 : -1;
        if (Math.abs(last - first) <= 20) {
          for (let n = first; n != last + step; n += step)
            stops.push(`${prefix} ${n}`);
        } else {
          stops.push(`${prefix} ${first} to ${prefix} ${last}`);
        }
        return;
      }
      const named = part.match(/^(Purok|Zone)\s+(.+)$/i);
      let value = named ? named[2].trim() : part;
      if (named) prefix = named[1][0].toUpperCase() + named[1].slice(1).toLowerCase();
      const range = value.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
      if (range && prefix && Math.abs(+range[2] - +range[1]) <= 20) {
        const first = +range[1],
          last = +range[2],
          step = first <= last ? 1 : -1;
        for (let n = first; n != last + step; n += step)
          stops.push(`${prefix} ${n}`);
      } else {
        stops.push(`${prefix ? prefix + " " : ""}${value}`);
      }
    });
  return stops;
};
const makeScheduleStops = (b, dayIndex, zones, previous = []) =>
  zones.map(({ label, start, end }, stopIndex) => {
    const old = previous.find(
        (stop) =>
          stop.day == D[dayIndex] &&
          stop.label.toLowerCase() == label.toLowerCase(),
      ),
      rowOffset =
        ((dayIndex % 3) - 1) * 0.0008 +
        Math.sin(stopIndex * (Math.PI / 2)) * 0.00045,
      colOffset = (stopIndex - (zones.length - 1) / 2) * 0.0007;
    return {
      id: `schedule-${dayIndex}-${stopIndex}`,
      day: D[dayIndex],
      label,
      lat: old ? old.lat : MAP_CENTER[b][0] + rowOffset,
      lng: old ? old.lng : MAP_CENTER[b][1] + colOffset,
      status: old ? old.status : "Scheduled",
      start,
      end,
    };
  });
const SD = {
  Tibanga: [
    "",
    "Purok 10 to Purok 3",
    "",
    "Purok 21",
    "Purok 16 to Purok 12",
    "",
  ],
  Poblacion: [
    "Zone 1–5",
    "Zone 6–10",
    "Zone 1–5",
    "Zone 6–10",
    "Zone 1–5",
    "Zone 6–10",
  ],
  "Pala-o": [
    "Purok 1, 2, 3, 4, 11",
    "Purok 13, 13a, 14a",
    "Purok 17, 18, 19",
    "Purok 6, 7, 15",
    "",
    "",
  ],
  Hinaplanon: [
    "Purok 1, 2, 3",
    "Purok 4, 5, 6",
    "Purok 7, 8, 9",
    "Purok 10, 11, 12",
    "Purok 13, 14, 15",
    "",
  ],
  Saray: ["Purok 1, 2, 3, 3a, 4, 5, 6", "", "", "Purok 9, 10, 10a", "", ""],
};
B.forEach((b) => {
  S.sched[b] = D.map((_, i) => ({
    type:
      SD[b][i] || (b == "Tibanga" && i == 3) ? "Collection" : "No collection",
    zones: parseRouteStops(SD[b][i] || "").map((label) => ({
      label,
      start: "",
      end: "",
    })),
    wasteType:
      b == "Tibanga" && i == 1
        ? "Non-bio"
        : b == "Tibanga" && i == 3
          ? "Diapers only"
          : b == "Tibanga" && i < 6
            ? "All waste"
            : "",
    delay: "",
    drv: "",
    crew: [""],
  }));
  S.stops[b] = S.sched[b].flatMap((x, i) =>
      x.type == "Collection" && x.zones.length
        ? makeScheduleStops(b, i, x.zones)
        : [],
    );
  S.ann.push(
    {
      b,
      k: "Urgent",
      title: "No collection today: truck breakdown",
      msg: "The garbage truck is being repaired. Collection resumes tomorrow.",
      date: "Nov 5, 2026",
      ts: new Date(2026, 10, 5, 8, 0).getTime(),
    },
    {
      b,
      k: "Reminder",
      title: "No segregation, no collection",
      msg: "Please separate your waste before putting it out.",
      date: "Nov 3, 2026",
      ts: new Date(2026, 10, 3, 8, 0).getTime(),
    },
  );
});
