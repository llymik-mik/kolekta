/* ---------- Barangay collection map ---------- */
const gq = encodeURIComponent;
V.route = () => {
  const off = S.screen == "off_",
    b = off ? S.off : S.brgy,
    day = S.mapDay,
    schedule =
      S.sched[b].find((x, i) => D[i] == day) ||
      { type: "No collection", zones: [], delay: "" },
    stops =
      schedule.type == "Collection"
        ? S.stops[b].filter((x) => x.day == day)
        : [],
    today = D[(new Date().getDay() + 6) % 7] || "Sunday";
  const summaryText =
      schedule.type == "Collection"
        ? schedule.zones.length
          ? schedule.zones
              .map(
                (zone) => {
                  const { start, end } = zoneTimes(zone);
                  return `${E(zone.label)}${start && end ? ` · ${timeWindow(start, end)}` : ""}`;
                },
              )
              .join("<br>")
          : "Collection zones to be confirmed"
        : "There is no waste collection scheduled for this day.",
    summary = `<div class="card map-summary"><div class="row"><b>${day}${day == today ? " · Today" : ""}</b><span class="pill ${schedule.type == "Collection" ? "" : "x"}">${schedule.type}</span></div><div class="mut">${summaryText}${schedule.delay ? `<br>Delay notice: ${E(schedule.delay)}` : ""}</div>${wasteTypeHtml(schedule)}</div>`,
    stopCards =
      schedule.type == "Collection"
        ? stops.length
          ? stops.map((stop, i) => stopCard(stop, i, off, false)).join("")
          : '<p class="mut">No purok markers are set for this collection day.</p>'
        : "",
    mapControls = off
      ? '<p class="mut">Residents see the collection status saved by the barangay. Purok markers come from the saved schedule; to add or remove a purok, edit that day on the Schedule tab.</p>'
      : "";
  return shell(
    off ? ON : RN,
    head("Collection map", `Barangay ${b}, Iligan City`) +
      `<div class="body"><div class="map route-map" id="route-map" aria-label="Collection route map for Barangay ${E(b)} on ${day}"></div><div class="map-legend"><span><i class="scheduled"></i> Scheduled</span><span><i class="ongoing"></i> Ongoing</span><span><i class="done"></i> Done</span></div><div class="days map-days">${D.map((d, i) => `<button class="${day == d ? "on" : ""}" onclick="selectMapDay(${i})">${d.slice(0, 3)}</button>`).join("")}</div>${summary}${stopCards}${mapControls}</div>`,
  );
};
function stopCard(stop, index, off, editing) {
  const statusClass =
    stop.status == "Ongoing" ? "n" : stop.status == "Done" ? "" : "x";
  return `<div class="card stop-card"><div class="row"><div><span class="stop-order">${index + 1}</span><b>${E(stop.label)}</b></div><span class="pill ${statusClass}">${stop.status}</span></div>${off ? `<label for="stop-status-${E(stop.id)}">Collection status</label><select id="stop-status-${E(stop.id)}" aria-label="Status for ${E(stop.label)}" onchange="setStopStatus('${E(stop.id)}',this.value)"><option ${stop.status == "Scheduled" ? "selected" : ""}>Scheduled</option><option ${stop.status == "Ongoing" ? "selected" : ""}>Ongoing</option><option ${stop.status == "Done" ? "selected" : ""}>Done</option></select>` : `<div class="mut">${stop.status == "Done" ? "Collection completed" : stop.status == "Ongoing" ? "Truck is collecting here now" : "Collection is scheduled"}</div>`}</div>`;
}
function selectMapDay(i) {
  S.mapDay = D[i];
  S.mapAddLabel = "";
  R();
}
function setStopStatus(id, status) {
  if (S.screen != "off_" || !["Scheduled", "Ongoing", "Done"].includes(status))
    return;
  const stop = S.stops[S.off].find((x) => x.id == id);
  if (!stop) return;
  stop.status = status;
  R();
}
function initRouteMap() {
  const el = document.getElementById("route-map");
  if (!el) return;
  if (!window.L) {
    el.innerHTML =
      '<div class="mut" style="padding:12px">The map could not load. Check your internet connection and try again.</div>';
    return;
  }
  const off = S.screen == "off_",
    b = off ? S.off : S.brgy,
    schedule =
      S.sched[b].find((x, i) => D[i] == S.mapDay) ||
      { type: "No collection" },
    stops =
      schedule.type == "Collection"
        ? S.stops[b].filter((x) => x.day == S.mapDay)
        : [],
    map = L.map(el).setView(MAP_CENTER[b], 15),
    markers = L.featureGroup();
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Tiles &copy; Esri" },
  ).addTo(map);
  let routeLine = null;
  if (stops.length > 1)
    routeLine = L.polyline(
      stops.map((stop) => [stop.lat, stop.lng]),
      { color: "#2e7d32", weight: 4, opacity: 0.8 },
    ).addTo(map);
  stops.forEach((stop, index) => {
    const icon = L.divIcon({
      className: "",
      html: `<span class="route-marker route-marker--${stop.status.toLowerCase()}"><b>${index + 1}</b></span><span class="route-status-label route-status-label--${stop.status.toLowerCase()}">${E(stop.status)}</span>${stop.start && stop.end ? `<span class="route-time-label">${timeWindow(stop.start, stop.end)}</span>` : ""}`,
      iconSize: [150, 48],
      iconAnchor: [12, 27],
    });
    const marker = L.marker([stop.lat, stop.lng], {
      icon,
      draggable: false,
    }).addTo(markers);
    marker.bindPopup(
      `<b>${E(stop.label)}</b><br>${E(stop.status)}${stop.status == "Ongoing" ? " — truck collecting" : stop.status == "Done" ? " — collection completed" : ""}${stop.start && stop.end ? `<br>${timeWindow(stop.start, stop.end)}` : ""}`,
    );
  });
  markers.addTo(map);
  if (stops.length > 1) map.fitBounds(markers.getBounds().pad(0.2));
}
