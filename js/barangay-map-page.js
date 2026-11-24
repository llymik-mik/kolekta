/* ---------- Barangay collection map ---------- */
const gq = encodeURIComponent;
V.route = () => {
  const off = S.screen == "off_",
    b = off ? S.off : S.brgy,
    day = S.mapDay,
    schedule =
      S.sched[b].find((x, i) => D[i] == day) ||
      { type: "No collection", route: "", time: "", delay: "" },
    stops =
      schedule.type == "Collection"
        ? S.stops[b].filter((x) => x.day == day)
        : [],
    today = D[(new Date().getDay() + 6) % 7] || "Sunday";
  return shell(
    off ? ON : RN,
    head("Collection map", `Barangay ${b}, Iligan City`) +
      `<div class="body"><div class="map route-map" id="route-map" aria-label="Collection route map for Barangay ${E(b)} on ${day}"></div><div class="map-legend"><span><i class="scheduled"></i> Scheduled</span><span><i class="ongoing"></i> Ongoing</span><span><i class="done"></i> Done</span></div><div class="days map-days">${D.map((d, i) => `<button class="${day == d ? "on" : ""}" onclick="selectMapDay(${i})">${d.slice(0, 3)}</button>`).join("")}</div><div class="card map-summary"><div class="row"><b>${day}${day == today ? " · Today" : ""}</b><span class="pill ${schedule.type == "Collection" ? "" : "x"}">${schedule.type}</span></div><div class="mut">${schedule.type == "Collection" ? E(schedule.route || "Collection route to be confirmed") + (schedule.time ? ` · ${t12(schedule.time)}` : "") : "There is no waste collection scheduled for this day."}${b == "Tibanga" && schedule.type == "Collection" ? `<br>Waste type: ${E(schedule.wasteType || "All waste")}` : ""}${schedule.delay ? `<br>Delay notice: ${E(schedule.delay)}` : ""}</div></div>${schedule.type == "Collection" ? (stops.length ? stops.map((stop, i) => stopCard(stop, i, off, S.mapEditing)).join("") : '<p class="mut">No purok markers are set for this collection day.</p>') : ""}${off ? `<button class="btn ${S.mapEditing ? "alt" : ""}" onclick="toggleMapEditing()">${S.mapEditing ? "Done editing locations" : "Edit map locations"}</button>${S.mapEditing && schedule.type == "Collection" ? `<div class="card"><label for="new-stop">Add a purok / zone marker</label><input id="new-stop" placeholder="e.g. Purok 7" value="${E(S.mapAddLabel)}" oninput="S.mapAddLabel=this.value"><div class="mut">Enter the name, then click its location on the map. Drag a marker to adjust its position. Initial locations are approximate.</div></div>` : ""}${!S.mapEditing ? '<p class="mut">Residents see the collection status saved by the barangay.</p>' : ""}` : ""}</div>`,
  );
};
function stopCard(stop, index, off, editing) {
  const statusClass =
    stop.status == "Ongoing" ? "n" : stop.status == "Done" ? "" : "x";
  return `<div class="card stop-card"><div class="row"><div><span class="stop-order">${index + 1}</span><b>${E(stop.label)}</b></div><span class="pill ${statusClass}">${stop.status}</span></div>${off ? `<label for="stop-status-${E(stop.id)}">Collection status</label><select id="stop-status-${E(stop.id)}" aria-label="Status for ${E(stop.label)}" onchange="setStopStatus('${E(stop.id)}',this.value)"><option ${stop.status == "Scheduled" ? "selected" : ""}>Scheduled</option><option ${stop.status == "Ongoing" ? "selected" : ""}>Ongoing</option><option ${stop.status == "Done" ? "selected" : ""}>Done</option></select>${editing ? `<div class="mut">Position: ${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}</div>` : ""}` : `<div class="mut">${stop.status == "Done" ? "Collection completed" : stop.status == "Ongoing" ? "Truck is collecting here now" : "Collection is scheduled"}</div>`}</div>`;
}
function selectMapDay(i) {
  S.mapDay = D[i];
  S.mapAddLabel = "";
  R();
}
function toggleMapEditing() {
  S.mapEditing = !S.mapEditing;
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
      html: `<span class="route-marker route-marker--${stop.status.toLowerCase()}"><b>${index + 1}</b></span><span class="route-status-label route-status-label--${stop.status.toLowerCase()}">${E(stop.status)}</span>`,
      iconSize: [112, 34],
      iconAnchor: [12, 27],
    });
    const marker = L.marker([stop.lat, stop.lng], {
      icon,
      draggable: off && S.mapEditing,
    }).addTo(markers);
    marker.bindPopup(
      `<b>${E(stop.label)}</b><br>${E(stop.status)}${stop.status == "Ongoing" ? " — truck collecting" : stop.status == "Done" ? " — collection completed" : ""}`,
    );
    if (off && S.mapEditing)
      marker.on("dragend", (event) => {
        const point = event.target.getLatLng();
        stop.lat = +point.lat.toFixed(6);
        stop.lng = +point.lng.toFixed(6);
        if (routeLine)
          routeLine.setLatLngs(stops.map((item) => [item.lat, item.lng]));
        const status = document.getElementById(`stop-status-${stop.id}`);
        if (status && status.parentElement)
          status.parentElement.querySelector(".mut").textContent =
            `Position: ${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`;
      });
  });
  markers.addTo(map);
  if (stops.length > 1) map.fitBounds(markers.getBounds().pad(0.2));
  if (off && S.mapEditing && schedule.type == "Collection")
    map.on("click", (event) => {
      const label = S.mapAddLabel.trim();
      if (!label) {
        const input = document.getElementById("new-stop");
        if (input) input.focus();
        return;
      }
      S.stops[b].push({
        id: `custom-${++S.stopSeq}`,
        day: S.mapDay,
        label,
        lat: +event.latlng.lat.toFixed(6),
        lng: +event.latlng.lng.toFixed(6),
        status: "Scheduled",
      });
      S.mapAddLabel = "";
      R();
    });
}
