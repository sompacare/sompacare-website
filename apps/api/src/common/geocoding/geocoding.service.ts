import { BadRequestException, Injectable, Logger } from "@nestjs/common";

export type GeocodeInput = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  source: "census" | "nominatim";
};

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocode(input: GeocodeInput): Promise<GeocodeResult> {
    const line = this.formatOneLine(input);
    if (!line) {
      throw new BadRequestException("Address is required for geocoding");
    }

    const census = await this.tryCensus(line);
    if (census) return census;

    const nominatim = await this.tryNominatim(line);
    if (nominatim) return nominatim;

    throw new BadRequestException(
      "We couldn't locate that address. Check the street, city, state, and ZIP code."
    );
  }

  formatOneLine(input: GeocodeInput): string {
    return [
      input.addressLine1.trim(),
      input.addressLine2?.trim(),
      input.city.trim(),
      `${input.state.trim().toUpperCase()} ${input.zipCode.trim()}`,
    ]
      .filter(Boolean)
      .join(", ");
  }

  private async tryCensus(address: string): Promise<GeocodeResult | null> {
    try {
      const url = new URL(
        "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
      );
      url.searchParams.set("address", address);
      url.searchParams.set("benchmark", "Public_AR_Current");
      url.searchParams.set("format", "json");

      const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        result?: {
          addressMatches?: Array<{
            matchedAddress?: string;
            coordinates?: { x?: number; y?: number };
          }>;
        };
      };

      const match = data.result?.addressMatches?.[0];
      if (!match) return null;
      const x = match.coordinates?.x;
      const y = match.coordinates?.y;
      if (x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }

      return {
        latitude: y,
        longitude: x,
        formattedAddress: match.matchedAddress ?? address,
        source: "census",
      };
    } catch (error) {
      this.logger.warn(`Census geocode failed: ${(error as Error).message}`);
      return null;
    }
  }

  private async tryNominatim(address: string): Promise<GeocodeResult | null> {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", address);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "us");

      const res = await fetch(url, {
        signal: AbortSignal.timeout(12_000),
        headers: {
          "User-Agent": "Sompacare/1.0 (facility onboarding)",
          Accept: "application/json",
        },
      });
      if (!res.ok) return null;

      const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
      const hit = data[0];
      if (!hit?.lat || !hit?.lon) return null;

      const latitude = Number(hit.lat);
      const longitude = Number(hit.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      return {
        latitude,
        longitude,
        formattedAddress: hit.display_name ?? address,
        source: "nominatim",
      };
    } catch (error) {
      this.logger.warn(`Nominatim geocode failed: ${(error as Error).message}`);
      return null;
    }
  }
}
