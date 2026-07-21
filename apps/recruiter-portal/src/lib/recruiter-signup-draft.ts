import {
  type RecruiterSignUpDraft,
  RECRUITER_SIGNUP_DRAFT_KEY,
} from "@sompacare/shared";

export { RECRUITER_SIGNUP_DRAFT_KEY };

export function readRecruiterSignUpDraft(): RecruiterSignUpDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RECRUITER_SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecruiterSignUpDraft;
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeRecruiterSignUpDraft(draft: RecruiterSignUpDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RECRUITER_SIGNUP_DRAFT_KEY, JSON.stringify(draft));
}

export function clearRecruiterSignUpDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RECRUITER_SIGNUP_DRAFT_KEY);
}
