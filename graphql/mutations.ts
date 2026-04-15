import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
			user {
				id
				firstName
				middleName
				lastName
				email
				role
				phoneNumber
				dateOfBirth
				gender
				heardFrom
				agreedToTermsAndConditions
				agreedToPrivacyPolicy
				agreedToLiabilityWaiver
				guardianIdVerificationPhotoUrl
				attendanceId
				membershipDetails {
					membershipId
					physiqueGoalType
					fitnessGoal
					workOutTime
					coachesIds
					hasEnteredDetails
				}
				coachDetails {
					clientsIds
					sessionsIds
					specialization
					ratings
					yearsOfExperience
					moreDetails
					teachingDate
					teachingTime
				}
				createdAt
				updatedAt
			}
			token
		}
	}
`;

export const CREATE_USER_MUTATION = gql`
	mutation CreateUser($input: CreateUserInput!) {
		createUser(input: $input) {
			user {
				id
				firstName
				middleName
				lastName
				email
				role
				phoneNumber
				dateOfBirth
				gender
				heardFrom
				agreedToTermsAndConditions
				agreedToPrivacyPolicy
				agreedToLiabilityWaiver
				guardianIdVerificationPhotoUrl
				attendanceId
				membershipDetails {
					membershipId
					physiqueGoalType
					fitnessGoal
					workOutTime
					coachesIds
					hasEnteredDetails
				}
				coachDetails {
					clientsIds
					sessionsIds
					specialization
					ratings
					yearsOfExperience
					moreDetails
					teachingDate
					teachingTime
				}
				createdAt
				updatedAt
			}
			token
		}
	}
`;

// Session mutations
export const CREATE_SESSION_MUTATION = gql`
	mutation CreateSession($input: CreateSessionInput!) {
		createSession(input: $input) {
			id
			coachId
			coach {
				id
				firstName
				lastName
			}
			clientsIds
			clients {
				id
				firstName
				lastName
				email
			}
			name
			workoutType
			date
			startTime
			endTime
			gymArea
			note
			status
			templateId
			goalId
			goal {
				id
				title
				goalType
			}
			isTemplate
			sessionKind
			maxParticipants
			enrollments {
				clientId
				status
				createdAt
				client {
					id
					firstName
					lastName
					email
				}
			}
			createdAt
		}
	}
`;

export const INVITE_CLIENTS_TO_CLASS_MUTATION = gql`
	mutation InviteClientsToClassSession($sessionId: ID!, $clientIds: [ID!]!) {
		inviteClientsToClassSession(sessionId: $sessionId, clientIds: $clientIds) {
			id
			sessionKind
			maxParticipants
			enrollments {
				clientId
				status
				client {
					id
					firstName
					lastName
				}
			}
			clients {
				id
				firstName
				lastName
			}
		}
	}
`;

export const COACH_RESPOND_JOIN_REQUEST_MUTATION = gql`
	mutation CoachRespondToJoinRequest($sessionId: ID!, $clientId: ID!, $accept: Boolean!) {
		coachRespondToJoinRequest(sessionId: $sessionId, clientId: $clientId, accept: $accept) {
			id
			enrollments {
				clientId
				status
				client {
					id
					firstName
					lastName
				}
			}
			clients {
				id
				firstName
				lastName
				email
			}
			clientsIds
			maxParticipants
		}
	}
`;

export const REMOVE_CLIENT_FROM_CLASS_SESSION_MUTATION = gql`
	mutation RemoveClientFromClassSession($sessionId: ID!, $clientId: ID!) {
		removeClientFromClassSession(sessionId: $sessionId, clientId: $clientId) {
			id
			enrollments {
				clientId
				status
				client {
					id
					firstName
					lastName
				}
			}
			clients {
				id
				firstName
				lastName
			}
		}
	}
`;

export const LEAVE_CLASS_SESSION_MUTATION = gql`
	mutation LeaveClassSession($sessionId: ID!) {
		leaveClassSession(sessionId: $sessionId) {
			id
			clientsIds
			enrollments {
				clientId
				status
			}
		}
	}
`;

export const REQUEST_JOIN_CLASS_MUTATION = gql`
	mutation RequestToJoinClassSession($sessionId: ID!) {
		requestToJoinClassSession(sessionId: $sessionId) {
			id
			name
			sessionKind
			enrollments {
				clientId
				status
			}
		}
	}
