import { APPLICATION_POSITIONS } from "./careers";

export type PublicJobPosting = {
  id: string;
  slug: string;
  title: string;
  category: string;
  employment: string;
  locations: string;
  description: string;
  requirements: string[];
  clinicalRole?: string;
};

/** Fetch published postings from platform API, with static fallback */
export async function getPublishedJobPostings(): Promise<PublicJobPosting[]> {
  const apiUrl = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return staticFallback();

  const base = apiUrl.replace(/\/$/, "");
  const endpoint = base.endsWith("/api/v1")
    ? `${base}/job-postings/public`
    : `${base}/api/v1/job-postings/public`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 300 } });
    if (!res.ok) return staticFallback();
    const json = (await res.json()) as { data?: PublicJobPosting[] };
    if (!json.data?.length) return staticFallback();
    return json.data;
  } catch {
    return staticFallback();
  }
}

function staticFallback(): PublicJobPosting[] {
  return APPLICATION_POSITIONS.map((role) => ({
    id: role.id,
    slug: role.id,
    title: role.title,
    category: role.category,
    employment: role.employment,
    locations: role.locations,
    description: role.description,
    requirements: [...role.requirements],
  }));
}
