import { gql } from '@apollo/client';

export const ME_QUERY = gql`
	query Me {
		me {
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
			attendanceId
			membershipDetails {
				membershipId
				physiqueGoalType
				fitnessGoal
				workOutTime
				coachesIds
				hasEnteredDetails
				facilityBiometricEnrollmentComplete
			}
			currentMembership {
				id
				status
				expiresAt
				membership {
					id
					name
				}
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

export const GET_COACH_SESSIONS_QUERY = gql`
	query GetCoachSessions($coachId: ID!, $status: SessionStatus) {
		getCoachSessions(coachId: $coachId, status: $status) {
			id
			coachId
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
			equipmentReservations {
				equipmentId
				quantity
				reservedStartTime
				reservedEndTime
			}
			createdAt
		}
	}
`;

export const GET_JOINABLE_GROUP_CLASSES_QUERY = gql`
	query GetJoinableGroupClasses {
		getJoinableGroupClasses {
			id
			coachId
			coach {
				id
				firstName
				lastName
			}
			name
			date
			startTime
			endTime
			gymArea
			maxParticipants
			clientsIds
			sessionKind
		}
	}
`;

export const GET_CLIENT_SESSIONS_QUERY = gql`
	query GetClientSessions($clientId: ID!, $status: SessionStatus) {
		getClientSessions(clientId: $clientId, status: $status) {
			id
			coachId
			coach {
				id
				firstName
				lastName
			}
			name
			workoutType
			date
			startTime
			endTime
			gymArea
			note
			status
			goalId
			goal {
				id
				title
				goalType
				currentWeight
				targetWeight
			}
			sessionKind
			maxParticipants
			clientsIds
			enrollments {
				clientId
				status
				createdAt
			}
			equipmentReservations {
				equipmentId
				quantity
				reservedStartTime
				reservedEndTime
			}
			createdAt
		}
	}