`;

export const RESPOND_CLASS_INVITE_MUTATION = gql`
	mutation RespondToClassInvitation($sessionId: ID!, $accept: Boolean!) {
		respondToClassInvitation(sessionId: $sessionId, accept: $accept) {
			id
			sessionKind
			clientsIds
			enrollments {
				clientId
				status
			}
		}
	}
`;

export const CREATE_SESSION_FROM_TEMPLATE_MUTATION = gql`
	mutation CreateSessionFromTemplate($input: CreateSessionFromTemplateInput!) {
		createSessionFromTemplate(input: $input) {
			id
			coachId
			coach {
				id
				firstName
				lastName
			}
			clientsIds
			clients {
				id
				firstName
				lastName
				email
			}
			name
			workoutType
			date
			startTime
			endTime
			gymArea
			note
			status
			templateId
			goalId
			goal {
				id
				title
				goalType
			}
			createdAt
		}
	}
`;

export const UPDATE_SESSION_MUTATION = gql`
	mutation UpdateSession($id: ID!, $input: UpdateSessionInput!) {
		updateSession(id: $id, input: $input) {
			id
			name
			workoutType
			date
			startTime
			endTime
			gymArea
			note
			status
		}
	}
`;

export const CANCEL_SESSION_MUTATION = gql`
	mutation CancelSession($id: ID!) {
		cancelSession(id: $id)
	}
`;

export const COMPLETE_SESSION_MUTATION = gql`
	mutation CompleteSession($input: CreateSessionLogInput!) {
		completeSession(input: $input) {
			id
			sessionId
			clientId
			coachId
			weight
			progressImages {
				front
				rightSide
				leftSide
				back
			}
			clientConfirmed
			coachConfirmed
			notes
			completedAt
		}
	}
`;

export const CREATE_COACH_RATING_MUTATION = gql`
	mutation CreateCoachRating($input: CreateCoachRatingInput!) {
		createCoachRating(input: $input) {
			id
			coachId
			clientId
			sessionLogId
			rating
			comment
			createdAt
		}
	}
`;

export const CONFIRM_SESSION_COMPLETION_MUTATION = gql`
	mutation ConfirmSessionCompletion($input: ConfirmSessionCompletionInput!) {
		confirmSessionCompletion(input: $input) {
			id
			clientConfirmed
			coachConfirmed
		}
	}
`;

export const CLIENT_CONFIRM_WEIGHT_MUTATION = gql`
	mutation ClientConfirmWeight($sessionLogId: ID!) {
		clientConfirmWeight(sessionLogId: $sessionLogId) {
			id
			clientConfirmed
			coachConfirmed
		}
	}
`;

// Goal mutations
export const CREATE_GOAL_MUTATION = gql`
	mutation CreateGoal($input: CreateGoalInput!) {
		createGoal(input: $input) {
			id
			clientId
			goalType
			title
			description
			targetWeight
			currentWeight
			targetDate
			status
			createdAt
		}
	}
`;

export const UPDATE_GOAL_MUTATION = gql`
	mutation UpdateGoal($id: ID!, $input: UpdateGoalInput!) {
		updateGoal(id: $id, input: $input) {
			id
			goalType
			title
			description
			targetWeight
			currentWeight
			targetDate
			status
		}
	}
`;

export const DELETE_GOAL_MUTATION = gql`
	mutation DeleteGoal($id: ID!) {
		deleteGoal(id: $id)
	}
`;

export const ASSIGN_COACH_TO_GOAL_MUTATION = gql`
	mutation AssignCoachToGoal($goalId: ID!) {
		assignCoachToGoal(goalId: $goalId) {
			id
			clientId
			coachId
			coach {
				id
				firstName
				lastName
				email
			}
			goalType
			title
			description
			targetWeight
			currentWeight
			targetDate
			status
			createdAt
			updatedAt
		}
	}
`;

// Membership mutations
export const PURCHASE_MEMBERSHIP_MUTATION = gql`
	mutation PurchaseMembership($input: PurchaseMembershipInput!) {
		purchaseMembership(input: $input) {
			id
			clientId
			membershipId
			membership {
				id
				name
				monthlyPrice
				features
			}
			priceAtPurchase
			startedAt
			expiresAt
			status
		}
	}
