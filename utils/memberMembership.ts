import type { User } from '@/graphql/generated/types';

/**
 * True when the member has an active gym subscription (paid access), matching dashboard logic.
 * Do not use `membershipDetails.membershipId` alone — the API may leave it set after admin
 * unsubscribe while the transaction is canceled; `currentMembership` reflects active tx only.
 */
export function memberHasActiveGymMembership(user: User | null | undefined): boolean {
	const tx = user?.currentMembership;
	if (tx != null) {
		return tx.status === 'ACTIVE';
	}
	return false;
}

/**
 * Server sets `facilityBiometricEnrollmentComplete` to false when a subscription becomes active.
 * Legacy accounts omit the field (treated as complete). Only explicit `false` triggers the reminder.
 * The API `me` (and login) syncs this to true when door attendance already exists for the member.
 */
export function memberNeedsFacilityBiometric(user: User | null | undefined): boolean {
	if (!memberHasActiveGymMembership(user)) return false;
	return user?.membershipDetails?.facilityBiometricEnrollmentComplete === false;
}
