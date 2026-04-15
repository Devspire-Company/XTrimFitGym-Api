import { User } from '@/graphql/generated/types';

/**
 * Converts a GraphQL User object to a format suitable for Redux storage
 * Handles null values by converting them to undefined for cleaner state management
 */
export const convertGraphQLUser = (graphqlUser: User): User => {
	return {
		...graphqlUser,
		// Convert null to undefined for cleaner Redux state
		phoneNumber: graphqlUser.phoneNumber ?? undefined,
		dateOfBirth: graphqlUser.dateOfBirth ?? undefined,
		heardFrom:
			graphqlUser.heardFrom?.filter((v) => v !== null) ?? undefined,
		createdAt: graphqlUser.createdAt ?? undefined,
		updatedAt: graphqlUser.updatedAt ?? undefined,
		// Handle nested objects
		membershipDetails: graphqlUser.membershipDetails
			? {
					...graphqlUser.membershipDetails,
					membershipId:
						graphqlUser.membershipDetails.membershipId ?? undefined,
					coachesIds:
						graphqlUser.membershipDetails.coachesIds?.filter(
							(v) => v !== null
						) ?? undefined,
					workOutTime:
						graphqlUser.membershipDetails.workOutTime?.filter(
							(v) => v !== null
						) ?? undefined,
			  }
			: undefined,
		coachDetails: graphqlUser.coachDetails
			? {
					...graphqlUser.coachDetails,
					clientsIds:
						graphqlUser.coachDetails.clientsIds?.filter(
							(v) => v !== null
						) ?? undefined,
					sessionsIds:
						graphqlUser.coachDetails.sessionsIds?.filter(
							(v) => v !== null
						) ?? undefined,
					teachingDate:
						graphqlUser.coachDetails.teachingDate?.filter(
							(v) => v !== null
						) ?? undefined,
					teachingTime:
						graphqlUser.coachDetails.teachingTime?.filter(
							(v) => v !== null
						) ?? undefined,
			  }
			: undefined,
	};
};

