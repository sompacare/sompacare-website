/** Production URLs — custom domains (primary) and Render fallbacks during cutover. */
export const PRODUCTION = {
  api: "https://api.sompacare.com",
  apiV1: "https://api.sompacare.com/api/v1",
  nurse: "https://nurse.sompacare.com",
  facility: "https://facility.sompacare.com",
  recruiter: "https://recruiter.sompacare.com",
  admin: "https://admin.sompacare.com",
  marketing: "https://www.sompacare.com",
};

/** Legacy Render hostnames — kept for DNS cutover / rollback probes. */
export const RENDER_FALLBACK = {
  api: "https://sompacare-api.onrender.com",
  apiV1: "https://sompacare-api.onrender.com/api/v1",
  nurse: "https://sompacare-nurse.onrender.com",
  facility: "https://sompacare-facility.onrender.com",
  recruiter: "https://sompacare-recruiter.onrender.com",
  admin: "https://sompacare-admin.onrender.com",
};

/** Clerk Dashboard → Paths → Allowed redirect URLs (exact list to paste). */
export const CLERK_REDIRECT_URLS = [
  PRODUCTION.nurse,
  `${PRODUCTION.nurse}/sign-in`,
  `${PRODUCTION.nurse}/sign-up`,
  `${PRODUCTION.nurse}/home`,
  PRODUCTION.facility,
  `${PRODUCTION.facility}/sign-in`,
  `${PRODUCTION.facility}/sign-up`,
  `${PRODUCTION.facility}/home`,
  `${PRODUCTION.facility}/onboarding`,
  PRODUCTION.recruiter,
  `${PRODUCTION.recruiter}/sign-in`,
  `${PRODUCTION.recruiter}/sign-up`,
  `${PRODUCTION.recruiter}/home`,
  PRODUCTION.admin,
  `${PRODUCTION.admin}/sign-in`,
  `${PRODUCTION.admin}/sign-up`,
  `${PRODUCTION.admin}/home`,
  `${PRODUCTION.admin}/facilities/invite`,
];
