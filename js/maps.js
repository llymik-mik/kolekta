/* ---------- live maps: report pin + shaded barangay boundary ---------- */
const TRACE_TOOL = location.search.includes("trace"),
  BOUNDS = {},
  TR = {};
let TRON = false;
const trTools = () =>
  TRACE_TOOL
    ? `<div class="card" style="margin-top:8px"><b>Trace the boundary</b><div class="mut">Tap points along the edge of the barangay, in order.</div><div class="seg"><button id="trb" onclick="trToggle()">Start tracing</button><button onclick="trUndo()">Undo</button><button onclick="trClear()">Clear</button></div><textarea id="tpts" readonly rows="4" style="font-size:11px" onclick="this.select()"></textarea></div>`
    : "";
const trB = () => (S.screen == "home_" ? S.brgy : S.off);
function trDraw() {
  if (!PM || !PM.tl) return;
  const b = trB(),
    pts = TR[b] || [];
  PM.tl.clearLayers();
  if (pts.length > 1)
    L.polygon(pts, {
      color: "#1b5e20",
      weight: 3,
      fillColor: "#43a047",
      fillOpacity: 0.3,
    }).addTo(PM.tl);
  pts.forEach((p) =>
    L.circleMarker(p, {
      radius: 4,
      color: "#1b5e20",
      fillColor: "#fff",
      fillOpacity: 1,
      weight: 2,
    }).addTo(PM.tl),
  );
  const t = $("#tpts");
  if (t) t.value = pts.length ? `'${b}':${JSON.stringify(pts)},` : "";
}
function trToggle() {
  TRON = !TRON;
  const t = $("#trb");
  if (t) t.textContent = TRON ? "Stop tracing" : "Start tracing";
  if (PM) PM.el.style.cursor = TRON ? "crosshair" : "";
}
function trUndo() {
  const b = trB();
  (TR[b] || []).pop();
  trDraw();
}
function trClear() {
  TR[trB()] = [];
  trDraw();
}
let PM = null;
const tl = () =>
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Tiles &copy; Esri" },
  );
const same = (a, b) => a[0] == b[0] && a[1] == b[1];
function rings(ws) {
  const out = [],
    pool = ws.map((w) => w.slice());
  while (pool.length) {
    let cur = pool.shift(),
      moved = true;
    while (moved && !same(cur[0], cur[cur.length - 1])) {
      moved = false;
      for (let i = 0; i < pool.length; i++) {
        const w = pool[i];
        if (same(cur[cur.length - 1], w[0])) cur = cur.concat(w.slice(1));
        else if (same(cur[cur.length - 1], w[w.length - 1]))
          cur = cur.concat(w.slice(0, -1).reverse());
        else if (same(cur[0], w[w.length - 1]))
          cur = w.slice(0, -1).concat(cur);
        else if (same(cur[0], w[0])) cur = w.slice(1).reverse().concat(cur);
        else continue;
        pool.splice(i, 1);
        moved = true;
        break;
      }
    }
    out.push(cur);
  }
  return out;
}
const rx = (b) => b.replace(/-/g, "-?");
const fetchGeo = (b) =>
  fetch(
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&polygon_geojson=1&q=" +
      gq(`Barangay ${b}, Iligan City, Philippines`),
  )
    .then((r) => r.json())
    .catch(() => [])
    .then((a) => {
      const r = a && a[0],
        g = {
          c: r ? [+r.lat, +r.lon] : null,
          poly:
            r && r.geojson && /Polygon/.test(r.geojson.type) ? r.geojson : null,
        };
      if (g.poly) return g;
      const q = `[out:json][timeout:25];area["name"~"^Iligan"]["boundary"="administrative"]->.c;rel(area.c)["boundary"="administrative"]["name"~"^(Barangay )?${rx(b)}",i];out geom;`;
      return fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(q),
      })
        .then((r) => r.json())
        .then((j) => {
          const els = j.elements || [],
            re = new RegExp("^(Barangay )?" + rx(b) + "$", "i"),
            rel = els.find((e) => re.test((e.tags || {}).name || "")) || els[0];
          if (!rel) return g;
          const ws = (rel.members || [])
            .filter((m) => m.type == "way" && m.role != "inner" && m.geometry)
            .map((m) => m.geometry.map((p) => [p.lat, p.lon]));
          if (!ws.length) return g;
          const rg = rings(ws);
          return { c: g.c || rg[0][0], poly: null, rings: rg };
        })
        .catch(() => g);
    })
    .then((g) => (S.geo[b] = g));
