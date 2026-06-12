// Tracks the claim IDs submitted by THIS visitor (the claimant), so a claimant
// can see only their own past claims — never the firm's full intake list.
// Stored client-side; in connected mode each claim is re-fetched by its own id.

import { getIntake } from "./api";
import type { SavedIntakeRecord } from "./types";

const STORAGE_KEY = "my_claim_ids";

export function getMyClaimIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordMyClaim(id: string): void {
  const ids = getMyClaimIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* quota / private mode — non-fatal */
    }
  }
}

export function isMyClaim(id: string): boolean {
  return getMyClaimIds().includes(id);
}

/** Load full records for the claimant's own claims only. */
export async function listMyClaims(): Promise<SavedIntakeRecord[]> {
  const ids = getMyClaimIds();
  const records = await Promise.all(ids.map((id) => getIntake(id).catch(() => null)));
  return records.filter((r): r is SavedIntakeRecord => r !== null);
}
