import { strict as assert } from "node:assert";
import { haversineDistanceMeters, isWithinGeofence } from "./distance";

// Baltimore seed location to ~100m offset
const FACILITY_LAT = 39.2904;
const FACILITY_LON = -76.6122;
const NEARBY_LAT = 39.2913;
const NEARBY_LON = -76.6122;
const FAR_LAT = 39.35;
const FAR_LON = -76.61;

assert.ok(
  haversineDistanceMeters(FACILITY_LAT, FACILITY_LON, NEARBY_LAT, NEARBY_LON) < 200
);
assert.ok(
  haversineDistanceMeters(FACILITY_LAT, FACILITY_LON, FAR_LAT, FAR_LON) > 5000
);
assert.equal(
  isWithinGeofence(NEARBY_LAT, NEARBY_LON, FACILITY_LAT, FACILITY_LON, 150),
  true
);
assert.equal(
  isWithinGeofence(FAR_LAT, FAR_LON, FACILITY_LAT, FACILITY_LON, 150),
  false
);

console.log("geofence distance tests passed");
