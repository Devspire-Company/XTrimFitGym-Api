import type { User } from '@/graphql/generated/types';

/** Active gym membership is represented by an assigned membership id on the user. */
export function memberHasActiveGymMembership(user: User | null | undefined): boolean {
	return !!user?.membershipDetails?.membershipId;
}

/**
 * Server sets `facilityBiometricEnrollmentComplete` to false when a subscription becomes active.
 * Legacy accounts omit the field (treated as complete). Only explicit `false` blocks the app.
 */
export function memberNeedsFacilityBiometric(user: User | null | undefined): boolean {
	if (!memberHasActiveGymMembership(user)) return false;
	return user?.membershipDetails?.facilityBiometricEnrollmentComplete === false;
}
