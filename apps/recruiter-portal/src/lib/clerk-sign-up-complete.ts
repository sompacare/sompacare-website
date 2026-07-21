"use client";

import type { SignUpResource } from "@clerk/types";
import {
  buildSignUpUpdateForMissingFields,
  type RecruiterSignUpDraft,
} from "@sompacare/shared";

export type SignUpCompletion = {
  status: SignUpResource["status"];
  sessionId: string | null;
  missingFields: string[];
};

/**
 * After email verification, Clerk often stays on missing_requirements until
 * name / legal acceptance (Dashboard settings) are supplied via signUp.update().
 */
export async function completeRecruiterSignUp(
  signUp: SignUpResource,
  draft: Pick<RecruiterSignUpDraft, "firstName" | "lastName" | "legalAccepted">
): Promise<SignUpCompletion> {
  await signUp.reload();

  let patch = buildSignUpUpdateForMissingFields(signUp.missingFields, draft);

  if (Object.keys(patch).length === 0 && signUp.status === "missing_requirements") {
    patch = {
      ...(draft.firstName ? { firstName: draft.firstName } : {}),
      ...(draft.lastName ? { lastName: draft.lastName } : {}),
      ...(draft.legalAccepted ? { legalAccepted: true } : {}),
    };
  }

  if (Object.keys(patch).length > 0) {
    await signUp.update(patch);
    await signUp.reload();
  }

  return {
    status: signUp.status,
    sessionId: signUp.createdSessionId,
    missingFields: signUp.missingFields ?? [],
  };
}

export async function activateClerkSession(
  setActive: ((params: { session: string }) => Promise<void>) | undefined,
  sessionId: string
) {
  if (!setActive) {
    throw new Error("Clerk session activation is unavailable.");
  }
  await setActive({ session: sessionId });
}
