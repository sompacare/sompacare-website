"use client";

type Coordinates = { latitude: number; longitude: number; accuracyMeters?: number };

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        }),
      (err) => reject(new Error(err.message || "Could not get GPS location")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/** Use facility coordinates for local dev when not on-site. */
export function facilityFallbackPosition(shift: {
  location?: { latitude?: number | string | null; longitude?: number | string | null };
}): Coordinates {
  const lat = Number(shift.location?.latitude ?? 39.2904);
  const lon = Number(shift.location?.longitude ?? -76.6122);
  return { latitude: lat, longitude: lon, accuracyMeters: 10 };
}
