async function scan(base, page, markers) {
  const html = await (await fetch(`${base}${page}`)).text();
  const paths = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]))];
  const hits = Object.fromEntries(markers.map((m) => [m, false]));
  for (const p of paths) {
    try {
      const js = await (await fetch(`${base}${p}`)).text();
      for (const m of markers) {
        if (js.includes(m)) hits[m] = true;
      }
    } catch {
      /* ignore */
    }
  }
  return hits;
}

const markers = [
  "formatApiError",
  "Geofence location verified",
  "geocodeFacilityAddress",
  "Verifying address",
  "coordinates needed",
  "Unable to create your facility",
];

const hits = await scan("https://sompacare-facility.onrender.com", "/onboarding", markers);
console.log(JSON.stringify(hits, null, 2));