function signOut() {
  S.off = null;
  S.tab = "home";
  S.sel = null;
  S.ed = null;
  S.editing = false;
  S.filter = "All";
  S.err = {};
  S.mapEditing = false;
  S.mapAddLabel = "";
  S.screen = "welcome";
  R();
  window.scrollTo(0, 0);
}
function openRep(ref) {
  const r = S.rep.find((x) => x.ref == ref);
  if (!r) return;
  S.sel = ref;
  S.ed = { status: r.status, action: r.action || "", reason: r.reason || "" };
  R();
  window.scrollTo(0, 0);
}
function afterR() {
  const routeMap = document.getElementById("route-map");
  if (routeMap) {
    PM = null;
    initRouteMap();
    return;
  }
  const rm = document.getElementById("rmap");
  if (rm && window.L) {
    const ll = [+rm.dataset.lat, +rm.dataset.lng],
      m = L.map(rm).setView(ll, 18);
    tl().addTo(m);
    L.marker(ll, {
      icon: L.divIcon({
        className: "",
        html: '<div class="dot"></div>',
        iconSize: [0, 0],
      }),
    }).addTo(m);
  }
  const el =
    document.getElementById("pinmap") || document.getElementById("bmap");
  PM = null;
  if (!el) return;
  if (!window.L) {
    el.innerHTML =
      '<div class="mut" style="padding:12px">The map could not load. Check your internet connection and try again.</div>';
    return;
  }
  TRON = false;
  const isB = el.id == "bmap",
    b = S.screen == "home_" ? S.brgy : S.off,
    p = !isB && S.d && S.d.pin,
    g0 = S.geo[b],
    map = L.map(el).setView(
      p ? [p.lat, p.lng] : g0 && g0.c ? g0.c : [8.228, 124.245],
      p ? 18 : g0 && g0.c ? 15 : 13,
    );
  PM = { map, mk: null, el };
  tl().addTo(map);
  const show = (g) => {
    const st = {
      color: "#1b5e20",
      weight: 3,
      fillColor: "#43a047",
      fillOpacity: isB ? 0.35 : 0.08,
    };
    let l = null;
    if (BOUNDS[b]) l = L.polygon(BOUNDS[b], st);
    else if (g && g.rings) l = L.polygon(g.rings, st);
    else if (g && g.poly) l = L.geoJSON(g.poly, { style: st });
    if (l) {
      l.addTo(map);
      if (!p) map.fitBounds(l.getBounds());
    } else if (g && g.c && !p) map.setView(g.c, 15);
  };
  if (p) mark(p);
  if (!isB) map.on("click", (e) => setPin(e.latlng));
  if (isB && TRACE_TOOL) {
    PM.tl = L.layerGroup().addTo(map);
    map.on("click", (e) => {
      if (TRON) {
        (TR[b] = TR[b] || []).push([
          +e.latlng.lat.toFixed(5),
          +e.latlng.lng.toFixed(5),
        ]);
        trDraw();
      }
    });
    trDraw();
  }
  if (BOUNDS[b]) show();
  else if (g0) show(g0);
  else
    Promise.resolve(S.gl[b] || (S.gl[b] = fetchGeo(b))).then((g) => {
      S.gl[b] = null;
      if (PM && PM.map === map && el.isConnected) show(g);
    });
}
function mark(p) {
  const m = L.marker([p.lat, p.lng], {
    draggable: true,
    icon: L.divIcon({
      className: "",
      html: '<div class="dot"></div>',
      iconSize: [0, 0],
    }),
  }).addTo(PM.map);
  m.on("dragend", () => setPin(m.getLatLng()));
  PM.mk = m;
}
function setPin(ll) {
  if (!PM) return;
  S.d.pin = { lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) };
  if (PM.mk) PM.mk.setLatLng(S.d.pin);
  else mark(S.d.pin);
  delete S.err.pin;
  const t = $("#pintxt");
  if (t)
    t.textContent = `Pinned at ${coords(S.d.pin)}. Tap the map or drag the pin to move it.`;
  const e = $("#pinerr");
  if (e) e.innerHTML = "";
}
function useLoc() {
  const bad = () => {
    const e = $("#pinerr");
    if (e)
      e.innerHTML =
        '<div class="err" role="alert">Could not get your location. Tap the map to pin it instead.</div>';
  };
  if (!navigator.geolocation) return bad();
  navigator.geolocation.getCurrentPosition(
    (p) => {
      const ll = { lat: p.coords.latitude, lng: p.coords.longitude };
      setPin(ll);
      if (PM) PM.map.setView([ll.lat, ll.lng], 18);
    },
    bad,
    { enableHighAccuracy: true, timeout: 10000 },
  );
}