`;

export const CANCEL_MEMBERSHIP_MUTATION = gql`
	mutation CancelMembership($transactionId: ID!) {
		cancelMembership(transactionId: $transactionId)
	}
`;

// User mutations
export const UPDATE_USER_MUTATION = gql`
	mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
		updateUser(id: $id, input: $input) {
			id
			firstName
			middleName
			lastName
			email
			role
			phoneNumber
			dateOfBirth
			gender
			heardFrom
			agreedToTermsAndConditions
			agreedToPrivacyPolicy
			agreedToLiabilityWaiver
			guardianIdVerificationPhotoUrl
			minorLiabilityWaiverPrintedName
			minorLiabilityWaiverSignatureUrl
			membershipDetails {
				membershipId
				physiqueGoalType
				fitnessGoal
				workOutTime
				coachesIds
				hasEnteredDetails
			}
			coachDetails {
				clientsIds
				sessionsIds
				specialization
				ratings
				yearsOfExperience
				moreDetails
				teachingDate
				teachingTime
				clientLimit
			}
			createdAt
			updatedAt
		}
	}
`;

// Coach Request mutations
export const CREATE_COACH_REQUEST_MUTATION = gql`
	mutation CreateCoachRequest($input: CreateCoachRequestInput!) {
		createCoachRequest(input: $input) {
			id
			clientId
			client {
				id
				firstName
				lastName
				email
			}
			coachId
			coach {
				id
				firstName
				lastName
			}
			status
			message
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_COACH_REQUEST_MUTATION = gql`
	mutation UpdateCoachRequest($id: ID!, $input: UpdateCoachRequestInput!) {
		updateCoachRequest(id: $id, input: $input) {
			id
			clientId
			client {
				id
				firstName
				lastName
				email
			}
			coachId
			coach {
				id
				firstName
				lastName
			}
			status
			message
			createdAt
			updatedAt
		}
	}
`;

export const CANCEL_COACH_REQUEST_MUTATION = gql`
	mutation CancelCoachRequest($id: ID!) {
		cancelCoachRequest(id: $id)
	}
`;

// Remove client mutation
export const REMOVE_CLIENT_MUTATION = gql`
	mutation RemoveClient($clientId: ID!) {
		removeClient(clientId: $clientId)
	}
`;

// Subscription Request mutations
export const CREATE_SUBSCRIPTION_REQUEST_MUTATION = gql`
	mutation CreateSubscriptionRequest($input: CreateSubscriptionRequestInput!) {
		createSubscriptionRequest(input: $input) {
			id
			memberId
			membershipId
			membership {
				id
				name
				monthlyPrice
				description
				features
				durationType
				monthDuration
			}
			status
			requestedAt
			createdAt
		}
	}
`;

// Progress Rating mutations
export const CREATE_PROGRESS_RATING_MUTATION = gql`
	mutation CreateProgressRating($input: CreateProgressRatingInput!) {
		createProgressRating(input: $input) {
			id
			coachId
			clientId
			goalId
			startDate
			endDate
			rating
			comment
			verdict
			sessionLogIds
			createdAt
		}
	}
`;

export const UPDATE_PROGRESS_RATING_MUTATION = gql`
	mutation UpdateProgressRating($id: ID!, $input: UpdateProgressRatingInput!) {
		updateProgressRating(id: $id, input: $input) {
			id
			rating
			comment
			verdict
			sessionLogIds
			updatedAt
		}
	}
`;

export const DELETE_PROGRESS_RATING_MUTATION = gql`
	mutation DeleteProgressRating($id: ID!) {
		deleteProgressRating(id: $id)
	}
`;

/** Member: upsert walk-in desk row so admin search finds you by name/email (try-out / no membership). */
export const SYNC_MY_WALK_IN_PROFILE_MUTATION = gql`
	mutation SyncMyWalkInProfile {
		syncMyWalkInProfile {
			id
			firstName
			middleName
			lastName
			phoneNumber
			email
			gender
			linkedUserId
			notes
			createdAt
			updatedAt
		}
	}
`;

