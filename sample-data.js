/* ---------- sample reports (7), pinned within ~1 km of each barangay ---------- */
(() => {
  const C = {
    Tibanga: [8.2398, 124.2379],
    Poblacion: [8.2291, 124.2337],
    "Pala-o": [8.233, 124.253],
    Hinaplanon: [8.22, 124.245],
    Saray: [8.248, 124.23],
  };
  const P = (b, dy, dx) => ({
      lat: +(C[b][0] + dy).toFixed(5),
      lng: +(C[b][1] + dx).toFixed(5),
    }),
    T = (m, d, h, mi) => new Date(2026, m, d, h, mi).getTime(),
    F = (m, d, h, mi) =>
      new Date(2026, m, d, h, mi).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
  const M = (n, b, type, dm, desc, pin, st, c, u, action, reason) => ({
    ref: `KOL-2026-${String(n).padStart(3, "0")}`,
    b,
    type,
    dm,
    desc,
    pin,
    ph: [],
    status: st,
    date: F(...c),
    upd: F(...u),
    ts: T(...u),
    action: action || "",
    reason: reason || "",
  });
  S.rep.push(
    M(
      1,
      "Poblacion",
      "Clogged canal",
      "",
      "The canal near the Unitop area is clogged again with plastic bottles and wrappers. Water rises quickly even after light rain and flooded the road this morning.",
      P("Poblacion", 0.003, 0.004),
      "Resolved",
      [10, 2, 7, 40],
      [10, 6, 14, 10],
      "Beyond what the barangay can clear. Referred to the City Engineers Office. Their crew declogged the canal on Nov 5 and the barangay checked the area afterwards.",
    ),
    M(
      2,
      "Saray",
      "Missed collection",
      "2026-11-02",
      "Purok 4 was not collected on Monday. Garbage bags are piling up beside the road and the smell is getting worse.",
      P("Saray", -0.004, 0.003),
      "Resolved",
      [10, 3, 9, 15],
      [10, 5, 16, 30],
      "Truck was under repair on Monday. Make-up collection for Purok 1 to 6 was completed on Nov 5.",
    ),
    M(
      3,
      "Pala-o",
      "Clogged canal",
      "",
      "Empty bottles, snack wrappers and plastic containers are blocking the canal along the purok road. Waste water is overflowing onto the street.",
      P("Pala-o", 0.006, -0.005),
      "Resolved",
      [10, 4, 6, 50],
      [10, 9, 11, 5],
      "Clean and Green utility workers removed the waste from the canal on Nov 9. Residents reminded not to throw waste into canals.",
    ),
    M(
      4,
      "Tibanga",
      "Missed collection",
      "2026-11-10",
      "Our street was skipped on Tuesday. The collectors did not come and the garbage is still out in front of the houses.",
      P("Tibanga", -0.005, -0.006),
      "In Progress",
      [10, 11, 8, 5],
      [10, 12, 10, 20],
      "Checked with the collection crew. The truck was delayed by a flat tire. Pick-up is being rescheduled and a delay notice will be posted.",
    ),
    M(
      5,
      "Hinaplanon",
      "Clogged canal",
      "",
      "The drainage beside the road is full of mud and garbage. Rain water cannot flow and the front yards flood within minutes.",
      P("Hinaplanon", 0.005, 0.006),
      "In Progress",
      [10, 13, 15, 30],
      [10, 16, 9, 0],
      "Barangay clearing started. The remaining blockage needs heavy equipment, so it was referred to the City Engineers Office and is awaiting schedule.",
    ),
    M(
      6,
      "Poblacion",
      "Missed collection",
      "2026-11-13",
      "Garbage was not collected on Friday in our zone. Please check why the truck did not pass by.",
      P("Poblacion", -0.007, -0.004),
      "Rejected",
      [10, 14, 12, 0],
      [10, 16, 15, 45],
      "Checked the crew log and route records.",
      "Collection for this zone was completed on Friday at 7:30 AM. The waste was set out after the truck passed. Please put it out before the collection time.",
    ),
    M(
      7,
      "Hinaplanon",
      "Missed collection",
      "2026-11-16",
      "Garbage in our purok was not picked up on Monday. Some residents say the truck only passed one street.",
      P("Hinaplanon", -0.006, 0.007),
      "Submitted",
      [10, 17, 7, 25],
      [10, 17, 7, 25],
    ),
  );
  const PH = { 1: 0, 2: 2, 3: 0, 4: 3, 5: 1, 6: 2, 7: 3 };
  S.rep.forEach((r) => {
    r.ph = [IMG[PH[+r.ref.slice(-3)]]];
  });
  S.seq = 7;
})();