`;

export const GET_USERS_QUERY = gql`
	query GetUsers($role: RoleType) {
		getUsers(role: $role) {
			id
			firstName
			middleName
			lastName
			email
			role
			phoneNumber
			membershipDetails {
				membershipId
				physiqueGoalType
				fitnessGoal
				workOutTime
				coachesIds
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
		}
	}
`;

export const GET_PENDING_COACH_REQUESTS_QUERY = gql`
	query GetPendingCoachRequests {
		getPendingCoachRequests {
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

export const GET_UPCOMING_SESSIONS_QUERY = gql`
	query GetUpcomingSessions {
		getUpcomingSessions {
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

export const GET_GOALS_QUERY = gql`
	query GetGoals($clientId: ID!, $status: GoalStatus) {
		getGoals(clientId: $clientId, status: $status) {
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

export const GET_CURRENT_MEMBERSHIP_QUERY = gql`
	query GetCurrentMembership {
		getCurrentMembership {
			id
			clientId
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
			priceAtPurchase
			startedAt
			expiresAt
			monthDuration
			status
		}
	}
`;

export const GET_USER_QUERY = gql`
	query GetUser($id: ID!) {
		getUser(id: $id) {
			id
			firstName
			lastName
			email
			role
			phoneNumber
			attendanceId
			membershipDetails {
				membershipId
				physiqueGoalType
				fitnessGoal
				workOutTime
				coachesIds
				hasEnteredDetails
				facilityBiometricEnrollmentComplete
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
		}
	}
`;

export const GET_ALL_CLIENT_GOALS_QUERY = gql`
	query GetAllClientGoals($coachId: ID!, $status: GoalStatus) {
		getAllClientGoals(coachId: $coachId, status: $status) {
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

export const GET_SESSION_TEMPLATES_QUERY = gql`
	query GetSessionTemplates($coachId: ID!) {
		getSessionTemplates(coachId: $coachId) {
			id
			coachId
			name
			workoutType
			gymArea
			note
			goalId
			goal {
				id
				title
				goalType
			}
			isTemplate
			equipmentReservations {
				equipmentId
				quantity
				reservedStartTime
				reservedEndTime
			}
			createdAt
		}
	}
`;

export const GET_SESSION_QUERY = gql`
	query GetSession($id: ID!) {
		getSession(id: $id) {
			id
			coachId
			coach {
				id
				firstName
				lastName
				email
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
			createdAt
		}
	}
`;

export const GET_SESSION_LOGS_QUERY = gql`
	query GetSessionLogs($clientId: ID!) {
		getSessionLogs(clientId: $clientId) {
			id
			sessionId
			session {
				id
				name
				workoutType
				date
				startTime
				endTime
				gymArea
				note
				status
				coach {
					id
					firstName
					lastName
					email
				}
				clients {
					id
					firstName
					lastName
					email
				}
				goal {
					id
					title
					goalType
					currentWeight
					targetWeight
				}
				createdAt
			}
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
				email
			}
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
			createdAt
			updatedAt
		}
	}
`;

export const GET_COACH_RATING_BY_SESSION_LOG_QUERY = gql`
	query GetCoachRatingBySessionLog($sessionLogId: ID!) {
		getCoachRatingBySessionLog(sessionLogId: $sessionLogId) {
			id
			sessionLogId
			rating
			comment
			createdAt
			coach {
				id
				firstName
				lastName
			}
		}
	}
`;

export const GET_MY_COACH_RATINGS_FOR_GOAL_QUERY = gql`
	query GetMyCoachRatingsForGoal($goalId: ID!) {
		getMyCoachRatingsForGoal(goalId: $goalId) {
			id
			rating
			comment
			createdAt
			coach {
				id
				firstName
				lastName
			}
			sessionLog {
				id
				weight
				completedAt
				session {
					id
					name
					date
				}
			}
		}
	}
`;

export const GET_COACH_SESSION_LOGS_QUERY = gql`
	query GetCoachSessionLogs($coachId: ID!) {
		getCoachSessionLogs(coachId: $coachId) {
			id
			sessionId
			session {
				id
				name
				date
				startTime
				endTime
				gymArea
				goalId
				goal {
					id
					title
					goalType
				}
			}
			clientId
			client {
				id
				firstName
				lastName
				email
			}
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
			createdAt
		}
	}
`;

export const GET_SESSION_LOG_BY_SESSION_ID_QUERY = gql`
	query GetSessionLogBySessionId($sessionId: ID!) {
		getSessionLogBySessionId(sessionId: $sessionId) {
			id
			sessionId
			session {
				id
				name
				date
				startTime
			}
			clientId
			client {
				id
				firstName
				lastName
				email
			}
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
			createdAt
		}
	}
`;

export const GET_WEIGHT_PROGRESS_QUERY = gql`
	query GetWeightProgress($clientId: ID!, $goalId: ID) {
		getWeightProgress(clientId: $clientId, goalId: $goalId) {
			id
			weight
			completedAt
			session {
				id
				name
				date
			}
		}
	}
`;

export const GET_GOAL_QUERY = gql`
	query GetGoal($id: ID!) {
		getGoal(id: $id) {
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

export const GET_WEIGHT_PROGRESS_CHART_QUERY = gql`
	query GetWeightProgressChart($clientId: ID!, $goalId: ID) {
		getWeightProgressChart(clientId: $clientId, goalId: $goalId) {
			date
			weight
			sessionId
			sessionLogId
		}
	}
`;

export const GET_MEMBERSHIPS_QUERY = gql`
	query GetMemberships($status: MembershipStatus) {
		getMemberships(status: $status) {
			id
			name
			monthlyPrice
			description
			features
			status
			durationType
			monthDuration
		}
	}
`;

export const GET_MEMBERSHIP_QUERY = gql`
	query GetMembership($id: ID!) {
		getMembership(id: $id) {
			id
			name
			monthlyPrice
			description
			features
			status
			durationType
			monthDuration
		}
	}
`;

export const GET_COACH_REQUESTS_QUERY = gql`
	query GetCoachRequests($coachId: ID!, $status: CoachRequestStatus) {
		getCoachRequests(coachId: $coachId, status: $status) {
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

export const GET_SESSION_LOGS_FOR_RATING_QUERY = gql`
	query GetSessionLogsForRating(
		$clientId: ID!
		$goalId: ID!
		$startDate: String!
		$endDate: String!
	) {
		getSessionLogsForRating(
			clientId: $clientId
			goalId: $goalId
			startDate: $startDate
			endDate: $endDate
		) {
			id
			sessionId
			session {
				id
				name
				date
				startTime
				endTime
				gymArea
				goalId
				goal {
					id
					title
					goalType
				}
			}
			clientId
			client {
				id
				firstName
				lastName
				email
			}
			weight
			progressImages {
				front
				rightSide
				leftSide
				back
			}
			completedAt
		}
	}
`;

export const GET_PROGRESS_RATINGS_QUERY = gql`
	query GetProgressRatings($clientId: ID!, $goalId: ID!) {
		getProgressRatings(clientId: $clientId, goalId: $goalId) {
			id
			coachId
			coach {
				id
				firstName
				lastName
			}
			clientId
			client {
				id
				firstName
				lastName
			}
			goalId
			goal {
				id
				title
				goalType
			}
			startDate
			endDate
			rating
			comment
			verdict
			sessionLogIds
			createdAt
			updatedAt
		}
	}
`;

export const GET_COACH_RATINGS_QUERY = gql`
	query GetCoachRatings($coachId: ID!) {
		getCoachRatings(coachId: $coachId) {
			id
			coachId
			clientId
			client {
				id
				firstName
				lastName
			}
			sessionLogId
			rating
			comment
			createdAt
			updatedAt
		}
	}
`;

export const GET_CLIENT_REQUESTS_QUERY = gql`
	query GetClientRequests($clientId: ID!, $status: CoachRequestStatus) {
		getClientRequests(clientId: $clientId, status: $status) {
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

export const GET_MY_SUBSCRIPTION_REQUESTS_QUERY = gql`
	query GetMySubscriptionRequests {
		getMySubscriptionRequests {
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
			approvedAt
			rejectedAt
			createdAt
			updatedAt
		}
	}
`;

export const GET_FITNESS_GOAL_TYPES_QUERY = gql`
	query GetFitnessGoalTypes {
		getFitnessGoalTypes
	}
`;

export const GET_ATTENDANCE_RECORDS_QUERY = gql`
	query GetAttendanceRecords($filter: AttendanceFilter, $pagination: AttendancePagination) {
		getAttendanceRecords(filter: $filter, pagination: $pagination) {
			records {
				id
				authDateTime
				authDate
				authTime
				direction
				deviceName
				deviceSerNum
				personName
				cardNo
			}
			totalCount
			hasMore
		}
	}
`;

export const GET_EQUIPMENTS_QUERY = gql`
	query GetEquipments($checkDate: String, $checkStartTime: String, $checkEndTime: String) {
		getEquipments(
			checkDate: $checkDate
			checkStartTime: $checkStartTime
			checkEndTime: $checkEndTime
		) {
			id
			name
			imageUrl
			description
			notes
			sortOrder
			status
			quantity
			maintenanceStartedAt
			isArchived
			archivedAt
			createdAt
			updatedAt
			isReservedInWindow
			reservedQuantityInWindow
			reservationWindowLabel
			upcomingUsages {
				sessionId
				sessionName
				date
				startTime
				endTime
				quantity
			}
		}
	}
`;

/** Member: walk-in desk registration and time-in count (poll for admin check-in). */
export const MY_MEMBER_WALK_IN_STATUS_QUERY = gql`
	query MyMemberWalkInStatus {
		myMemberWalkInStatus {
			registered
			timeInCount
			lastTimedInAt
			walkInClient {
				id
				firstName
				middleName
				lastName
				email
				phoneNumber
			}
		}
	}
`;
