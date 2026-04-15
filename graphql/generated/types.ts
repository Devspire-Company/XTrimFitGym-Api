import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client/react';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Analytics = {
  __typename?: 'Analytics';
  activeSubscriptions: Scalars['Int']['output'];
  canceledSubscriptions: Scalars['Int']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  date: Scalars['String']['output'];
  expiredSubscriptions: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  membershipSubscriptionRevenue: Scalars['Float']['output'];
  newSubscriptions: Scalars['Int']['output'];
  revenueByMembership: Array<MembershipRevenue>;
  totalRevenue: Scalars['Float']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  walkInRevenue: Scalars['Float']['output'];
};

export type ApproveSubscriptionRequestInput = {
  requestId: Scalars['ID']['input'];
};

export type AttendanceConnection = {
  __typename?: 'AttendanceConnection';
  hasMore: Scalars['Boolean']['output'];
  records: Array<AttendanceRecord>;
  totalCount: Scalars['Int']['output'];
};

export type AttendanceFilter = {
  cardNo?: InputMaybe<Scalars['String']['input']>;
  deviceName?: InputMaybe<Scalars['String']['input']>;
  direction?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  personName?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type AttendancePagination = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type AttendanceRecord = {
  __typename?: 'AttendanceRecord';
  authDate: Scalars['String']['output'];
  authDateTime: Scalars['String']['output'];
  authTime: Scalars['String']['output'];
  cardNo?: Maybe<Scalars['String']['output']>;
  deviceName: Scalars['String']['output'];
  deviceSerNum: Scalars['String']['output'];
  direction: Scalars['String']['output'];
  id: Scalars['String']['output'];
  personName: Scalars['String']['output'];
};

export type AuthResponse = {
  __typename?: 'AuthResponse';
  token: Scalars['String']['output'];
  user: User;
};

export type ClassEnrollment = {
  __typename?: 'ClassEnrollment';
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  status: ClassEnrollmentStatus;
};

export type ClassEnrollmentStatus =
  | 'accepted'
  | 'declined'
  | 'invited'
  | 'pending'
  | 'rejected';

export type CoachDetails = {
  __typename?: 'CoachDetails';
  clientLimit?: Maybe<Scalars['Int']['output']>;
  clientsIds?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  moreDetails?: Maybe<Scalars['String']['output']>;
  ratings?: Maybe<Scalars['Float']['output']>;
  sessionsIds?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  specialization?: Maybe<Array<Scalars['String']['output']>>;
  teachingDate?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  teachingTime?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  yearsOfExperience?: Maybe<Scalars['Int']['output']>;
};

export type CoachDetailsInput = {
  clientLimit?: InputMaybe<Scalars['Int']['input']>;
  clientsIds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  moreDetails?: InputMaybe<Scalars['String']['input']>;
  ratings?: InputMaybe<Scalars['Float']['input']>;
  sessionsIds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  specialization?: InputMaybe<Array<Scalars['String']['input']>>;
  teachingDate?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  teachingTime?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  yearsOfExperience?: InputMaybe<Scalars['Int']['input']>;
};

export type CoachRating = {
  __typename?: 'CoachRating';
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  coach?: Maybe<User>;
  coachId: Scalars['ID']['output'];
  comment?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  rating: Scalars['Int']['output'];
  sessionLog?: Maybe<SessionLog>;
  sessionLogId: Scalars['ID']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type CoachRequest = {
  __typename?: 'CoachRequest';
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  coach?: Maybe<User>;
  coachId: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  status: CoachRequestStatus;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type CoachRequestStatus =
  | 'approved'
  | 'denied'
  | 'pending';

export type ConfirmSessionCompletionInput = {
  confirm: Scalars['Boolean']['input'];
  sessionLogId: Scalars['ID']['input'];
};

export type CreateCoachRatingInput = {
  coachId: Scalars['ID']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  rating: Scalars['Int']['input'];
  sessionLogId: Scalars['ID']['input'];
};

export type CreateCoachRequestInput = {
  coachId: Scalars['ID']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEquipmentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl: Scalars['String']['input'];
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<EquipmentStatus>;
};

export type CreateGoalInput = {
  currentWeight?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  goalType: Scalars['String']['input'];
  targetDate?: InputMaybe<Scalars['String']['input']>;
  targetWeight?: InputMaybe<Scalars['Float']['input']>;
  title: Scalars['String']['input'];
};

export type CreateMembershipInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  durationType: DurationType;
  features: Array<Scalars['String']['input']>;
  monthDuration: Scalars['Int']['input'];
  monthlyPrice: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  status: MembershipStatus;
};

export type CreateProgressRatingInput = {
  clientId: Scalars['ID']['input'];
  comment: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
  goalId: Scalars['ID']['input'];
  rating: Scalars['Int']['input'];
  sessionLogIds: Array<Scalars['ID']['input']>;
  startDate: Scalars['String']['input'];
  verdict: ProgressVerdict;
};

export type CreateSessionFromTemplateInput = {
  clientsIds: Array<Scalars['ID']['input']>;
  date: Scalars['String']['input'];
  endTime?: InputMaybe<Scalars['String']['input']>;
  goalId?: InputMaybe<Scalars['ID']['input']>;
  startTime: Scalars['String']['input'];
  templateId: Scalars['ID']['input'];
  workoutType?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSessionInput = {
  clientsIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  date: Scalars['String']['input'];
  endTime?: InputMaybe<Scalars['String']['input']>;
  goalId?: InputMaybe<Scalars['ID']['input']>;
  gymArea: Scalars['String']['input'];
  invitedClientIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  isTemplate?: InputMaybe<Scalars['Boolean']['input']>;
  maxParticipants?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  sessionKind?: InputMaybe<SessionKind>;
  startTime: Scalars['String']['input'];
  templateId?: InputMaybe<Scalars['ID']['input']>;
  workoutType?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSessionLogInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  progressImages: ProgressImagesInput;
  sessionId: Scalars['ID']['input'];
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateSubscriptionRequestInput = {
  membershipId: Scalars['ID']['input'];
};

export type CreateUserInput = {
  agreedToLiabilityWaiver?: InputMaybe<Scalars['Boolean']['input']>;
  agreedToPrivacyPolicy?: InputMaybe<Scalars['Boolean']['input']>;
  agreedToTermsAndConditions?: InputMaybe<Scalars['Boolean']['input']>;
  coachDetails?: InputMaybe<CoachDetailsInput>;
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<Scalars['String']['input']>;
  heardFrom?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastName: Scalars['String']['input'];
  membershipDetails?: InputMaybe<MemberDetailsInput>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  /**
   * Password is optional for Clerk-based admin creation (backend generates one).
   * Legacy email/password auth still uses this field.
   */
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  role: RoleType;
};

export type CreateWalkInClientInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  gender: WalkInGender;
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type CreateWalkInClientResult = {
  __typename?: 'CreateWalkInClientResult';
  client: WalkInClient;
  log?: Maybe<WalkInAttendanceLog>;
};

export type DateRangeInput = {
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type DirectSubscribeInput = {
  memberId: Scalars['ID']['input'];
  membershipId: Scalars['ID']['input'];
  /** Override plan length (months from startedAt). Defaults to the plan's monthDuration. */
  monthDuration?: InputMaybe<Scalars['Int']['input']>;
  /** When the subscription started (e.g. legacy walk-in). Defaults to now. ISO-8601 string. */
  startedAt?: InputMaybe<Scalars['String']['input']>;
};

export type DurationType =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';

export type Equipment = {
  __typename?: 'Equipment';
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  sortOrder: Scalars['Int']['output'];
  status: EquipmentStatus;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type EquipmentStatus =
  | 'AVAILABLE'
  | 'DAMAGED'
  | 'UNDERMAINTENANCE';

export type Goal = {
  __typename?: 'Goal';
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  coach?: Maybe<User>;
  coachId?: Maybe<Scalars['ID']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  currentWeight?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  goalType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: GoalStatus;
  targetDate?: Maybe<Scalars['String']['output']>;
  targetWeight?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type GoalStatus =
  | 'active'
  | 'cancelled'
  | 'completed'
  | 'paused';

export type LoginHistoryEntry = {
  __typename?: 'LoginHistoryEntry';
  ipAddress?: Maybe<Scalars['String']['output']>;
  loginAt?: Maybe<Scalars['String']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MemberDetails = {
  __typename?: 'MemberDetails';
  coachesIds?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  facilityBiometricEnrollmentComplete?: Maybe<Scalars['Boolean']['output']>;
  fitnessGoal?: Maybe<Array<Scalars['String']['output']>>;
  hasEnteredDetails?: Maybe<Scalars['Boolean']['output']>;
  membershipId?: Maybe<Scalars['ID']['output']>;
  membershipTransaction?: Maybe<MembershipTransaction>;
  physiqueGoalType: Scalars['String']['output'];
  workOutTime?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type MemberDetailsInput = {
  coachesIds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  facilityBiometricEnrollmentComplete?: InputMaybe<Scalars['Boolean']['input']>;
  fitnessGoal?: InputMaybe<Array<Scalars['String']['input']>>;
  hasEnteredDetails?: InputMaybe<Scalars['Boolean']['input']>;
  membershipId?: InputMaybe<Scalars['ID']['input']>;
  physiqueGoalType: Scalars['String']['input'];
  workOutTime?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Membership = {
  __typename?: 'Membership';
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  durationType: DurationType;
  features: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  monthDuration: Scalars['Int']['output'];
  monthlyPrice: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  status: MembershipStatus;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type MembershipRevenue = {
  __typename?: 'MembershipRevenue';
  count: Scalars['Int']['output'];
  membershipId: Scalars['ID']['output'];
  membershipName: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
};

export type MembershipStatus =
  | 'ACTIVE'
  | 'COMING_SOON'
  | 'INACTIVE';

export type MembershipTransaction = {
  __typename?: 'MembershipTransaction';
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  membership?: Maybe<Membership>;
  membershipId: Scalars['ID']['output'];
  /** Total months for this subscription from startedAt (matches expiry; may differ from plan default). */
  monthDuration: Scalars['Int']['output'];
  priceAtPurchase: Scalars['Float']['output'];
  startedAt: Scalars['String']['output'];
  status: TransactionStatus;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  approveSubscriptionRequest: MembershipTransaction;
  assignCoachToGoal: Goal;
  cancelCoachRequest: Scalars['Boolean']['output'];
  cancelMembership: Scalars['Boolean']['output'];
  cancelSession: Scalars['Boolean']['output'];
  clientConfirmWeight: SessionLog;
  coachRespondToJoinRequest: Session;
  completeSession: SessionLog;
  confirmSessionCompletion: SessionLog;
  createCoachRating: CoachRating;
  createCoachRequest: CoachRequest;
  createEquipment: Equipment;
  createGoal: Goal;
  createMembership: Membership;
  createProgressRating: ProgressRating;
  createSession: Session;
  createSessionFromTemplate: Session;
  createSubscriptionRequest: SubscriptionRequest;
  createUser: AuthResponse;
  createWalkInClient: CreateWalkInClientResult;
  deleteCoachRating: Scalars['Boolean']['output'];
  deleteEquipment: Scalars['Boolean']['output'];
  deleteGoal: Scalars['Boolean']['output'];
  deleteMembership: Scalars['Boolean']['output'];
  deleteProgressRating: Scalars['Boolean']['output'];
  deleteSubscriptionRequest: Scalars['Boolean']['output'];
  deleteUser?: Maybe<Scalars['Boolean']['output']>;
  directSubscribeMember: MembershipTransaction;
  inviteClientsToClassSession: Session;
  leaveClassSession: Session;
  login: AuthResponse;
  purchaseMembership: MembershipTransaction;
  rejectSubscriptionRequest: Scalars['Boolean']['output'];
  removeClient: Scalars['Boolean']['output'];
  removeClientFromClassSession: Session;
  requestToJoinClassSession: Session;
  respondToClassInvitation: Session;
  updateCoachRating: CoachRating;
  updateCoachRequest: CoachRequest;
  updateEquipment: Equipment;
  updateGoal: Goal;
  updateMembership: Membership;
  updateMembershipTransactionDuration: MembershipTransaction;
  updateProgressRating: ProgressRating;
  updateSession: Session;
  updateUser?: Maybe<User>;
  updateWalkInClient: WalkInClient;
  updateWalkInPaymentSettings: WalkInPaymentSettings;
  walkInTimeIn: WalkInAttendanceLog;
};


export type MutationApproveSubscriptionRequestArgs = {
  input: ApproveSubscriptionRequestInput;
};


export type MutationAssignCoachToGoalArgs = {
  goalId: Scalars['ID']['input'];
};


export type MutationCancelCoachRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelMembershipArgs = {
  transactionId: Scalars['ID']['input'];
};


export type MutationCancelSessionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationClientConfirmWeightArgs = {
  sessionLogId: Scalars['ID']['input'];
};


export type MutationCoachRespondToJoinRequestArgs = {
  accept: Scalars['Boolean']['input'];
  clientId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationCompleteSessionArgs = {
  input: CreateSessionLogInput;
};


export type MutationConfirmSessionCompletionArgs = {
  input: ConfirmSessionCompletionInput;
};


export type MutationCreateCoachRatingArgs = {
  input: CreateCoachRatingInput;
};


export type MutationCreateCoachRequestArgs = {
  input: CreateCoachRequestInput;
};


export type MutationCreateEquipmentArgs = {
  input: CreateEquipmentInput;
};


export type MutationCreateGoalArgs = {
  input: CreateGoalInput;
};


export type MutationCreateMembershipArgs = {
  input: CreateMembershipInput;
};


export type MutationCreateProgressRatingArgs = {
  input: CreateProgressRatingInput;
};


export type MutationCreateSessionArgs = {
  input: CreateSessionInput;
};


export type MutationCreateSessionFromTemplateArgs = {
  input: CreateSessionFromTemplateInput;
};


export type MutationCreateSubscriptionRequestArgs = {
  input: CreateSubscriptionRequestInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationCreateWalkInClientArgs = {
  input: CreateWalkInClientInput;
  timeInNow: Scalars['Boolean']['input'];
};


export type MutationDeleteCoachRatingArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEquipmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGoalArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMembershipArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProgressRatingArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSubscriptionRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDirectSubscribeMemberArgs = {
  input: DirectSubscribeInput;
};


export type MutationInviteClientsToClassSessionArgs = {
  clientIds: Array<Scalars['ID']['input']>;
  sessionId: Scalars['ID']['input'];
};


export type MutationLeaveClassSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationPurchaseMembershipArgs = {
  input: PurchaseMembershipInput;
};


export type MutationRejectSubscriptionRequestArgs = {
  input: RejectSubscriptionRequestInput;
};


export type MutationRemoveClientArgs = {
  clientId: Scalars['ID']['input'];
};


export type MutationRemoveClientFromClassSessionArgs = {
  clientId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationRequestToJoinClassSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationRespondToClassInvitationArgs = {
  accept: Scalars['Boolean']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationUpdateCoachRatingArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  rating?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationUpdateCoachRequestArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCoachRequestInput;
};


export type MutationUpdateEquipmentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEquipmentInput;
};


export type MutationUpdateGoalArgs = {
  id: Scalars['ID']['input'];
  input: UpdateGoalInput;
};


export type MutationUpdateMembershipArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMembershipInput;
};


export type MutationUpdateMembershipTransactionDurationArgs = {
  input: UpdateMembershipTransactionDurationInput;
};


export type MutationUpdateProgressRatingArgs = {
  id: Scalars['ID']['input'];
  input: UpdateProgressRatingInput;
};


export type MutationUpdateSessionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSessionInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};


export type MutationUpdateWalkInClientArgs = {
  input: UpdateWalkInClientInput;
  walkInClientId: Scalars['ID']['input'];
};


export type MutationUpdateWalkInPaymentSettingsArgs = {
  paymentPesos: Scalars['Float']['input'];
};


export type MutationWalkInTimeInArgs = {
  at?: InputMaybe<Scalars['String']['input']>;
  walkInClientId: Scalars['ID']['input'];
};

export type PeriodRevenue = {
  __typename?: 'PeriodRevenue';
  count: Scalars['Int']['output'];
  period: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
  walkInCount: Scalars['Int']['output'];
  walkInRevenue: Scalars['Float']['output'];
};

export type ProgressImages = {
  __typename?: 'ProgressImages';
  back?: Maybe<Scalars['String']['output']>;
  front?: Maybe<Scalars['String']['output']>;
  leftSide?: Maybe<Scalars['String']['output']>;
  rightSide?: Maybe<Scalars['String']['output']>;
};

export type ProgressImagesInput = {
  back?: InputMaybe<Scalars['String']['input']>;
  front?: InputMaybe<Scalars['String']['input']>;
  leftSide?: InputMaybe<Scalars['String']['input']>;
  rightSide?: InputMaybe<Scalars['String']['input']>;
};

export type ProgressRating = {
  __typename?: 'ProgressRating';
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  coach?: Maybe<User>;
  coachId: Scalars['ID']['output'];
  comment: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  endDate: Scalars['String']['output'];
  goal?: Maybe<Goal>;
  goalId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  rating: Scalars['Int']['output'];
  sessionLogIds: Array<Scalars['ID']['output']>;
  sessionLogs?: Maybe<Array<SessionLog>>;
  startDate: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  verdict: ProgressVerdict;
};

export type ProgressVerdict =
  | 'achieved'
  | 'close_to_achievement'
  | 'progressive'
  | 'regressing';

export type PurchaseMembershipInput = {
  membershipId: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  getAllClientGoals: Array<Goal>;
  getAllSubscriptionRequests: Array<SubscriptionRequest>;
  getAnalytics?: Maybe<Analytics>;
  getAnalyticsRange: Array<Analytics>;
  getAttendanceRecord?: Maybe<AttendanceRecord>;
  getAttendanceRecords: AttendanceConnection;
  getClientProgressRatings: Array<ProgressRating>;
  getClientRequests: Array<CoachRequest>;
  getClientSessions: Array<Session>;
  getCoachProgressRatings: Array<ProgressRating>;
  getCoachRatingBySessionLog?: Maybe<CoachRating>;
  getCoachRatings: Array<CoachRating>;
  getCoachRequests: Array<CoachRequest>;
  getCoachSessionLogs: Array<SessionLog>;
  getCoachSessions: Array<Session>;
  getCurrentMembership?: Maybe<MembershipTransaction>;
  getEquipment?: Maybe<Equipment>;
  getEquipments: Array<Equipment>;
  getFitnessGoalTypes: Array<Scalars['String']['output']>;
  getGoal?: Maybe<Goal>;
  getGoals: Array<Goal>;
  getJoinableGroupClasses: Array<Session>;
  getMembership?: Maybe<Membership>;
  getMembershipTransaction?: Maybe<MembershipTransaction>;
  getMemberships: Array<Membership>;
  getMySubscriptionRequests: Array<SubscriptionRequest>;
  getPendingCoachRequests: Array<CoachRequest>;
  getPendingSubscriptionRequests: Array<SubscriptionRequest>;
  getProgressRatings: Array<ProgressRating>;
  getRevenueSummary: RevenueSummary;
  getSession?: Maybe<Session>;
  getSessionLogBySessionId?: Maybe<SessionLog>;
  getSessionLogs: Array<SessionLog>;
  getSessionLogsForRating: Array<SessionLog>;
  getSessionTemplates: Array<Session>;
  getSubscriptionRequest?: Maybe<SubscriptionRequest>;
  getUpcomingSessions: Array<Session>;
  getUser?: Maybe<User>;
  getUsers?: Maybe<Array<Maybe<User>>>;
  getWeightProgress: Array<SessionLog>;
  getWeightProgressChart: Array<WeightProgress>;
  /** Current user from Authorization (JWT or Clerk session token). */
  me?: Maybe<User>;
  /** Search by name/phone/email, or pass an empty query to list all walk-ins (admin, paginated). */
  searchWalkInClients: Array<WalkInClient>;
  /** All walk-in profiles with per-profile time-in counts (paginated, newest updated first). */
  walkInAccountsOverview: WalkInAccountsOverview;
  walkInAttendanceLogs: WalkInLogsConnection;
  /** All time-in logs for one walk-in client (newest first). */
  walkInLogsByClient: WalkInLogsConnection;
  /** Default walk-in time-in fee in PHP (admin). */
  walkInPaymentSettings: WalkInPaymentSettings;
  /** System-wide walk-in profile and time-in counts (admin). */
  walkInStats: WalkInStats;
};


export type QueryGetAllClientGoalsArgs = {
  coachId: Scalars['ID']['input'];
  status?: InputMaybe<GoalStatus>;
};


export type QueryGetAnalyticsArgs = {
  date: Scalars['String']['input'];
};


export type QueryGetAnalyticsRangeArgs = {
  dateRange: DateRangeInput;
};


export type QueryGetAttendanceRecordArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetAttendanceRecordsArgs = {
  filter?: InputMaybe<AttendanceFilter>;
  pagination?: InputMaybe<AttendancePagination>;
};


export type QueryGetClientProgressRatingsArgs = {
  clientId: Scalars['ID']['input'];
};


export type QueryGetClientRequestsArgs = {
  clientId: Scalars['ID']['input'];
  status?: InputMaybe<CoachRequestStatus>;
};


export type QueryGetClientSessionsArgs = {
  clientId: Scalars['ID']['input'];
  status?: InputMaybe<SessionStatus>;
};


export type QueryGetCoachProgressRatingsArgs = {
  coachId: Scalars['ID']['input'];
};


export type QueryGetCoachRatingBySessionLogArgs = {
  sessionLogId: Scalars['ID']['input'];
};


export type QueryGetCoachRatingsArgs = {
  coachId: Scalars['ID']['input'];
};


export type QueryGetCoachRequestsArgs = {
  coachId: Scalars['ID']['input'];
  status?: InputMaybe<CoachRequestStatus>;
};


export type QueryGetCoachSessionLogsArgs = {
  coachId: Scalars['ID']['input'];
};


export type QueryGetCoachSessionsArgs = {
  coachId: Scalars['ID']['input'];
  status?: InputMaybe<SessionStatus>;
};


export type QueryGetEquipmentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetGoalArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetGoalsArgs = {
  clientId: Scalars['ID']['input'];
  status?: InputMaybe<GoalStatus>;
};


export type QueryGetMembershipArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetMembershipTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetMembershipsArgs = {
  status?: InputMaybe<MembershipStatus>;
};


export type QueryGetProgressRatingsArgs = {
  clientId: Scalars['ID']['input'];
  goalId: Scalars['ID']['input'];
};


export type QueryGetRevenueSummaryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};


export type QueryGetSessionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSessionLogBySessionIdArgs = {
  sessionId: Scalars['ID']['input'];
};


export type QueryGetSessionLogsArgs = {
  clientId: Scalars['ID']['input'];
};


export type QueryGetSessionLogsForRatingArgs = {
  clientId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  goalId: Scalars['ID']['input'];
  startDate: Scalars['String']['input'];
};


export type QueryGetSessionTemplatesArgs = {
  coachId: Scalars['ID']['input'];
};


export type QueryGetSubscriptionRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUsersArgs = {
  role?: InputMaybe<RoleType>;
};


export type QueryGetWeightProgressArgs = {
  clientId: Scalars['ID']['input'];
  goalId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryGetWeightProgressChartArgs = {
  clientId: Scalars['ID']['input'];
  goalId?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySearchWalkInClientsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWalkInAccountsOverviewArgs = {
  pagination?: InputMaybe<WalkInPagination>;
};


export type QueryWalkInAttendanceLogsArgs = {
  filter: WalkInLogsFilter;
  pagination?: InputMaybe<WalkInPagination>;
};


export type QueryWalkInLogsByClientArgs = {
  pagination?: InputMaybe<WalkInPagination>;
  walkInClientId: Scalars['ID']['input'];
};

export type RejectSubscriptionRequestInput = {
  requestId: Scalars['ID']['input'];
};

export type RevenueSummary = {
  __typename?: 'RevenueSummary';
  activeSubscriptions: Scalars['Int']['output'];
  canceledSubscriptions: Scalars['Int']['output'];
  expiredSubscriptions: Scalars['Int']['output'];
  membershipSubscriptionRevenue: Scalars['Float']['output'];
  newSubscriptions: Scalars['Int']['output'];
  revenueByMembership: Array<MembershipRevenue>;
  revenueByPeriod: Array<PeriodRevenue>;
  totalRevenue: Scalars['Float']['output'];
  walkInRevenue: Scalars['Float']['output'];
};

export type RoleType =
  | 'admin'
  | 'coach'
  | 'member';

export type Session = {
  __typename?: 'Session';
  clients?: Maybe<Array<User>>;
  clientsIds: Array<Scalars['ID']['output']>;
  coach?: Maybe<User>;
  coachId: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  date: Scalars['String']['output'];
  endTime?: Maybe<Scalars['String']['output']>;
  enrollments: Array<ClassEnrollment>;
  goal?: Maybe<Goal>;
  goalId?: Maybe<Scalars['ID']['output']>;
  gymArea: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isTemplate?: Maybe<Scalars['Boolean']['output']>;
  maxParticipants?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  note?: Maybe<Scalars['String']['output']>;
  sessionKind: SessionKind;
  startTime: Scalars['String']['output'];
  status: SessionStatus;
  templateId?: Maybe<Scalars['ID']['output']>;
  time?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  workoutType?: Maybe<Scalars['String']['output']>;
};

export type SessionKind =
  | 'group_class'
  | 'personal';

export type SessionLog = {
  __typename?: 'SessionLog';
  client?: Maybe<User>;
  clientConfirmed: Scalars['Boolean']['output'];
  clientId: Scalars['ID']['output'];
  coach?: Maybe<User>;
  coachConfirmed: Scalars['Boolean']['output'];
  coachId: Scalars['ID']['output'];
  completedAt?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  progressImages?: Maybe<ProgressImages>;
  session?: Maybe<Session>;
  sessionId: Scalars['ID']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  weight?: Maybe<Scalars['Float']['output']>;
};

export type SessionStatus =
  | 'cancelled'
  | 'completed'
  | 'scheduled';

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['Boolean']['output']>;
  attendanceRecordAdded: AttendanceRecord;
  attendanceUpdated: Array<AttendanceRecord>;
  membershipsUpdated: Array<Membership>;
  revenueSummaryUpdated: RevenueSummary;
  usersUpdated: Array<User>;
};


export type SubscriptionRevenueSummaryUpdatedArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};


export type SubscriptionUsersUpdatedArgs = {
  role?: InputMaybe<RoleType>;
};

export type SubscriptionRequest = {
  __typename?: 'SubscriptionRequest';
  approvedAt?: Maybe<Scalars['String']['output']>;
  approvedBy?: Maybe<User>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  member?: Maybe<User>;
  memberId: Scalars['ID']['output'];
  membership?: Maybe<Membership>;
  membershipId: Scalars['ID']['output'];
  rejectedAt?: Maybe<Scalars['String']['output']>;
  rejectedBy?: Maybe<User>;
  requestedAt: Scalars['String']['output'];
  status: SubscriptionRequestStatus;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type SubscriptionRequestStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type TransactionStatus =
  | 'ACTIVE'
  | 'CANCELED'
  | 'EXPIRED';

export type UpdateCoachRequestInput = {
  status: CoachRequestStatus;
};

export type UpdateEquipmentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<EquipmentStatus>;
};

export type UpdateGoalInput = {
  currentWeight?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  goalType?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<GoalStatus>;
  targetDate?: InputMaybe<Scalars['String']['input']>;
  targetWeight?: InputMaybe<Scalars['Float']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMembershipInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  durationType?: InputMaybe<DurationType>;
  features?: InputMaybe<Array<Scalars['String']['input']>>;
  monthDuration?: InputMaybe<Scalars['Int']['input']>;
  monthlyPrice?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MembershipStatus>;
};

export type UpdateMembershipTransactionDurationInput = {
  /** New total months from the transaction's startedAt (recalculates expiresAt). */
  monthDuration: Scalars['Int']['input'];
  transactionId: Scalars['ID']['input'];
};

export type UpdateProgressRatingInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
  sessionLogIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  verdict?: InputMaybe<ProgressVerdict>;
};

export type UpdateSessionInput = {
  date?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  gymArea?: InputMaybe<Scalars['String']['input']>;
  maxParticipants?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<SessionStatus>;
  workoutType?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  agreedToLiabilityWaiver?: InputMaybe<Scalars['Boolean']['input']>;
  agreedToPrivacyPolicy?: InputMaybe<Scalars['Boolean']['input']>;
  agreedToTermsAndConditions?: InputMaybe<Scalars['Boolean']['input']>;
  guardianIdVerificationPhotoUrl?: InputMaybe<Scalars['String']['input']>;
  minorLiabilityWaiverPrintedName?: InputMaybe<Scalars['String']['input']>;
  minorLiabilityWaiverSignatureUrl?: InputMaybe<Scalars['String']['input']>;
  coachDetails?: InputMaybe<CoachDetailsInput>;
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  heardFrom?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  membershipDetails?: InputMaybe<MemberDetailsInput>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWalkInClientInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  gender: WalkInGender;
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  agreedToLiabilityWaiver?: Maybe<Scalars['Boolean']['output']>;
  agreedToPrivacyPolicy?: Maybe<Scalars['Boolean']['output']>;
  agreedToTermsAndConditions?: Maybe<Scalars['Boolean']['output']>;
  guardianIdVerificationPhotoUrl?: Maybe<Scalars['String']['output']>;
  minorLiabilityWaiverPrintedName?: Maybe<Scalars['String']['output']>;
  minorLiabilityWaiverSignatureUrl?: Maybe<Scalars['String']['output']>;
  attendanceId?: Maybe<Scalars['Int']['output']>;
  coachDetails?: Maybe<CoachDetails>;
  createdAt?: Maybe<Scalars['String']['output']>;
  currentMembership?: Maybe<MembershipTransaction>;
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender: Scalars['String']['output'];
  heardFrom?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  loginHistory?: Maybe<Array<Maybe<LoginHistoryEntry>>>;
  membershipDetails?: Maybe<MemberDetails>;
  middleName?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  role: RoleType;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type WalkInAccountRow = {
  __typename?: 'WalkInAccountRow';
  client: WalkInClient;
  /** Total number of time-in attendance records for this walk-in profile. */
  timeInCount: Scalars['Int']['output'];
};

export type WalkInAccountsOverview = {
  __typename?: 'WalkInAccountsOverview';
  rows: Array<WalkInAccountRow>;
  /** Total time-in log rows across all walk-ins. */
  totalTimeInRecords: Scalars['Int']['output'];
  /** Total walk-in profiles in the system. */
  totalWalkInAccounts: Scalars['Int']['output'];
};

export type WalkInAttendanceLog = {
  __typename?: 'WalkInAttendanceLog';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  localDate: Scalars['String']['output'];
  /** Walk-in fee (PHP) recorded at time-in. */
  payment: Scalars['Float']['output'];
  timedInAt: Scalars['String']['output'];
  walkInClient: WalkInClient;
};

export type WalkInClient = {
  __typename?: 'WalkInClient';
  createdAt: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  gender: WalkInGender;
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  middleName?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type WalkInGender =
  | 'FEMALE'
  | 'MALE'
  | 'NON_BINARY'
  | 'PREFER_NOT_TO_SAY';

export type WalkInLogsConnection = {
  __typename?: 'WalkInLogsConnection';
  logs: Array<WalkInAttendanceLog>;
  totalCount: Scalars['Int']['output'];
};

export type WalkInLogsFilter = {
  /** YYYY-MM-DD (Asia/Manila calendar date) */
  date: Scalars['String']['input'];
};

export type WalkInPagination = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type WalkInPaymentSettings = {
  __typename?: 'WalkInPaymentSettings';
  /** Default PHP amount applied to each new time-in (admin-configurable). */
  defaultPaymentPesos: Scalars['Float']['output'];
};

export type WalkInStats = {
  __typename?: 'WalkInStats';
  totalTimeInRecords: Scalars['Int']['output'];
  totalWalkInAccounts: Scalars['Int']['output'];
};

export type WeightProgress = {
  __typename?: 'WeightProgress';
  date: Scalars['String']['output'];
  sessionId?: Maybe<Scalars['ID']['output']>;
  sessionLogId?: Maybe<Scalars['ID']['output']>;
  weight: Scalars['Float']['output'];
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthResponse', token: string, user: { __typename?: 'User', id: string, firstName: string, middleName?: string | null, lastName: string, email: string, role: RoleType, phoneNumber?: string | null, dateOfBirth?: string | null, gender: string, heardFrom?: Array<string | null> | null, agreedToTermsAndConditions?: boolean | null, agreedToPrivacyPolicy?: boolean | null, agreedToLiabilityWaiver?: boolean | null, guardianIdVerificationPhotoUrl?: string | null, minorLiabilityWaiverPrintedName?: string | null, minorLiabilityWaiverSignatureUrl?: string | null, attendanceId?: number | null, createdAt?: string | null, updatedAt?: string | null, membershipDetails?: { __typename?: 'MemberDetails', membershipId?: string | null, physiqueGoalType: string, fitnessGoal?: Array<string> | null, workOutTime?: Array<string | null> | null, coachesIds?: Array<string | null> | null, hasEnteredDetails?: boolean | null } | null, coachDetails?: { __typename?: 'CoachDetails', clientsIds?: Array<string | null> | null, sessionsIds?: Array<string | null> | null, specialization?: Array<string> | null, ratings?: number | null, yearsOfExperience?: number | null, moreDetails?: string | null, teachingDate?: Array<string | null> | null, teachingTime?: Array<string | null> | null } | null } } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'AuthResponse', token: string, user: { __typename?: 'User', id: string, firstName: string, middleName?: string | null, lastName: string, email: string, role: RoleType, phoneNumber?: string | null, dateOfBirth?: string | null, gender: string, heardFrom?: Array<string | null> | null, agreedToTermsAndConditions?: boolean | null, agreedToPrivacyPolicy?: boolean | null, agreedToLiabilityWaiver?: boolean | null, guardianIdVerificationPhotoUrl?: string | null, minorLiabilityWaiverPrintedName?: string | null, minorLiabilityWaiverSignatureUrl?: string | null, attendanceId?: number | null, createdAt?: string | null, updatedAt?: string | null, membershipDetails?: { __typename?: 'MemberDetails', membershipId?: string | null, physiqueGoalType: string, fitnessGoal?: Array<string> | null, workOutTime?: Array<string | null> | null, coachesIds?: Array<string | null> | null, hasEnteredDetails?: boolean | null } | null, coachDetails?: { __typename?: 'CoachDetails', clientsIds?: Array<string | null> | null, sessionsIds?: Array<string | null> | null, specialization?: Array<string> | null, ratings?: number | null, yearsOfExperience?: number | null, moreDetails?: string | null, teachingDate?: Array<string | null> | null, teachingTime?: Array<string | null> | null } | null } } };

export type CreateSessionMutationVariables = Exact<{
  input: CreateSessionInput;
}>;


export type CreateSessionMutation = { __typename?: 'Mutation', createSession: { __typename?: 'Session', id: string, coachId: string, clientsIds: Array<string>, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus, templateId?: string | null, goalId?: string | null, isTemplate?: boolean | null, sessionKind: SessionKind, maxParticipants?: number | null, createdAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string }> | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus, createdAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null }> } };

export type InviteClientsToClassSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  clientIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type InviteClientsToClassSessionMutation = { __typename?: 'Mutation', inviteClientsToClassSession: { __typename?: 'Session', id: string, sessionKind: SessionKind, maxParticipants?: number | null, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus, client?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }>, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string }> | null } };

export type CoachRespondToJoinRequestMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  clientId: Scalars['ID']['input'];
  accept: Scalars['Boolean']['input'];
}>;


export type CoachRespondToJoinRequestMutation = { __typename?: 'Mutation', coachRespondToJoinRequest: { __typename?: 'Session', id: string, clientsIds: Array<string>, maxParticipants?: number | null, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus, client?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }>, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string }> | null } };

export type RemoveClientFromClassSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  clientId: Scalars['ID']['input'];
}>;


export type RemoveClientFromClassSessionMutation = { __typename?: 'Mutation', removeClientFromClassSession: { __typename?: 'Session', id: string, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus, client?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }>, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string }> | null } };

export type LeaveClassSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;


export type LeaveClassSessionMutation = { __typename?: 'Mutation', leaveClassSession: { __typename?: 'Session', id: string, clientsIds: Array<string>, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus }> } };

export type RequestToJoinClassSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;


export type RequestToJoinClassSessionMutation = { __typename?: 'Mutation', requestToJoinClassSession: { __typename?: 'Session', id: string, name: string, sessionKind: SessionKind, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus }> } };

export type RespondToClassInvitationMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  accept: Scalars['Boolean']['input'];
}>;


export type RespondToClassInvitationMutation = { __typename?: 'Mutation', respondToClassInvitation: { __typename?: 'Session', id: string, sessionKind: SessionKind, clientsIds: Array<string>, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus }> } };

export type CreateSessionFromTemplateMutationVariables = Exact<{
  input: CreateSessionFromTemplateInput;
}>;


export type CreateSessionFromTemplateMutation = { __typename?: 'Mutation', createSessionFromTemplate: { __typename?: 'Session', id: string, coachId: string, clientsIds: Array<string>, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus, templateId?: string | null, goalId?: string | null, createdAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string }> | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null } };

export type UpdateSessionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSessionInput;
}>;


export type UpdateSessionMutation = { __typename?: 'Mutation', updateSession: { __typename?: 'Session', id: string, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus } };

export type CancelSessionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CancelSessionMutation = { __typename?: 'Mutation', cancelSession: boolean };

export type CompleteSessionMutationVariables = Exact<{
  input: CreateSessionLogInput;
}>;


export type CompleteSessionMutation = { __typename?: 'Mutation', completeSession: { __typename?: 'SessionLog', id: string, sessionId: string, clientId: string, coachId: string, weight?: number | null, clientConfirmed: boolean, coachConfirmed: boolean, notes?: string | null, completedAt?: string | null, progressImages?: { __typename?: 'ProgressImages', front?: string | null, rightSide?: string | null, leftSide?: string | null, back?: string | null } | null } };

export type CreateCoachRatingMutationVariables = Exact<{
  input: CreateCoachRatingInput;
}>;


export type CreateCoachRatingMutation = { __typename?: 'Mutation', createCoachRating: { __typename?: 'CoachRating', id: string, coachId: string, clientId: string, sessionLogId: string, rating: number, comment?: string | null, createdAt?: string | null } };

export type ConfirmSessionCompletionMutationVariables = Exact<{
  input: ConfirmSessionCompletionInput;
}>;


export type ConfirmSessionCompletionMutation = { __typename?: 'Mutation', confirmSessionCompletion: { __typename?: 'SessionLog', id: string, clientConfirmed: boolean, coachConfirmed: boolean } };

export type ClientConfirmWeightMutationVariables = Exact<{
  sessionLogId: Scalars['ID']['input'];
}>;


export type ClientConfirmWeightMutation = { __typename?: 'Mutation', clientConfirmWeight: { __typename?: 'SessionLog', id: string, clientConfirmed: boolean, coachConfirmed: boolean } };

export type CreateGoalMutationVariables = Exact<{
  input: CreateGoalInput;
}>;


export type CreateGoalMutation = { __typename?: 'Mutation', createGoal: { __typename?: 'Goal', id: string, clientId: string, goalType: string, title: string, description?: string | null, targetWeight?: number | null, currentWeight?: number | null, targetDate?: string | null, status: GoalStatus, createdAt?: string | null } };

export type UpdateGoalMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGoalInput;
}>;


export type UpdateGoalMutation = { __typename?: 'Mutation', updateGoal: { __typename?: 'Goal', id: string, goalType: string, title: string, description?: string | null, targetWeight?: number | null, currentWeight?: number | null, targetDate?: string | null, status: GoalStatus } };

export type DeleteGoalMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteGoalMutation = { __typename?: 'Mutation', deleteGoal: boolean };

export type AssignCoachToGoalMutationVariables = Exact<{
  goalId: Scalars['ID']['input'];
}>;


export type AssignCoachToGoalMutation = { __typename?: 'Mutation', assignCoachToGoal: { __typename?: 'Goal', id: string, clientId: string, coachId?: string | null, goalType: string, title: string, description?: string | null, targetWeight?: number | null, currentWeight?: number | null, targetDate?: string | null, status: GoalStatus, createdAt?: string | null, updatedAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null } };

export type PurchaseMembershipMutationVariables = Exact<{
  input: PurchaseMembershipInput;
}>;


export type PurchaseMembershipMutation = { __typename?: 'Mutation', purchaseMembership: { __typename?: 'MembershipTransaction', id: string, clientId: string, membershipId: string, priceAtPurchase: number, startedAt: string, expiresAt: string, status: TransactionStatus, membership?: { __typename?: 'Membership', id: string, name: string, monthlyPrice: number, features: Array<string> } | null } };

export type CancelMembershipMutationVariables = Exact<{
  transactionId: Scalars['ID']['input'];
}>;


export type CancelMembershipMutation = { __typename?: 'Mutation', cancelMembership: boolean };

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser?: { __typename?: 'User', id: string, firstName: string, middleName?: string | null, lastName: string, email: string, role: RoleType, phoneNumber?: string | null, dateOfBirth?: string | null, gender: string, heardFrom?: Array<string | null> | null, agreedToTermsAndConditions?: boolean | null, agreedToPrivacyPolicy?: boolean | null, agreedToLiabilityWaiver?: boolean | null, guardianIdVerificationPhotoUrl?: string | null, minorLiabilityWaiverPrintedName?: string | null, minorLiabilityWaiverSignatureUrl?: string | null, createdAt?: string | null, updatedAt?: string | null, membershipDetails?: { __typename?: 'MemberDetails', membershipId?: string | null, physiqueGoalType: string, fitnessGoal?: Array<string> | null, workOutTime?: Array<string | null> | null, coachesIds?: Array<string | null> | null, hasEnteredDetails?: boolean | null } | null, coachDetails?: { __typename?: 'CoachDetails', clientsIds?: Array<string | null> | null, sessionsIds?: Array<string | null> | null, specialization?: Array<string> | null, ratings?: number | null, yearsOfExperience?: number | null, moreDetails?: string | null, teachingDate?: Array<string | null> | null, teachingTime?: Array<string | null> | null, clientLimit?: number | null } | null } | null };

export type CreateCoachRequestMutationVariables = Exact<{
  input: CreateCoachRequestInput;
}>;


export type CreateCoachRequestMutation = { __typename?: 'Mutation', createCoachRequest: { __typename?: 'CoachRequest', id: string, clientId: string, coachId: string, status: CoachRequestStatus, message?: string | null, createdAt?: string | null, updatedAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } };

export type UpdateCoachRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateCoachRequestInput;
}>;


export type UpdateCoachRequestMutation = { __typename?: 'Mutation', updateCoachRequest: { __typename?: 'CoachRequest', id: string, clientId: string, coachId: string, status: CoachRequestStatus, message?: string | null, createdAt?: string | null, updatedAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } };

export type CancelCoachRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CancelCoachRequestMutation = { __typename?: 'Mutation', cancelCoachRequest: boolean };

export type RemoveClientMutationVariables = Exact<{
  clientId: Scalars['ID']['input'];
}>;


export type RemoveClientMutation = { __typename?: 'Mutation', removeClient: boolean };

export type CreateSubscriptionRequestMutationVariables = Exact<{
  input: CreateSubscriptionRequestInput;
}>;


export type CreateSubscriptionRequestMutation = { __typename?: 'Mutation', createSubscriptionRequest: { __typename?: 'SubscriptionRequest', id: string, memberId: string, membershipId: string, status: SubscriptionRequestStatus, requestedAt: string, createdAt?: string | null, membership?: { __typename?: 'Membership', id: string, name: string, monthlyPrice: number, description?: string | null, features: Array<string>, durationType: DurationType, monthDuration: number } | null } };

export type CreateProgressRatingMutationVariables = Exact<{
  input: CreateProgressRatingInput;
}>;


export type CreateProgressRatingMutation = { __typename?: 'Mutation', createProgressRating: { __typename?: 'ProgressRating', id: string, coachId: string, clientId: string, goalId: string, startDate: string, endDate: string, rating: number, comment: string, verdict: ProgressVerdict, sessionLogIds: Array<string>, createdAt?: string | null } };

export type UpdateProgressRatingMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateProgressRatingInput;
}>;


export type UpdateProgressRatingMutation = { __typename?: 'Mutation', updateProgressRating: { __typename?: 'ProgressRating', id: string, rating: number, comment: string, verdict: ProgressVerdict, sessionLogIds: Array<string>, updatedAt?: string | null } };

export type DeleteProgressRatingMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProgressRatingMutation = { __typename?: 'Mutation', deleteProgressRating: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, firstName: string, middleName?: string | null, lastName: string, email: string, role: RoleType, phoneNumber?: string | null, dateOfBirth?: string | null, gender: string, heardFrom?: Array<string | null> | null, agreedToTermsAndConditions?: boolean | null, agreedToPrivacyPolicy?: boolean | null, agreedToLiabilityWaiver?: boolean | null, guardianIdVerificationPhotoUrl?: string | null, minorLiabilityWaiverPrintedName?: string | null, minorLiabilityWaiverSignatureUrl?: string | null, attendanceId?: number | null, createdAt?: string | null, updatedAt?: string | null, membershipDetails?: { __typename?: 'MemberDetails', membershipId?: string | null, physiqueGoalType: string, fitnessGoal?: Array<string> | null, workOutTime?: Array<string | null> | null, coachesIds?: Array<string | null> | null, hasEnteredDetails?: boolean | null, facilityBiometricEnrollmentComplete?: boolean | null } | null, coachDetails?: { __typename?: 'CoachDetails', clientsIds?: Array<string | null> | null, sessionsIds?: Array<string | null> | null, specialization?: Array<string> | null, ratings?: number | null, yearsOfExperience?: number | null, moreDetails?: string | null, teachingDate?: Array<string | null> | null, teachingTime?: Array<string | null> | null, clientLimit?: number | null } | null } | null };

export type GetCoachSessionsQueryVariables = Exact<{
  coachId: Scalars['ID']['input'];
  status?: InputMaybe<SessionStatus>;
}>;


export type GetCoachSessionsQuery = { __typename?: 'Query', getCoachSessions: Array<{ __typename?: 'Session', id: string, coachId: string, clientsIds: Array<string>, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus, templateId?: string | null, goalId?: string | null, isTemplate?: boolean | null, sessionKind: SessionKind, maxParticipants?: number | null, createdAt?: string | null, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string }> | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus, createdAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null }> }> };

export type GetJoinableGroupClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetJoinableGroupClassesQuery = { __typename?: 'Query', getJoinableGroupClasses: Array<{ __typename?: 'Session', id: string, coachId: string, name: string, date: string, startTime: string, endTime?: string | null, gymArea: string, maxParticipants?: number | null, clientsIds: Array<string>, sessionKind: SessionKind, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }> };

export type GetClientSessionsQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
  status?: InputMaybe<SessionStatus>;
}>;


export type GetClientSessionsQuery = { __typename?: 'Query', getClientSessions: Array<{ __typename?: 'Session', id: string, coachId: string, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus, goalId?: string | null, sessionKind: SessionKind, maxParticipants?: number | null, clientsIds: Array<string>, createdAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string, currentWeight?: number | null, targetWeight?: number | null } | null, enrollments: Array<{ __typename?: 'ClassEnrollment', clientId: string, status: ClassEnrollmentStatus, createdAt?: string | null }> }> };

export type GetUsersQueryVariables = Exact<{
  role?: InputMaybe<RoleType>;
}>;


export type GetUsersQuery = { __typename?: 'Query', getUsers?: Array<{ __typename?: 'User', id: string, firstName: string, middleName?: string | null, lastName: string, email: string, role: RoleType, phoneNumber?: string | null, membershipDetails?: { __typename?: 'MemberDetails', membershipId?: string | null, physiqueGoalType: string, fitnessGoal?: Array<string> | null, workOutTime?: Array<string | null> | null, coachesIds?: Array<string | null> | null } | null, coachDetails?: { __typename?: 'CoachDetails', clientsIds?: Array<string | null> | null, sessionsIds?: Array<string | null> | null, specialization?: Array<string> | null, ratings?: number | null, yearsOfExperience?: number | null, moreDetails?: string | null, teachingDate?: Array<string | null> | null, teachingTime?: Array<string | null> | null, clientLimit?: number | null } | null } | null> | null };

export type GetPendingCoachRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPendingCoachRequestsQuery = { __typename?: 'Query', getPendingCoachRequests: Array<{ __typename?: 'CoachRequest', id: string, clientId: string, coachId: string, status: CoachRequestStatus, message?: string | null, createdAt?: string | null, updatedAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }> };

export type GetUpcomingSessionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUpcomingSessionsQuery = { __typename?: 'Query', getUpcomingSessions: Array<{ __typename?: 'Session', id: string, coachId: string, clientsIds: Array<string>, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus, goalId?: string | null, createdAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string }> | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null }> };

export type GetGoalsQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
  status?: InputMaybe<GoalStatus>;
}>;


export type GetGoalsQuery = { __typename?: 'Query', getGoals: Array<{ __typename?: 'Goal', id: string, clientId: string, coachId?: string | null, goalType: string, title: string, description?: string | null, targetWeight?: number | null, currentWeight?: number | null, targetDate?: string | null, status: GoalStatus, createdAt?: string | null, updatedAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null }> };

export type GetCurrentMembershipQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentMembershipQuery = { __typename?: 'Query', getCurrentMembership?: { __typename?: 'MembershipTransaction', id: string, clientId: string, membershipId: string, priceAtPurchase: number, startedAt: string, expiresAt: string, monthDuration: number, status: TransactionStatus, membership?: { __typename?: 'Membership', id: string, name: string, monthlyPrice: number, description?: string | null, features: Array<string>, durationType: DurationType, monthDuration: number } | null } | null };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', getUser?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string, role: RoleType, phoneNumber?: string | null, attendanceId?: number | null, membershipDetails?: { __typename?: 'MemberDetails', membershipId?: string | null, physiqueGoalType: string, fitnessGoal?: Array<string> | null, workOutTime?: Array<string | null> | null, coachesIds?: Array<string | null> | null, hasEnteredDetails?: boolean | null, facilityBiometricEnrollmentComplete?: boolean | null } | null, coachDetails?: { __typename?: 'CoachDetails', clientsIds?: Array<string | null> | null, sessionsIds?: Array<string | null> | null, specialization?: Array<string> | null, ratings?: number | null, yearsOfExperience?: number | null, moreDetails?: string | null, teachingDate?: Array<string | null> | null, teachingTime?: Array<string | null> | null, clientLimit?: number | null } | null } | null };

export type GetAllClientGoalsQueryVariables = Exact<{
  coachId: Scalars['ID']['input'];
  status?: InputMaybe<GoalStatus>;
}>;


export type GetAllClientGoalsQuery = { __typename?: 'Query', getAllClientGoals: Array<{ __typename?: 'Goal', id: string, clientId: string, coachId?: string | null, goalType: string, title: string, description?: string | null, targetWeight?: number | null, currentWeight?: number | null, targetDate?: string | null, status: GoalStatus, createdAt?: string | null, updatedAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null }> };

export type GetSessionTemplatesQueryVariables = Exact<{
  coachId: Scalars['ID']['input'];
}>;


export type GetSessionTemplatesQuery = { __typename?: 'Query', getSessionTemplates: Array<{ __typename?: 'Session', id: string, coachId: string, name: string, workoutType?: string | null, gymArea: string, note?: string | null, goalId?: string | null, isTemplate?: boolean | null, createdAt?: string | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null }> };

export type GetSessionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSessionQuery = { __typename?: 'Query', getSession?: { __typename?: 'Session', id: string, coachId: string, clientsIds: Array<string>, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus, templateId?: string | null, goalId?: string | null, isTemplate?: boolean | null, createdAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string }> | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null } | null };

export type GetSessionLogsQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
}>;


export type GetSessionLogsQuery = { __typename?: 'Query', getSessionLogs: Array<{ __typename?: 'SessionLog', id: string, sessionId: string, clientId: string, coachId: string, weight?: number | null, clientConfirmed: boolean, coachConfirmed: boolean, notes?: string | null, completedAt?: string | null, createdAt?: string | null, updatedAt?: string | null, session?: { __typename?: 'Session', id: string, name: string, workoutType?: string | null, date: string, startTime: string, endTime?: string | null, gymArea: string, note?: string | null, status: SessionStatus, createdAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, clients?: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string }> | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null } | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, progressImages?: { __typename?: 'ProgressImages', front?: string | null, rightSide?: string | null, leftSide?: string | null, back?: string | null } | null }> };

export type GetCoachSessionLogsQueryVariables = Exact<{
  coachId: Scalars['ID']['input'];
}>;


export type GetCoachSessionLogsQuery = { __typename?: 'Query', getCoachSessionLogs: Array<{ __typename?: 'SessionLog', id: string, sessionId: string, clientId: string, weight?: number | null, clientConfirmed: boolean, coachConfirmed: boolean, notes?: string | null, completedAt?: string | null, createdAt?: string | null, session?: { __typename?: 'Session', id: string, name: string, date: string, startTime: string, endTime?: string | null, gymArea: string, goalId?: string | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null } | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, progressImages?: { __typename?: 'ProgressImages', front?: string | null, rightSide?: string | null, leftSide?: string | null, back?: string | null } | null }> };

export type GetSessionLogBySessionIdQueryVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;


export type GetSessionLogBySessionIdQuery = { __typename?: 'Query', getSessionLogBySessionId?: { __typename?: 'SessionLog', id: string, sessionId: string, clientId: string, weight?: number | null, clientConfirmed: boolean, coachConfirmed: boolean, notes?: string | null, completedAt?: string | null, createdAt?: string | null, session?: { __typename?: 'Session', id: string, name: string, date: string, startTime: string } | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, progressImages?: { __typename?: 'ProgressImages', front?: string | null, rightSide?: string | null, leftSide?: string | null, back?: string | null } | null } | null };

export type GetWeightProgressQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
  goalId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetWeightProgressQuery = { __typename?: 'Query', getWeightProgress: Array<{ __typename?: 'SessionLog', id: string, weight?: number | null, completedAt?: string | null, session?: { __typename?: 'Session', id: string, name: string, date: string } | null }> };

export type GetGoalQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetGoalQuery = { __typename?: 'Query', getGoal?: { __typename?: 'Goal', id: string, clientId: string, coachId?: string | null, goalType: string, title: string, description?: string | null, targetWeight?: number | null, currentWeight?: number | null, targetDate?: string | null, status: GoalStatus, createdAt?: string | null, updatedAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null } | null };

export type GetWeightProgressChartQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
  goalId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetWeightProgressChartQuery = { __typename?: 'Query', getWeightProgressChart: Array<{ __typename?: 'WeightProgress', date: string, weight: number, sessionId?: string | null, sessionLogId?: string | null }> };

export type GetMembershipsQueryVariables = Exact<{
  status?: InputMaybe<MembershipStatus>;
}>;


export type GetMembershipsQuery = { __typename?: 'Query', getMemberships: Array<{ __typename?: 'Membership', id: string, name: string, monthlyPrice: number, description?: string | null, features: Array<string>, status: MembershipStatus, durationType: DurationType, monthDuration: number }> };

export type GetMembershipQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetMembershipQuery = { __typename?: 'Query', getMembership?: { __typename?: 'Membership', id: string, name: string, monthlyPrice: number, description?: string | null, features: Array<string>, status: MembershipStatus, durationType: DurationType, monthDuration: number } | null };

export type GetCoachRequestsQueryVariables = Exact<{
  coachId: Scalars['ID']['input'];
  status?: InputMaybe<CoachRequestStatus>;
}>;


export type GetCoachRequestsQuery = { __typename?: 'Query', getCoachRequests: Array<{ __typename?: 'CoachRequest', id: string, clientId: string, coachId: string, status: CoachRequestStatus, message?: string | null, createdAt?: string | null, updatedAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }> };

export type GetSessionLogsForRatingQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
  goalId: Scalars['ID']['input'];
  startDate: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
}>;


export type GetSessionLogsForRatingQuery = { __typename?: 'Query', getSessionLogsForRating: Array<{ __typename?: 'SessionLog', id: string, sessionId: string, clientId: string, weight?: number | null, completedAt?: string | null, session?: { __typename?: 'Session', id: string, name: string, date: string, startTime: string, endTime?: string | null, gymArea: string, goalId?: string | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null } | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, progressImages?: { __typename?: 'ProgressImages', front?: string | null, rightSide?: string | null, leftSide?: string | null, back?: string | null } | null }> };

export type GetProgressRatingsQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
  goalId: Scalars['ID']['input'];
}>;


export type GetProgressRatingsQuery = { __typename?: 'Query', getProgressRatings: Array<{ __typename?: 'ProgressRating', id: string, coachId: string, clientId: string, goalId: string, startDate: string, endDate: string, rating: number, comment: string, verdict: ProgressVerdict, sessionLogIds: Array<string>, createdAt?: string | null, updatedAt?: string | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, goal?: { __typename?: 'Goal', id: string, title: string, goalType: string } | null }> };

export type GetCoachRatingsQueryVariables = Exact<{
  coachId: Scalars['ID']['input'];
}>;


export type GetCoachRatingsQuery = { __typename?: 'Query', getCoachRatings: Array<{ __typename?: 'CoachRating', id: string, coachId: string, clientId: string, sessionLogId: string, rating: number, comment?: string | null, createdAt?: string | null, updatedAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }> };

export type GetClientRequestsQueryVariables = Exact<{
  clientId: Scalars['ID']['input'];
  status?: InputMaybe<CoachRequestStatus>;
}>;


export type GetClientRequestsQuery = { __typename?: 'Query', getClientRequests: Array<{ __typename?: 'CoachRequest', id: string, clientId: string, coachId: string, status: CoachRequestStatus, message?: string | null, createdAt?: string | null, updatedAt?: string | null, client?: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } | null, coach?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }> };

export type GetMySubscriptionRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMySubscriptionRequestsQuery = { __typename?: 'Query', getMySubscriptionRequests: Array<{ __typename?: 'SubscriptionRequest', id: string, memberId: string, membershipId: string, status: SubscriptionRequestStatus, requestedAt: string, approvedAt?: string | null, rejectedAt?: string | null, createdAt?: string | null, updatedAt?: string | null, membership?: { __typename?: 'Membership', id: string, name: string, monthlyPrice: number, description?: string | null, features: Array<string>, durationType: DurationType, monthDuration: number } | null }> };

export type GetFitnessGoalTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFitnessGoalTypesQuery = { __typename?: 'Query', getFitnessGoalTypes: Array<string> };

export type GetAttendanceRecordsQueryVariables = Exact<{
  filter?: InputMaybe<AttendanceFilter>;
  pagination?: InputMaybe<AttendancePagination>;
}>;


export type GetAttendanceRecordsQuery = { __typename?: 'Query', getAttendanceRecords: { __typename?: 'AttendanceConnection', totalCount: number, hasMore: boolean, records: Array<{ __typename?: 'AttendanceRecord', id: string, authDateTime: string, authDate: string, authTime: string, direction: string, deviceName: string, deviceSerNum: string, personName: string, cardNo?: string | null }> } };

export type GetEquipmentsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEquipmentsQuery = { __typename?: 'Query', getEquipments: Array<{ __typename?: 'Equipment', id: string, name: string, imageUrl: string, description?: string | null, notes?: string | null, sortOrder: number, status: EquipmentStatus, createdAt?: string | null, updatedAt?: string | null }> };


export const LoginDocument = gql`
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
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const CreateUserDocument = gql`
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
export type CreateUserMutationFn = Apollo.MutationFunction<CreateUserMutation, CreateUserMutationVariables>;

/**
 * __useCreateUserMutation__
 *
 * To run a mutation, you first call `useCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserMutation, { data, loading, error }] = useCreateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, options);
      }
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;
export const CreateSessionDocument = gql`
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
export type CreateSessionMutationFn = Apollo.MutationFunction<CreateSessionMutation, CreateSessionMutationVariables>;

/**
 * __useCreateSessionMutation__
 *
 * To run a mutation, you first call `useCreateSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSessionMutation, { data, loading, error }] = useCreateSessionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateSessionMutation, CreateSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateSessionMutation, CreateSessionMutationVariables>(CreateSessionDocument, options);
      }
export type CreateSessionMutationHookResult = ReturnType<typeof useCreateSessionMutation>;
export type CreateSessionMutationResult = Apollo.MutationResult<CreateSessionMutation>;
export type CreateSessionMutationOptions = Apollo.BaseMutationOptions<CreateSessionMutation, CreateSessionMutationVariables>;
export const InviteClientsToClassSessionDocument = gql`
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
export type InviteClientsToClassSessionMutationFn = Apollo.MutationFunction<InviteClientsToClassSessionMutation, InviteClientsToClassSessionMutationVariables>;

/**
 * __useInviteClientsToClassSessionMutation__
 *
 * To run a mutation, you first call `useInviteClientsToClassSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInviteClientsToClassSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [inviteClientsToClassSessionMutation, { data, loading, error }] = useInviteClientsToClassSessionMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      clientIds: // value for 'clientIds'
 *   },
 * });
 */
export function useInviteClientsToClassSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<InviteClientsToClassSessionMutation, InviteClientsToClassSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<InviteClientsToClassSessionMutation, InviteClientsToClassSessionMutationVariables>(InviteClientsToClassSessionDocument, options);
      }
export type InviteClientsToClassSessionMutationHookResult = ReturnType<typeof useInviteClientsToClassSessionMutation>;
export type InviteClientsToClassSessionMutationResult = Apollo.MutationResult<InviteClientsToClassSessionMutation>;
export type InviteClientsToClassSessionMutationOptions = Apollo.BaseMutationOptions<InviteClientsToClassSessionMutation, InviteClientsToClassSessionMutationVariables>;
export const CoachRespondToJoinRequestDocument = gql`
    mutation CoachRespondToJoinRequest($sessionId: ID!, $clientId: ID!, $accept: Boolean!) {
  coachRespondToJoinRequest(
    sessionId: $sessionId
    clientId: $clientId
    accept: $accept
  ) {
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
export type CoachRespondToJoinRequestMutationFn = Apollo.MutationFunction<CoachRespondToJoinRequestMutation, CoachRespondToJoinRequestMutationVariables>;

/**
 * __useCoachRespondToJoinRequestMutation__
 *
 * To run a mutation, you first call `useCoachRespondToJoinRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCoachRespondToJoinRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [coachRespondToJoinRequestMutation, { data, loading, error }] = useCoachRespondToJoinRequestMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      clientId: // value for 'clientId'
 *      accept: // value for 'accept'
 *   },
 * });
 */
export function useCoachRespondToJoinRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CoachRespondToJoinRequestMutation, CoachRespondToJoinRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CoachRespondToJoinRequestMutation, CoachRespondToJoinRequestMutationVariables>(CoachRespondToJoinRequestDocument, options);
      }
export type CoachRespondToJoinRequestMutationHookResult = ReturnType<typeof useCoachRespondToJoinRequestMutation>;
export type CoachRespondToJoinRequestMutationResult = Apollo.MutationResult<CoachRespondToJoinRequestMutation>;
export type CoachRespondToJoinRequestMutationOptions = Apollo.BaseMutationOptions<CoachRespondToJoinRequestMutation, CoachRespondToJoinRequestMutationVariables>;
export const RemoveClientFromClassSessionDocument = gql`
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
export type RemoveClientFromClassSessionMutationFn = Apollo.MutationFunction<RemoveClientFromClassSessionMutation, RemoveClientFromClassSessionMutationVariables>;

/**
 * __useRemoveClientFromClassSessionMutation__
 *
 * To run a mutation, you first call `useRemoveClientFromClassSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveClientFromClassSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeClientFromClassSessionMutation, { data, loading, error }] = useRemoveClientFromClassSessionMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      clientId: // value for 'clientId'
 *   },
 * });
 */
export function useRemoveClientFromClassSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveClientFromClassSessionMutation, RemoveClientFromClassSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveClientFromClassSessionMutation, RemoveClientFromClassSessionMutationVariables>(RemoveClientFromClassSessionDocument, options);
      }
export type RemoveClientFromClassSessionMutationHookResult = ReturnType<typeof useRemoveClientFromClassSessionMutation>;
export type RemoveClientFromClassSessionMutationResult = Apollo.MutationResult<RemoveClientFromClassSessionMutation>;
export type RemoveClientFromClassSessionMutationOptions = Apollo.BaseMutationOptions<RemoveClientFromClassSessionMutation, RemoveClientFromClassSessionMutationVariables>;
export const LeaveClassSessionDocument = gql`
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
export type LeaveClassSessionMutationFn = Apollo.MutationFunction<LeaveClassSessionMutation, LeaveClassSessionMutationVariables>;

/**
 * __useLeaveClassSessionMutation__
 *
 * To run a mutation, you first call `useLeaveClassSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLeaveClassSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [leaveClassSessionMutation, { data, loading, error }] = useLeaveClassSessionMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useLeaveClassSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LeaveClassSessionMutation, LeaveClassSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LeaveClassSessionMutation, LeaveClassSessionMutationVariables>(LeaveClassSessionDocument, options);
      }
export type LeaveClassSessionMutationHookResult = ReturnType<typeof useLeaveClassSessionMutation>;
export type LeaveClassSessionMutationResult = Apollo.MutationResult<LeaveClassSessionMutation>;
export type LeaveClassSessionMutationOptions = Apollo.BaseMutationOptions<LeaveClassSessionMutation, LeaveClassSessionMutationVariables>;
export const RequestToJoinClassSessionDocument = gql`
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
export type RequestToJoinClassSessionMutationFn = Apollo.MutationFunction<RequestToJoinClassSessionMutation, RequestToJoinClassSessionMutationVariables>;

/**
 * __useRequestToJoinClassSessionMutation__
 *
 * To run a mutation, you first call `useRequestToJoinClassSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestToJoinClassSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestToJoinClassSessionMutation, { data, loading, error }] = useRequestToJoinClassSessionMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useRequestToJoinClassSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RequestToJoinClassSessionMutation, RequestToJoinClassSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RequestToJoinClassSessionMutation, RequestToJoinClassSessionMutationVariables>(RequestToJoinClassSessionDocument, options);
      }
export type RequestToJoinClassSessionMutationHookResult = ReturnType<typeof useRequestToJoinClassSessionMutation>;
export type RequestToJoinClassSessionMutationResult = Apollo.MutationResult<RequestToJoinClassSessionMutation>;
export type RequestToJoinClassSessionMutationOptions = Apollo.BaseMutationOptions<RequestToJoinClassSessionMutation, RequestToJoinClassSessionMutationVariables>;
export const RespondToClassInvitationDocument = gql`
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
export type RespondToClassInvitationMutationFn = Apollo.MutationFunction<RespondToClassInvitationMutation, RespondToClassInvitationMutationVariables>;

/**
 * __useRespondToClassInvitationMutation__
 *
 * To run a mutation, you first call `useRespondToClassInvitationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRespondToClassInvitationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [respondToClassInvitationMutation, { data, loading, error }] = useRespondToClassInvitationMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      accept: // value for 'accept'
 *   },
 * });
 */
export function useRespondToClassInvitationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RespondToClassInvitationMutation, RespondToClassInvitationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RespondToClassInvitationMutation, RespondToClassInvitationMutationVariables>(RespondToClassInvitationDocument, options);
      }
export type RespondToClassInvitationMutationHookResult = ReturnType<typeof useRespondToClassInvitationMutation>;
export type RespondToClassInvitationMutationResult = Apollo.MutationResult<RespondToClassInvitationMutation>;
export type RespondToClassInvitationMutationOptions = Apollo.BaseMutationOptions<RespondToClassInvitationMutation, RespondToClassInvitationMutationVariables>;
export const CreateSessionFromTemplateDocument = gql`
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
export type CreateSessionFromTemplateMutationFn = Apollo.MutationFunction<CreateSessionFromTemplateMutation, CreateSessionFromTemplateMutationVariables>;

/**
 * __useCreateSessionFromTemplateMutation__
 *
 * To run a mutation, you first call `useCreateSessionFromTemplateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSessionFromTemplateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSessionFromTemplateMutation, { data, loading, error }] = useCreateSessionFromTemplateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSessionFromTemplateMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateSessionFromTemplateMutation, CreateSessionFromTemplateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateSessionFromTemplateMutation, CreateSessionFromTemplateMutationVariables>(CreateSessionFromTemplateDocument, options);
      }
export type CreateSessionFromTemplateMutationHookResult = ReturnType<typeof useCreateSessionFromTemplateMutation>;
export type CreateSessionFromTemplateMutationResult = Apollo.MutationResult<CreateSessionFromTemplateMutation>;
export type CreateSessionFromTemplateMutationOptions = Apollo.BaseMutationOptions<CreateSessionFromTemplateMutation, CreateSessionFromTemplateMutationVariables>;
export const UpdateSessionDocument = gql`
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
export type UpdateSessionMutationFn = Apollo.MutationFunction<UpdateSessionMutation, UpdateSessionMutationVariables>;

/**
 * __useUpdateSessionMutation__
 *
 * To run a mutation, you first call `useUpdateSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSessionMutation, { data, loading, error }] = useUpdateSessionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateSessionMutation, UpdateSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateSessionMutation, UpdateSessionMutationVariables>(UpdateSessionDocument, options);
      }
export type UpdateSessionMutationHookResult = ReturnType<typeof useUpdateSessionMutation>;
export type UpdateSessionMutationResult = Apollo.MutationResult<UpdateSessionMutation>;
export type UpdateSessionMutationOptions = Apollo.BaseMutationOptions<UpdateSessionMutation, UpdateSessionMutationVariables>;
export const CancelSessionDocument = gql`
    mutation CancelSession($id: ID!) {
  cancelSession(id: $id)
}
    `;
export type CancelSessionMutationFn = Apollo.MutationFunction<CancelSessionMutation, CancelSessionMutationVariables>;

/**
 * __useCancelSessionMutation__
 *
 * To run a mutation, you first call `useCancelSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelSessionMutation, { data, loading, error }] = useCancelSessionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCancelSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CancelSessionMutation, CancelSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CancelSessionMutation, CancelSessionMutationVariables>(CancelSessionDocument, options);
      }
export type CancelSessionMutationHookResult = ReturnType<typeof useCancelSessionMutation>;
export type CancelSessionMutationResult = Apollo.MutationResult<CancelSessionMutation>;
export type CancelSessionMutationOptions = Apollo.BaseMutationOptions<CancelSessionMutation, CancelSessionMutationVariables>;
export const CompleteSessionDocument = gql`
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
export type CompleteSessionMutationFn = Apollo.MutationFunction<CompleteSessionMutation, CompleteSessionMutationVariables>;

/**
 * __useCompleteSessionMutation__
 *
 * To run a mutation, you first call `useCompleteSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeSessionMutation, { data, loading, error }] = useCompleteSessionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCompleteSessionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CompleteSessionMutation, CompleteSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CompleteSessionMutation, CompleteSessionMutationVariables>(CompleteSessionDocument, options);
      }
export type CompleteSessionMutationHookResult = ReturnType<typeof useCompleteSessionMutation>;
export type CompleteSessionMutationResult = Apollo.MutationResult<CompleteSessionMutation>;
export type CompleteSessionMutationOptions = Apollo.BaseMutationOptions<CompleteSessionMutation, CompleteSessionMutationVariables>;
export const CreateCoachRatingDocument = gql`
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
export type CreateCoachRatingMutationFn = Apollo.MutationFunction<CreateCoachRatingMutation, CreateCoachRatingMutationVariables>;

/**
 * __useCreateCoachRatingMutation__
 *
 * To run a mutation, you first call `useCreateCoachRatingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCoachRatingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCoachRatingMutation, { data, loading, error }] = useCreateCoachRatingMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCoachRatingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateCoachRatingMutation, CreateCoachRatingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateCoachRatingMutation, CreateCoachRatingMutationVariables>(CreateCoachRatingDocument, options);
      }
export type CreateCoachRatingMutationHookResult = ReturnType<typeof useCreateCoachRatingMutation>;
export type CreateCoachRatingMutationResult = Apollo.MutationResult<CreateCoachRatingMutation>;
export type CreateCoachRatingMutationOptions = Apollo.BaseMutationOptions<CreateCoachRatingMutation, CreateCoachRatingMutationVariables>;
export const ConfirmSessionCompletionDocument = gql`
    mutation ConfirmSessionCompletion($input: ConfirmSessionCompletionInput!) {
  confirmSessionCompletion(input: $input) {
    id
    clientConfirmed
    coachConfirmed
  }
}
    `;
export type ConfirmSessionCompletionMutationFn = Apollo.MutationFunction<ConfirmSessionCompletionMutation, ConfirmSessionCompletionMutationVariables>;

/**
 * __useConfirmSessionCompletionMutation__
 *
 * To run a mutation, you first call `useConfirmSessionCompletionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmSessionCompletionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmSessionCompletionMutation, { data, loading, error }] = useConfirmSessionCompletionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useConfirmSessionCompletionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ConfirmSessionCompletionMutation, ConfirmSessionCompletionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ConfirmSessionCompletionMutation, ConfirmSessionCompletionMutationVariables>(ConfirmSessionCompletionDocument, options);
      }
export type ConfirmSessionCompletionMutationHookResult = ReturnType<typeof useConfirmSessionCompletionMutation>;
export type ConfirmSessionCompletionMutationResult = Apollo.MutationResult<ConfirmSessionCompletionMutation>;
export type ConfirmSessionCompletionMutationOptions = Apollo.BaseMutationOptions<ConfirmSessionCompletionMutation, ConfirmSessionCompletionMutationVariables>;
export const ClientConfirmWeightDocument = gql`
    mutation ClientConfirmWeight($sessionLogId: ID!) {
  clientConfirmWeight(sessionLogId: $sessionLogId) {
    id
    clientConfirmed
    coachConfirmed
  }
}
    `;
export type ClientConfirmWeightMutationFn = Apollo.MutationFunction<ClientConfirmWeightMutation, ClientConfirmWeightMutationVariables>;

/**
 * __useClientConfirmWeightMutation__
 *
 * To run a mutation, you first call `useClientConfirmWeightMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useClientConfirmWeightMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [clientConfirmWeightMutation, { data, loading, error }] = useClientConfirmWeightMutation({
 *   variables: {
 *      sessionLogId: // value for 'sessionLogId'
 *   },
 * });
 */
export function useClientConfirmWeightMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ClientConfirmWeightMutation, ClientConfirmWeightMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ClientConfirmWeightMutation, ClientConfirmWeightMutationVariables>(ClientConfirmWeightDocument, options);
      }
export type ClientConfirmWeightMutationHookResult = ReturnType<typeof useClientConfirmWeightMutation>;
export type ClientConfirmWeightMutationResult = Apollo.MutationResult<ClientConfirmWeightMutation>;
export type ClientConfirmWeightMutationOptions = Apollo.BaseMutationOptions<ClientConfirmWeightMutation, ClientConfirmWeightMutationVariables>;
export const CreateGoalDocument = gql`
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
export type CreateGoalMutationFn = Apollo.MutationFunction<CreateGoalMutation, CreateGoalMutationVariables>;

/**
 * __useCreateGoalMutation__
 *
 * To run a mutation, you first call `useCreateGoalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateGoalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createGoalMutation, { data, loading, error }] = useCreateGoalMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateGoalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateGoalMutation, CreateGoalMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateGoalMutation, CreateGoalMutationVariables>(CreateGoalDocument, options);
      }
export type CreateGoalMutationHookResult = ReturnType<typeof useCreateGoalMutation>;
export type CreateGoalMutationResult = Apollo.MutationResult<CreateGoalMutation>;
export type CreateGoalMutationOptions = Apollo.BaseMutationOptions<CreateGoalMutation, CreateGoalMutationVariables>;
export const UpdateGoalDocument = gql`
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
export type UpdateGoalMutationFn = Apollo.MutationFunction<UpdateGoalMutation, UpdateGoalMutationVariables>;

/**
 * __useUpdateGoalMutation__
 *
 * To run a mutation, you first call `useUpdateGoalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateGoalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateGoalMutation, { data, loading, error }] = useUpdateGoalMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateGoalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateGoalMutation, UpdateGoalMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateGoalMutation, UpdateGoalMutationVariables>(UpdateGoalDocument, options);
      }
export type UpdateGoalMutationHookResult = ReturnType<typeof useUpdateGoalMutation>;
export type UpdateGoalMutationResult = Apollo.MutationResult<UpdateGoalMutation>;
export type UpdateGoalMutationOptions = Apollo.BaseMutationOptions<UpdateGoalMutation, UpdateGoalMutationVariables>;
export const DeleteGoalDocument = gql`
    mutation DeleteGoal($id: ID!) {
  deleteGoal(id: $id)
}
    `;
export type DeleteGoalMutationFn = Apollo.MutationFunction<DeleteGoalMutation, DeleteGoalMutationVariables>;

/**
 * __useDeleteGoalMutation__
 *
 * To run a mutation, you first call `useDeleteGoalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteGoalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteGoalMutation, { data, loading, error }] = useDeleteGoalMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteGoalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteGoalMutation, DeleteGoalMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteGoalMutation, DeleteGoalMutationVariables>(DeleteGoalDocument, options);
      }
export type DeleteGoalMutationHookResult = ReturnType<typeof useDeleteGoalMutation>;
export type DeleteGoalMutationResult = Apollo.MutationResult<DeleteGoalMutation>;
export type DeleteGoalMutationOptions = Apollo.BaseMutationOptions<DeleteGoalMutation, DeleteGoalMutationVariables>;
export const AssignCoachToGoalDocument = gql`
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
export type AssignCoachToGoalMutationFn = Apollo.MutationFunction<AssignCoachToGoalMutation, AssignCoachToGoalMutationVariables>;

/**
 * __useAssignCoachToGoalMutation__
 *
 * To run a mutation, you first call `useAssignCoachToGoalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignCoachToGoalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignCoachToGoalMutation, { data, loading, error }] = useAssignCoachToGoalMutation({
 *   variables: {
 *      goalId: // value for 'goalId'
 *   },
 * });
 */
export function useAssignCoachToGoalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AssignCoachToGoalMutation, AssignCoachToGoalMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AssignCoachToGoalMutation, AssignCoachToGoalMutationVariables>(AssignCoachToGoalDocument, options);
      }
export type AssignCoachToGoalMutationHookResult = ReturnType<typeof useAssignCoachToGoalMutation>;
export type AssignCoachToGoalMutationResult = Apollo.MutationResult<AssignCoachToGoalMutation>;
export type AssignCoachToGoalMutationOptions = Apollo.BaseMutationOptions<AssignCoachToGoalMutation, AssignCoachToGoalMutationVariables>;
export const PurchaseMembershipDocument = gql`
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
export type PurchaseMembershipMutationFn = Apollo.MutationFunction<PurchaseMembershipMutation, PurchaseMembershipMutationVariables>;

/**
 * __usePurchaseMembershipMutation__
 *
 * To run a mutation, you first call `usePurchaseMembershipMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePurchaseMembershipMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [purchaseMembershipMutation, { data, loading, error }] = usePurchaseMembershipMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePurchaseMembershipMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<PurchaseMembershipMutation, PurchaseMembershipMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<PurchaseMembershipMutation, PurchaseMembershipMutationVariables>(PurchaseMembershipDocument, options);
      }
export type PurchaseMembershipMutationHookResult = ReturnType<typeof usePurchaseMembershipMutation>;
export type PurchaseMembershipMutationResult = Apollo.MutationResult<PurchaseMembershipMutation>;
export type PurchaseMembershipMutationOptions = Apollo.BaseMutationOptions<PurchaseMembershipMutation, PurchaseMembershipMutationVariables>;
export const CancelMembershipDocument = gql`
    mutation CancelMembership($transactionId: ID!) {
  cancelMembership(transactionId: $transactionId)
}
    `;
export type CancelMembershipMutationFn = Apollo.MutationFunction<CancelMembershipMutation, CancelMembershipMutationVariables>;

/**
 * __useCancelMembershipMutation__
 *
 * To run a mutation, you first call `useCancelMembershipMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelMembershipMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelMembershipMutation, { data, loading, error }] = useCancelMembershipMutation({
 *   variables: {
 *      transactionId: // value for 'transactionId'
 *   },
 * });
 */
export function useCancelMembershipMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CancelMembershipMutation, CancelMembershipMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CancelMembershipMutation, CancelMembershipMutationVariables>(CancelMembershipDocument, options);
      }
export type CancelMembershipMutationHookResult = ReturnType<typeof useCancelMembershipMutation>;
export type CancelMembershipMutationResult = Apollo.MutationResult<CancelMembershipMutation>;
export type CancelMembershipMutationOptions = Apollo.BaseMutationOptions<CancelMembershipMutation, CancelMembershipMutationVariables>;
export const UpdateUserDocument = gql`
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
export type UpdateUserMutationFn = Apollo.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = Apollo.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = Apollo.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
export const CreateCoachRequestDocument = gql`
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
export type CreateCoachRequestMutationFn = Apollo.MutationFunction<CreateCoachRequestMutation, CreateCoachRequestMutationVariables>;

/**
 * __useCreateCoachRequestMutation__
 *
 * To run a mutation, you first call `useCreateCoachRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCoachRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCoachRequestMutation, { data, loading, error }] = useCreateCoachRequestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCoachRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateCoachRequestMutation, CreateCoachRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateCoachRequestMutation, CreateCoachRequestMutationVariables>(CreateCoachRequestDocument, options);
      }
export type CreateCoachRequestMutationHookResult = ReturnType<typeof useCreateCoachRequestMutation>;
export type CreateCoachRequestMutationResult = Apollo.MutationResult<CreateCoachRequestMutation>;
export type CreateCoachRequestMutationOptions = Apollo.BaseMutationOptions<CreateCoachRequestMutation, CreateCoachRequestMutationVariables>;
export const UpdateCoachRequestDocument = gql`
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
export type UpdateCoachRequestMutationFn = Apollo.MutationFunction<UpdateCoachRequestMutation, UpdateCoachRequestMutationVariables>;

/**
 * __useUpdateCoachRequestMutation__
 *
 * To run a mutation, you first call `useUpdateCoachRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCoachRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCoachRequestMutation, { data, loading, error }] = useUpdateCoachRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCoachRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateCoachRequestMutation, UpdateCoachRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateCoachRequestMutation, UpdateCoachRequestMutationVariables>(UpdateCoachRequestDocument, options);
      }
export type UpdateCoachRequestMutationHookResult = ReturnType<typeof useUpdateCoachRequestMutation>;
export type UpdateCoachRequestMutationResult = Apollo.MutationResult<UpdateCoachRequestMutation>;
export type UpdateCoachRequestMutationOptions = Apollo.BaseMutationOptions<UpdateCoachRequestMutation, UpdateCoachRequestMutationVariables>;
export const CancelCoachRequestDocument = gql`
    mutation CancelCoachRequest($id: ID!) {
  cancelCoachRequest(id: $id)
}
    `;
export type CancelCoachRequestMutationFn = Apollo.MutationFunction<CancelCoachRequestMutation, CancelCoachRequestMutationVariables>;

/**
 * __useCancelCoachRequestMutation__
 *
 * To run a mutation, you first call `useCancelCoachRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelCoachRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelCoachRequestMutation, { data, loading, error }] = useCancelCoachRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCancelCoachRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CancelCoachRequestMutation, CancelCoachRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CancelCoachRequestMutation, CancelCoachRequestMutationVariables>(CancelCoachRequestDocument, options);
      }
export type CancelCoachRequestMutationHookResult = ReturnType<typeof useCancelCoachRequestMutation>;
export type CancelCoachRequestMutationResult = Apollo.MutationResult<CancelCoachRequestMutation>;
export type CancelCoachRequestMutationOptions = Apollo.BaseMutationOptions<CancelCoachRequestMutation, CancelCoachRequestMutationVariables>;
export const RemoveClientDocument = gql`
    mutation RemoveClient($clientId: ID!) {
  removeClient(clientId: $clientId)
}
    `;
export type RemoveClientMutationFn = Apollo.MutationFunction<RemoveClientMutation, RemoveClientMutationVariables>;

/**
 * __useRemoveClientMutation__
 *
 * To run a mutation, you first call `useRemoveClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeClientMutation, { data, loading, error }] = useRemoveClientMutation({
 *   variables: {
 *      clientId: // value for 'clientId'
 *   },
 * });
 */
export function useRemoveClientMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveClientMutation, RemoveClientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveClientMutation, RemoveClientMutationVariables>(RemoveClientDocument, options);
      }
export type RemoveClientMutationHookResult = ReturnType<typeof useRemoveClientMutation>;
export type RemoveClientMutationResult = Apollo.MutationResult<RemoveClientMutation>;
export type RemoveClientMutationOptions = Apollo.BaseMutationOptions<RemoveClientMutation, RemoveClientMutationVariables>;
export const CreateSubscriptionRequestDocument = gql`
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
export type CreateSubscriptionRequestMutationFn = Apollo.MutationFunction<CreateSubscriptionRequestMutation, CreateSubscriptionRequestMutationVariables>;

/**
 * __useCreateSubscriptionRequestMutation__
 *
 * To run a mutation, you first call `useCreateSubscriptionRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSubscriptionRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSubscriptionRequestMutation, { data, loading, error }] = useCreateSubscriptionRequestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSubscriptionRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateSubscriptionRequestMutation, CreateSubscriptionRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateSubscriptionRequestMutation, CreateSubscriptionRequestMutationVariables>(CreateSubscriptionRequestDocument, options);
      }
export type CreateSubscriptionRequestMutationHookResult = ReturnType<typeof useCreateSubscriptionRequestMutation>;
export type CreateSubscriptionRequestMutationResult = Apollo.MutationResult<CreateSubscriptionRequestMutation>;
export type CreateSubscriptionRequestMutationOptions = Apollo.BaseMutationOptions<CreateSubscriptionRequestMutation, CreateSubscriptionRequestMutationVariables>;
export const CreateProgressRatingDocument = gql`
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
export type CreateProgressRatingMutationFn = Apollo.MutationFunction<CreateProgressRatingMutation, CreateProgressRatingMutationVariables>;

/**
 * __useCreateProgressRatingMutation__
 *
 * To run a mutation, you first call `useCreateProgressRatingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProgressRatingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProgressRatingMutation, { data, loading, error }] = useCreateProgressRatingMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProgressRatingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateProgressRatingMutation, CreateProgressRatingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateProgressRatingMutation, CreateProgressRatingMutationVariables>(CreateProgressRatingDocument, options);
      }
export type CreateProgressRatingMutationHookResult = ReturnType<typeof useCreateProgressRatingMutation>;
export type CreateProgressRatingMutationResult = Apollo.MutationResult<CreateProgressRatingMutation>;
export type CreateProgressRatingMutationOptions = Apollo.BaseMutationOptions<CreateProgressRatingMutation, CreateProgressRatingMutationVariables>;
export const UpdateProgressRatingDocument = gql`
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
export type UpdateProgressRatingMutationFn = Apollo.MutationFunction<UpdateProgressRatingMutation, UpdateProgressRatingMutationVariables>;

/**
 * __useUpdateProgressRatingMutation__
 *
 * To run a mutation, you first call `useUpdateProgressRatingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProgressRatingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProgressRatingMutation, { data, loading, error }] = useUpdateProgressRatingMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProgressRatingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProgressRatingMutation, UpdateProgressRatingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProgressRatingMutation, UpdateProgressRatingMutationVariables>(UpdateProgressRatingDocument, options);
      }
export type UpdateProgressRatingMutationHookResult = ReturnType<typeof useUpdateProgressRatingMutation>;
export type UpdateProgressRatingMutationResult = Apollo.MutationResult<UpdateProgressRatingMutation>;
export type UpdateProgressRatingMutationOptions = Apollo.BaseMutationOptions<UpdateProgressRatingMutation, UpdateProgressRatingMutationVariables>;
export const DeleteProgressRatingDocument = gql`
    mutation DeleteProgressRating($id: ID!) {
  deleteProgressRating(id: $id)
}
    `;
export type DeleteProgressRatingMutationFn = Apollo.MutationFunction<DeleteProgressRatingMutation, DeleteProgressRatingMutationVariables>;

/**
 * __useDeleteProgressRatingMutation__
 *
 * To run a mutation, you first call `useDeleteProgressRatingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProgressRatingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProgressRatingMutation, { data, loading, error }] = useDeleteProgressRatingMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteProgressRatingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteProgressRatingMutation, DeleteProgressRatingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteProgressRatingMutation, DeleteProgressRatingMutationVariables>(DeleteProgressRatingDocument, options);
      }
export type DeleteProgressRatingMutationHookResult = ReturnType<typeof useDeleteProgressRatingMutation>;
export type DeleteProgressRatingMutationResult = Apollo.MutationResult<DeleteProgressRatingMutation>;
export type DeleteProgressRatingMutationOptions = Apollo.BaseMutationOptions<DeleteProgressRatingMutation, DeleteProgressRatingMutationVariables>;
export const MeDocument = gql`
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
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
// @ts-ignore
export function useMeSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MeQuery, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MeQuery | undefined, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const GetCoachSessionsDocument = gql`
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
    createdAt
  }
}
    `;

/**
 * __useGetCoachSessionsQuery__
 *
 * To run a query within a React component, call `useGetCoachSessionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCoachSessionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCoachSessionsQuery({
 *   variables: {
 *      coachId: // value for 'coachId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetCoachSessionsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetCoachSessionsQuery, GetCoachSessionsQueryVariables> & ({ variables: GetCoachSessionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>(GetCoachSessionsDocument, options);
      }
export function useGetCoachSessionsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>(GetCoachSessionsDocument, options);
        }
// @ts-ignore
export function useGetCoachSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>;
export function useGetCoachSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachSessionsQuery | undefined, GetCoachSessionsQueryVariables>;
export function useGetCoachSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>(GetCoachSessionsDocument, options);
        }
export type GetCoachSessionsQueryHookResult = ReturnType<typeof useGetCoachSessionsQuery>;
export type GetCoachSessionsLazyQueryHookResult = ReturnType<typeof useGetCoachSessionsLazyQuery>;
export type GetCoachSessionsSuspenseQueryHookResult = ReturnType<typeof useGetCoachSessionsSuspenseQuery>;
export type GetCoachSessionsQueryResult = Apollo.QueryResult<GetCoachSessionsQuery, GetCoachSessionsQueryVariables>;
export const GetJoinableGroupClassesDocument = gql`
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

/**
 * __useGetJoinableGroupClassesQuery__
 *
 * To run a query within a React component, call `useGetJoinableGroupClassesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetJoinableGroupClassesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetJoinableGroupClassesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetJoinableGroupClassesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>(GetJoinableGroupClassesDocument, options);
      }
export function useGetJoinableGroupClassesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>(GetJoinableGroupClassesDocument, options);
        }
// @ts-ignore
export function useGetJoinableGroupClassesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>;
export function useGetJoinableGroupClassesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetJoinableGroupClassesQuery | undefined, GetJoinableGroupClassesQueryVariables>;
export function useGetJoinableGroupClassesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>(GetJoinableGroupClassesDocument, options);
        }
export type GetJoinableGroupClassesQueryHookResult = ReturnType<typeof useGetJoinableGroupClassesQuery>;
export type GetJoinableGroupClassesLazyQueryHookResult = ReturnType<typeof useGetJoinableGroupClassesLazyQuery>;
export type GetJoinableGroupClassesSuspenseQueryHookResult = ReturnType<typeof useGetJoinableGroupClassesSuspenseQuery>;
export type GetJoinableGroupClassesQueryResult = Apollo.QueryResult<GetJoinableGroupClassesQuery, GetJoinableGroupClassesQueryVariables>;
export const GetClientSessionsDocument = gql`
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
    createdAt
  }
}
    `;

/**
 * __useGetClientSessionsQuery__
 *
 * To run a query within a React component, call `useGetClientSessionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetClientSessionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetClientSessionsQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetClientSessionsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetClientSessionsQuery, GetClientSessionsQueryVariables> & ({ variables: GetClientSessionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetClientSessionsQuery, GetClientSessionsQueryVariables>(GetClientSessionsDocument, options);
      }
export function useGetClientSessionsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetClientSessionsQuery, GetClientSessionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetClientSessionsQuery, GetClientSessionsQueryVariables>(GetClientSessionsDocument, options);
        }
// @ts-ignore
export function useGetClientSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetClientSessionsQuery, GetClientSessionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetClientSessionsQuery, GetClientSessionsQueryVariables>;
export function useGetClientSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetClientSessionsQuery, GetClientSessionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetClientSessionsQuery | undefined, GetClientSessionsQueryVariables>;
export function useGetClientSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetClientSessionsQuery, GetClientSessionsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetClientSessionsQuery, GetClientSessionsQueryVariables>(GetClientSessionsDocument, options);
        }
export type GetClientSessionsQueryHookResult = ReturnType<typeof useGetClientSessionsQuery>;
export type GetClientSessionsLazyQueryHookResult = ReturnType<typeof useGetClientSessionsLazyQuery>;
export type GetClientSessionsSuspenseQueryHookResult = ReturnType<typeof useGetClientSessionsSuspenseQuery>;
export type GetClientSessionsQueryResult = Apollo.QueryResult<GetClientSessionsQuery, GetClientSessionsQueryVariables>;
export const GetUsersDocument = gql`
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

/**
 * __useGetUsersQuery__
 *
 * To run a query within a React component, call `useGetUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUsersQuery({
 *   variables: {
 *      role: // value for 'role'
 *   },
 * });
 */
export function useGetUsersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
      }
export function useGetUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
// @ts-ignore
export function useGetUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUsersQuery, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUsersQuery | undefined, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
export type GetUsersQueryHookResult = ReturnType<typeof useGetUsersQuery>;
export type GetUsersLazyQueryHookResult = ReturnType<typeof useGetUsersLazyQuery>;
export type GetUsersSuspenseQueryHookResult = ReturnType<typeof useGetUsersSuspenseQuery>;
export type GetUsersQueryResult = Apollo.QueryResult<GetUsersQuery, GetUsersQueryVariables>;
export const GetPendingCoachRequestsDocument = gql`
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

/**
 * __useGetPendingCoachRequestsQuery__
 *
 * To run a query within a React component, call `useGetPendingCoachRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPendingCoachRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPendingCoachRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPendingCoachRequestsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>(GetPendingCoachRequestsDocument, options);
      }
export function useGetPendingCoachRequestsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>(GetPendingCoachRequestsDocument, options);
        }
// @ts-ignore
export function useGetPendingCoachRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>;
export function useGetPendingCoachRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPendingCoachRequestsQuery | undefined, GetPendingCoachRequestsQueryVariables>;
export function useGetPendingCoachRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>(GetPendingCoachRequestsDocument, options);
        }
export type GetPendingCoachRequestsQueryHookResult = ReturnType<typeof useGetPendingCoachRequestsQuery>;
export type GetPendingCoachRequestsLazyQueryHookResult = ReturnType<typeof useGetPendingCoachRequestsLazyQuery>;
export type GetPendingCoachRequestsSuspenseQueryHookResult = ReturnType<typeof useGetPendingCoachRequestsSuspenseQuery>;
export type GetPendingCoachRequestsQueryResult = Apollo.QueryResult<GetPendingCoachRequestsQuery, GetPendingCoachRequestsQueryVariables>;
export const GetUpcomingSessionsDocument = gql`
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

/**
 * __useGetUpcomingSessionsQuery__
 *
 * To run a query within a React component, call `useGetUpcomingSessionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUpcomingSessionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUpcomingSessionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetUpcomingSessionsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>(GetUpcomingSessionsDocument, options);
      }
export function useGetUpcomingSessionsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>(GetUpcomingSessionsDocument, options);
        }
// @ts-ignore
export function useGetUpcomingSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>;
export function useGetUpcomingSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUpcomingSessionsQuery | undefined, GetUpcomingSessionsQueryVariables>;
export function useGetUpcomingSessionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>(GetUpcomingSessionsDocument, options);
        }
export type GetUpcomingSessionsQueryHookResult = ReturnType<typeof useGetUpcomingSessionsQuery>;
export type GetUpcomingSessionsLazyQueryHookResult = ReturnType<typeof useGetUpcomingSessionsLazyQuery>;
export type GetUpcomingSessionsSuspenseQueryHookResult = ReturnType<typeof useGetUpcomingSessionsSuspenseQuery>;
export type GetUpcomingSessionsQueryResult = Apollo.QueryResult<GetUpcomingSessionsQuery, GetUpcomingSessionsQueryVariables>;
export const GetGoalsDocument = gql`
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

/**
 * __useGetGoalsQuery__
 *
 * To run a query within a React component, call `useGetGoalsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGoalsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGoalsQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetGoalsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetGoalsQuery, GetGoalsQueryVariables> & ({ variables: GetGoalsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetGoalsQuery, GetGoalsQueryVariables>(GetGoalsDocument, options);
      }
export function useGetGoalsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetGoalsQuery, GetGoalsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetGoalsQuery, GetGoalsQueryVariables>(GetGoalsDocument, options);
        }
// @ts-ignore
export function useGetGoalsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetGoalsQuery, GetGoalsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetGoalsQuery, GetGoalsQueryVariables>;
export function useGetGoalsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetGoalsQuery, GetGoalsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetGoalsQuery | undefined, GetGoalsQueryVariables>;
export function useGetGoalsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetGoalsQuery, GetGoalsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetGoalsQuery, GetGoalsQueryVariables>(GetGoalsDocument, options);
        }
export type GetGoalsQueryHookResult = ReturnType<typeof useGetGoalsQuery>;
export type GetGoalsLazyQueryHookResult = ReturnType<typeof useGetGoalsLazyQuery>;
export type GetGoalsSuspenseQueryHookResult = ReturnType<typeof useGetGoalsSuspenseQuery>;
export type GetGoalsQueryResult = Apollo.QueryResult<GetGoalsQuery, GetGoalsQueryVariables>;
export const GetCurrentMembershipDocument = gql`
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

/**
 * __useGetCurrentMembershipQuery__
 *
 * To run a query within a React component, call `useGetCurrentMembershipQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentMembershipQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentMembershipQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCurrentMembershipQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>(GetCurrentMembershipDocument, options);
      }
export function useGetCurrentMembershipLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>(GetCurrentMembershipDocument, options);
        }
// @ts-ignore
export function useGetCurrentMembershipSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>;
export function useGetCurrentMembershipSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCurrentMembershipQuery | undefined, GetCurrentMembershipQueryVariables>;
export function useGetCurrentMembershipSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>(GetCurrentMembershipDocument, options);
        }
export type GetCurrentMembershipQueryHookResult = ReturnType<typeof useGetCurrentMembershipQuery>;
export type GetCurrentMembershipLazyQueryHookResult = ReturnType<typeof useGetCurrentMembershipLazyQuery>;
export type GetCurrentMembershipSuspenseQueryHookResult = ReturnType<typeof useGetCurrentMembershipSuspenseQuery>;
export type GetCurrentMembershipQueryResult = Apollo.QueryResult<GetCurrentMembershipQuery, GetCurrentMembershipQueryVariables>;
export const GetUserDocument = gql`
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

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserQuery, GetUserQueryVariables> & ({ variables: GetUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
// @ts-ignore
export function useGetUserSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserQuery, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserQuery | undefined, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserSuspenseQueryHookResult = ReturnType<typeof useGetUserSuspenseQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const GetAllClientGoalsDocument = gql`
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

/**
 * __useGetAllClientGoalsQuery__
 *
 * To run a query within a React component, call `useGetAllClientGoalsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllClientGoalsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllClientGoalsQuery({
 *   variables: {
 *      coachId: // value for 'coachId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetAllClientGoalsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables> & ({ variables: GetAllClientGoalsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>(GetAllClientGoalsDocument, options);
      }
export function useGetAllClientGoalsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>(GetAllClientGoalsDocument, options);
        }
// @ts-ignore
export function useGetAllClientGoalsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>;
export function useGetAllClientGoalsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAllClientGoalsQuery | undefined, GetAllClientGoalsQueryVariables>;
export function useGetAllClientGoalsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>(GetAllClientGoalsDocument, options);
        }
export type GetAllClientGoalsQueryHookResult = ReturnType<typeof useGetAllClientGoalsQuery>;
export type GetAllClientGoalsLazyQueryHookResult = ReturnType<typeof useGetAllClientGoalsLazyQuery>;
export type GetAllClientGoalsSuspenseQueryHookResult = ReturnType<typeof useGetAllClientGoalsSuspenseQuery>;
export type GetAllClientGoalsQueryResult = Apollo.QueryResult<GetAllClientGoalsQuery, GetAllClientGoalsQueryVariables>;
export const GetSessionTemplatesDocument = gql`
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
    createdAt
  }
}
    `;

/**
 * __useGetSessionTemplatesQuery__
 *
 * To run a query within a React component, call `useGetSessionTemplatesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionTemplatesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionTemplatesQuery({
 *   variables: {
 *      coachId: // value for 'coachId'
 *   },
 * });
 */
export function useGetSessionTemplatesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables> & ({ variables: GetSessionTemplatesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>(GetSessionTemplatesDocument, options);
      }
export function useGetSessionTemplatesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>(GetSessionTemplatesDocument, options);
        }
// @ts-ignore
export function useGetSessionTemplatesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>;
export function useGetSessionTemplatesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionTemplatesQuery | undefined, GetSessionTemplatesQueryVariables>;
export function useGetSessionTemplatesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>(GetSessionTemplatesDocument, options);
        }
export type GetSessionTemplatesQueryHookResult = ReturnType<typeof useGetSessionTemplatesQuery>;
export type GetSessionTemplatesLazyQueryHookResult = ReturnType<typeof useGetSessionTemplatesLazyQuery>;
export type GetSessionTemplatesSuspenseQueryHookResult = ReturnType<typeof useGetSessionTemplatesSuspenseQuery>;
export type GetSessionTemplatesQueryResult = Apollo.QueryResult<GetSessionTemplatesQuery, GetSessionTemplatesQueryVariables>;
export const GetSessionDocument = gql`
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

/**
 * __useGetSessionQuery__
 *
 * To run a query within a React component, call `useGetSessionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSessionQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSessionQuery, GetSessionQueryVariables> & ({ variables: GetSessionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
      }
export function useGetSessionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
        }
// @ts-ignore
export function useGetSessionSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionQuery, GetSessionQueryVariables>;
export function useGetSessionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionQuery | undefined, GetSessionQueryVariables>;
export function useGetSessionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
        }
export type GetSessionQueryHookResult = ReturnType<typeof useGetSessionQuery>;
export type GetSessionLazyQueryHookResult = ReturnType<typeof useGetSessionLazyQuery>;
export type GetSessionSuspenseQueryHookResult = ReturnType<typeof useGetSessionSuspenseQuery>;
export type GetSessionQueryResult = Apollo.QueryResult<GetSessionQuery, GetSessionQueryVariables>;
export const GetSessionLogsDocument = gql`
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

/**
 * __useGetSessionLogsQuery__
 *
 * To run a query within a React component, call `useGetSessionLogsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionLogsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionLogsQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *   },
 * });
 */
export function useGetSessionLogsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSessionLogsQuery, GetSessionLogsQueryVariables> & ({ variables: GetSessionLogsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSessionLogsQuery, GetSessionLogsQueryVariables>(GetSessionLogsDocument, options);
      }
export function useGetSessionLogsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSessionLogsQuery, GetSessionLogsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSessionLogsQuery, GetSessionLogsQueryVariables>(GetSessionLogsDocument, options);
        }
// @ts-ignore
export function useGetSessionLogsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogsQuery, GetSessionLogsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionLogsQuery, GetSessionLogsQueryVariables>;
export function useGetSessionLogsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogsQuery, GetSessionLogsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionLogsQuery | undefined, GetSessionLogsQueryVariables>;
export function useGetSessionLogsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogsQuery, GetSessionLogsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSessionLogsQuery, GetSessionLogsQueryVariables>(GetSessionLogsDocument, options);
        }
export type GetSessionLogsQueryHookResult = ReturnType<typeof useGetSessionLogsQuery>;
export type GetSessionLogsLazyQueryHookResult = ReturnType<typeof useGetSessionLogsLazyQuery>;
export type GetSessionLogsSuspenseQueryHookResult = ReturnType<typeof useGetSessionLogsSuspenseQuery>;
export type GetSessionLogsQueryResult = Apollo.QueryResult<GetSessionLogsQuery, GetSessionLogsQueryVariables>;
export const GetCoachSessionLogsDocument = gql`
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

/**
 * __useGetCoachSessionLogsQuery__
 *
 * To run a query within a React component, call `useGetCoachSessionLogsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCoachSessionLogsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCoachSessionLogsQuery({
 *   variables: {
 *      coachId: // value for 'coachId'
 *   },
 * });
 */
export function useGetCoachSessionLogsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables> & ({ variables: GetCoachSessionLogsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>(GetCoachSessionLogsDocument, options);
      }
export function useGetCoachSessionLogsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>(GetCoachSessionLogsDocument, options);
        }
// @ts-ignore
export function useGetCoachSessionLogsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>;
export function useGetCoachSessionLogsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachSessionLogsQuery | undefined, GetCoachSessionLogsQueryVariables>;
export function useGetCoachSessionLogsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>(GetCoachSessionLogsDocument, options);
        }
export type GetCoachSessionLogsQueryHookResult = ReturnType<typeof useGetCoachSessionLogsQuery>;
export type GetCoachSessionLogsLazyQueryHookResult = ReturnType<typeof useGetCoachSessionLogsLazyQuery>;
export type GetCoachSessionLogsSuspenseQueryHookResult = ReturnType<typeof useGetCoachSessionLogsSuspenseQuery>;
export type GetCoachSessionLogsQueryResult = Apollo.QueryResult<GetCoachSessionLogsQuery, GetCoachSessionLogsQueryVariables>;
export const GetSessionLogBySessionIdDocument = gql`
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

/**
 * __useGetSessionLogBySessionIdQuery__
 *
 * To run a query within a React component, call `useGetSessionLogBySessionIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionLogBySessionIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionLogBySessionIdQuery({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useGetSessionLogBySessionIdQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables> & ({ variables: GetSessionLogBySessionIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>(GetSessionLogBySessionIdDocument, options);
      }
export function useGetSessionLogBySessionIdLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>(GetSessionLogBySessionIdDocument, options);
        }
// @ts-ignore
export function useGetSessionLogBySessionIdSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>;
export function useGetSessionLogBySessionIdSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionLogBySessionIdQuery | undefined, GetSessionLogBySessionIdQueryVariables>;
export function useGetSessionLogBySessionIdSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>(GetSessionLogBySessionIdDocument, options);
        }
export type GetSessionLogBySessionIdQueryHookResult = ReturnType<typeof useGetSessionLogBySessionIdQuery>;
export type GetSessionLogBySessionIdLazyQueryHookResult = ReturnType<typeof useGetSessionLogBySessionIdLazyQuery>;
export type GetSessionLogBySessionIdSuspenseQueryHookResult = ReturnType<typeof useGetSessionLogBySessionIdSuspenseQuery>;
export type GetSessionLogBySessionIdQueryResult = Apollo.QueryResult<GetSessionLogBySessionIdQuery, GetSessionLogBySessionIdQueryVariables>;
export const GetWeightProgressDocument = gql`
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

/**
 * __useGetWeightProgressQuery__
 *
 * To run a query within a React component, call `useGetWeightProgressQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWeightProgressQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWeightProgressQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *      goalId: // value for 'goalId'
 *   },
 * });
 */
export function useGetWeightProgressQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetWeightProgressQuery, GetWeightProgressQueryVariables> & ({ variables: GetWeightProgressQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWeightProgressQuery, GetWeightProgressQueryVariables>(GetWeightProgressDocument, options);
      }
export function useGetWeightProgressLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWeightProgressQuery, GetWeightProgressQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWeightProgressQuery, GetWeightProgressQueryVariables>(GetWeightProgressDocument, options);
        }
// @ts-ignore
export function useGetWeightProgressSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetWeightProgressQuery, GetWeightProgressQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetWeightProgressQuery, GetWeightProgressQueryVariables>;
export function useGetWeightProgressSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWeightProgressQuery, GetWeightProgressQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetWeightProgressQuery | undefined, GetWeightProgressQueryVariables>;
export function useGetWeightProgressSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWeightProgressQuery, GetWeightProgressQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWeightProgressQuery, GetWeightProgressQueryVariables>(GetWeightProgressDocument, options);
        }
export type GetWeightProgressQueryHookResult = ReturnType<typeof useGetWeightProgressQuery>;
export type GetWeightProgressLazyQueryHookResult = ReturnType<typeof useGetWeightProgressLazyQuery>;
export type GetWeightProgressSuspenseQueryHookResult = ReturnType<typeof useGetWeightProgressSuspenseQuery>;
export type GetWeightProgressQueryResult = Apollo.QueryResult<GetWeightProgressQuery, GetWeightProgressQueryVariables>;
export const GetGoalDocument = gql`
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

/**
 * __useGetGoalQuery__
 *
 * To run a query within a React component, call `useGetGoalQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGoalQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGoalQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetGoalQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetGoalQuery, GetGoalQueryVariables> & ({ variables: GetGoalQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetGoalQuery, GetGoalQueryVariables>(GetGoalDocument, options);
      }
export function useGetGoalLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetGoalQuery, GetGoalQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetGoalQuery, GetGoalQueryVariables>(GetGoalDocument, options);
        }
// @ts-ignore
export function useGetGoalSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetGoalQuery, GetGoalQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetGoalQuery, GetGoalQueryVariables>;
export function useGetGoalSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetGoalQuery, GetGoalQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetGoalQuery | undefined, GetGoalQueryVariables>;
export function useGetGoalSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetGoalQuery, GetGoalQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetGoalQuery, GetGoalQueryVariables>(GetGoalDocument, options);
        }
export type GetGoalQueryHookResult = ReturnType<typeof useGetGoalQuery>;
export type GetGoalLazyQueryHookResult = ReturnType<typeof useGetGoalLazyQuery>;
export type GetGoalSuspenseQueryHookResult = ReturnType<typeof useGetGoalSuspenseQuery>;
export type GetGoalQueryResult = Apollo.QueryResult<GetGoalQuery, GetGoalQueryVariables>;
export const GetWeightProgressChartDocument = gql`
    query GetWeightProgressChart($clientId: ID!, $goalId: ID) {
  getWeightProgressChart(clientId: $clientId, goalId: $goalId) {
    date
    weight
    sessionId
    sessionLogId
  }
}
    `;

/**
 * __useGetWeightProgressChartQuery__
 *
 * To run a query within a React component, call `useGetWeightProgressChartQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWeightProgressChartQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWeightProgressChartQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *      goalId: // value for 'goalId'
 *   },
 * });
 */
export function useGetWeightProgressChartQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables> & ({ variables: GetWeightProgressChartQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>(GetWeightProgressChartDocument, options);
      }
export function useGetWeightProgressChartLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>(GetWeightProgressChartDocument, options);
        }
// @ts-ignore
export function useGetWeightProgressChartSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>;
export function useGetWeightProgressChartSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetWeightProgressChartQuery | undefined, GetWeightProgressChartQueryVariables>;
export function useGetWeightProgressChartSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>(GetWeightProgressChartDocument, options);
        }
export type GetWeightProgressChartQueryHookResult = ReturnType<typeof useGetWeightProgressChartQuery>;
export type GetWeightProgressChartLazyQueryHookResult = ReturnType<typeof useGetWeightProgressChartLazyQuery>;
export type GetWeightProgressChartSuspenseQueryHookResult = ReturnType<typeof useGetWeightProgressChartSuspenseQuery>;
export type GetWeightProgressChartQueryResult = Apollo.QueryResult<GetWeightProgressChartQuery, GetWeightProgressChartQueryVariables>;
export const GetMembershipsDocument = gql`
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

/**
 * __useGetMembershipsQuery__
 *
 * To run a query within a React component, call `useGetMembershipsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMembershipsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMembershipsQuery({
 *   variables: {
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetMembershipsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMembershipsQuery, GetMembershipsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMembershipsQuery, GetMembershipsQueryVariables>(GetMembershipsDocument, options);
      }
export function useGetMembershipsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMembershipsQuery, GetMembershipsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMembershipsQuery, GetMembershipsQueryVariables>(GetMembershipsDocument, options);
        }
// @ts-ignore
export function useGetMembershipsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMembershipsQuery, GetMembershipsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMembershipsQuery, GetMembershipsQueryVariables>;
export function useGetMembershipsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMembershipsQuery, GetMembershipsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMembershipsQuery | undefined, GetMembershipsQueryVariables>;
export function useGetMembershipsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMembershipsQuery, GetMembershipsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMembershipsQuery, GetMembershipsQueryVariables>(GetMembershipsDocument, options);
        }
export type GetMembershipsQueryHookResult = ReturnType<typeof useGetMembershipsQuery>;
export type GetMembershipsLazyQueryHookResult = ReturnType<typeof useGetMembershipsLazyQuery>;
export type GetMembershipsSuspenseQueryHookResult = ReturnType<typeof useGetMembershipsSuspenseQuery>;
export type GetMembershipsQueryResult = Apollo.QueryResult<GetMembershipsQuery, GetMembershipsQueryVariables>;
export const GetMembershipDocument = gql`
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

/**
 * __useGetMembershipQuery__
 *
 * To run a query within a React component, call `useGetMembershipQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMembershipQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMembershipQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMembershipQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMembershipQuery, GetMembershipQueryVariables> & ({ variables: GetMembershipQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMembershipQuery, GetMembershipQueryVariables>(GetMembershipDocument, options);
      }
export function useGetMembershipLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMembershipQuery, GetMembershipQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMembershipQuery, GetMembershipQueryVariables>(GetMembershipDocument, options);
        }
// @ts-ignore
export function useGetMembershipSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMembershipQuery, GetMembershipQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMembershipQuery, GetMembershipQueryVariables>;
export function useGetMembershipSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMembershipQuery, GetMembershipQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMembershipQuery | undefined, GetMembershipQueryVariables>;
export function useGetMembershipSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMembershipQuery, GetMembershipQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMembershipQuery, GetMembershipQueryVariables>(GetMembershipDocument, options);
        }
export type GetMembershipQueryHookResult = ReturnType<typeof useGetMembershipQuery>;
export type GetMembershipLazyQueryHookResult = ReturnType<typeof useGetMembershipLazyQuery>;
export type GetMembershipSuspenseQueryHookResult = ReturnType<typeof useGetMembershipSuspenseQuery>;
export type GetMembershipQueryResult = Apollo.QueryResult<GetMembershipQuery, GetMembershipQueryVariables>;
export const GetCoachRequestsDocument = gql`
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

/**
 * __useGetCoachRequestsQuery__
 *
 * To run a query within a React component, call `useGetCoachRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCoachRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCoachRequestsQuery({
 *   variables: {
 *      coachId: // value for 'coachId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetCoachRequestsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetCoachRequestsQuery, GetCoachRequestsQueryVariables> & ({ variables: GetCoachRequestsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>(GetCoachRequestsDocument, options);
      }
export function useGetCoachRequestsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>(GetCoachRequestsDocument, options);
        }
// @ts-ignore
export function useGetCoachRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>;
export function useGetCoachRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachRequestsQuery | undefined, GetCoachRequestsQueryVariables>;
export function useGetCoachRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>(GetCoachRequestsDocument, options);
        }
export type GetCoachRequestsQueryHookResult = ReturnType<typeof useGetCoachRequestsQuery>;
export type GetCoachRequestsLazyQueryHookResult = ReturnType<typeof useGetCoachRequestsLazyQuery>;
export type GetCoachRequestsSuspenseQueryHookResult = ReturnType<typeof useGetCoachRequestsSuspenseQuery>;
export type GetCoachRequestsQueryResult = Apollo.QueryResult<GetCoachRequestsQuery, GetCoachRequestsQueryVariables>;
export const GetSessionLogsForRatingDocument = gql`
    query GetSessionLogsForRating($clientId: ID!, $goalId: ID!, $startDate: String!, $endDate: String!) {
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

/**
 * __useGetSessionLogsForRatingQuery__
 *
 * To run a query within a React component, call `useGetSessionLogsForRatingQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionLogsForRatingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionLogsForRatingQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *      goalId: // value for 'goalId'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetSessionLogsForRatingQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables> & ({ variables: GetSessionLogsForRatingQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>(GetSessionLogsForRatingDocument, options);
      }
export function useGetSessionLogsForRatingLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>(GetSessionLogsForRatingDocument, options);
        }
// @ts-ignore
export function useGetSessionLogsForRatingSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>;
export function useGetSessionLogsForRatingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSessionLogsForRatingQuery | undefined, GetSessionLogsForRatingQueryVariables>;
export function useGetSessionLogsForRatingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>(GetSessionLogsForRatingDocument, options);
        }
export type GetSessionLogsForRatingQueryHookResult = ReturnType<typeof useGetSessionLogsForRatingQuery>;
export type GetSessionLogsForRatingLazyQueryHookResult = ReturnType<typeof useGetSessionLogsForRatingLazyQuery>;
export type GetSessionLogsForRatingSuspenseQueryHookResult = ReturnType<typeof useGetSessionLogsForRatingSuspenseQuery>;
export type GetSessionLogsForRatingQueryResult = Apollo.QueryResult<GetSessionLogsForRatingQuery, GetSessionLogsForRatingQueryVariables>;
export const GetProgressRatingsDocument = gql`
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

/**
 * __useGetProgressRatingsQuery__
 *
 * To run a query within a React component, call `useGetProgressRatingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProgressRatingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProgressRatingsQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *      goalId: // value for 'goalId'
 *   },
 * });
 */
export function useGetProgressRatingsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProgressRatingsQuery, GetProgressRatingsQueryVariables> & ({ variables: GetProgressRatingsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>(GetProgressRatingsDocument, options);
      }
export function useGetProgressRatingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>(GetProgressRatingsDocument, options);
        }
// @ts-ignore
export function useGetProgressRatingsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>;
export function useGetProgressRatingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetProgressRatingsQuery | undefined, GetProgressRatingsQueryVariables>;
export function useGetProgressRatingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>(GetProgressRatingsDocument, options);
        }
export type GetProgressRatingsQueryHookResult = ReturnType<typeof useGetProgressRatingsQuery>;
export type GetProgressRatingsLazyQueryHookResult = ReturnType<typeof useGetProgressRatingsLazyQuery>;
export type GetProgressRatingsSuspenseQueryHookResult = ReturnType<typeof useGetProgressRatingsSuspenseQuery>;
export type GetProgressRatingsQueryResult = Apollo.QueryResult<GetProgressRatingsQuery, GetProgressRatingsQueryVariables>;
export const GetCoachRatingsDocument = gql`
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

/**
 * __useGetCoachRatingsQuery__
 *
 * To run a query within a React component, call `useGetCoachRatingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCoachRatingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCoachRatingsQuery({
 *   variables: {
 *      coachId: // value for 'coachId'
 *   },
 * });
 */
export function useGetCoachRatingsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetCoachRatingsQuery, GetCoachRatingsQueryVariables> & ({ variables: GetCoachRatingsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>(GetCoachRatingsDocument, options);
      }
export function useGetCoachRatingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>(GetCoachRatingsDocument, options);
        }
// @ts-ignore
export function useGetCoachRatingsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>;
export function useGetCoachRatingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetCoachRatingsQuery | undefined, GetCoachRatingsQueryVariables>;
export function useGetCoachRatingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>(GetCoachRatingsDocument, options);
        }
export type GetCoachRatingsQueryHookResult = ReturnType<typeof useGetCoachRatingsQuery>;
export type GetCoachRatingsLazyQueryHookResult = ReturnType<typeof useGetCoachRatingsLazyQuery>;
export type GetCoachRatingsSuspenseQueryHookResult = ReturnType<typeof useGetCoachRatingsSuspenseQuery>;
export type GetCoachRatingsQueryResult = Apollo.QueryResult<GetCoachRatingsQuery, GetCoachRatingsQueryVariables>;
export const GetClientRequestsDocument = gql`
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

/**
 * __useGetClientRequestsQuery__
 *
 * To run a query within a React component, call `useGetClientRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetClientRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetClientRequestsQuery({
 *   variables: {
 *      clientId: // value for 'clientId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetClientRequestsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetClientRequestsQuery, GetClientRequestsQueryVariables> & ({ variables: GetClientRequestsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetClientRequestsQuery, GetClientRequestsQueryVariables>(GetClientRequestsDocument, options);
      }
export function useGetClientRequestsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetClientRequestsQuery, GetClientRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetClientRequestsQuery, GetClientRequestsQueryVariables>(GetClientRequestsDocument, options);
        }
// @ts-ignore
export function useGetClientRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetClientRequestsQuery, GetClientRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetClientRequestsQuery, GetClientRequestsQueryVariables>;
export function useGetClientRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetClientRequestsQuery, GetClientRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetClientRequestsQuery | undefined, GetClientRequestsQueryVariables>;
export function useGetClientRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetClientRequestsQuery, GetClientRequestsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetClientRequestsQuery, GetClientRequestsQueryVariables>(GetClientRequestsDocument, options);
        }
export type GetClientRequestsQueryHookResult = ReturnType<typeof useGetClientRequestsQuery>;
export type GetClientRequestsLazyQueryHookResult = ReturnType<typeof useGetClientRequestsLazyQuery>;
export type GetClientRequestsSuspenseQueryHookResult = ReturnType<typeof useGetClientRequestsSuspenseQuery>;
export type GetClientRequestsQueryResult = Apollo.QueryResult<GetClientRequestsQuery, GetClientRequestsQueryVariables>;
export const GetMySubscriptionRequestsDocument = gql`
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

/**
 * __useGetMySubscriptionRequestsQuery__
 *
 * To run a query within a React component, call `useGetMySubscriptionRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMySubscriptionRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMySubscriptionRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMySubscriptionRequestsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>(GetMySubscriptionRequestsDocument, options);
      }
export function useGetMySubscriptionRequestsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>(GetMySubscriptionRequestsDocument, options);
        }
// @ts-ignore
export function useGetMySubscriptionRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>;
export function useGetMySubscriptionRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMySubscriptionRequestsQuery | undefined, GetMySubscriptionRequestsQueryVariables>;
export function useGetMySubscriptionRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>(GetMySubscriptionRequestsDocument, options);
        }
export type GetMySubscriptionRequestsQueryHookResult = ReturnType<typeof useGetMySubscriptionRequestsQuery>;
export type GetMySubscriptionRequestsLazyQueryHookResult = ReturnType<typeof useGetMySubscriptionRequestsLazyQuery>;
export type GetMySubscriptionRequestsSuspenseQueryHookResult = ReturnType<typeof useGetMySubscriptionRequestsSuspenseQuery>;
export type GetMySubscriptionRequestsQueryResult = Apollo.QueryResult<GetMySubscriptionRequestsQuery, GetMySubscriptionRequestsQueryVariables>;
export const GetFitnessGoalTypesDocument = gql`
    query GetFitnessGoalTypes {
  getFitnessGoalTypes
}
    `;

/**
 * __useGetFitnessGoalTypesQuery__
 *
 * To run a query within a React component, call `useGetFitnessGoalTypesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFitnessGoalTypesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFitnessGoalTypesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFitnessGoalTypesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>(GetFitnessGoalTypesDocument, options);
      }
export function useGetFitnessGoalTypesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>(GetFitnessGoalTypesDocument, options);
        }
// @ts-ignore
export function useGetFitnessGoalTypesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>;
export function useGetFitnessGoalTypesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFitnessGoalTypesQuery | undefined, GetFitnessGoalTypesQueryVariables>;
export function useGetFitnessGoalTypesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>(GetFitnessGoalTypesDocument, options);
        }
export type GetFitnessGoalTypesQueryHookResult = ReturnType<typeof useGetFitnessGoalTypesQuery>;
export type GetFitnessGoalTypesLazyQueryHookResult = ReturnType<typeof useGetFitnessGoalTypesLazyQuery>;
export type GetFitnessGoalTypesSuspenseQueryHookResult = ReturnType<typeof useGetFitnessGoalTypesSuspenseQuery>;
export type GetFitnessGoalTypesQueryResult = Apollo.QueryResult<GetFitnessGoalTypesQuery, GetFitnessGoalTypesQueryVariables>;
export const GetAttendanceRecordsDocument = gql`
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

/**
 * __useGetAttendanceRecordsQuery__
 *
 * To run a query within a React component, call `useGetAttendanceRecordsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAttendanceRecordsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAttendanceRecordsQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useGetAttendanceRecordsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>(GetAttendanceRecordsDocument, options);
      }
export function useGetAttendanceRecordsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>(GetAttendanceRecordsDocument, options);
        }
// @ts-ignore
export function useGetAttendanceRecordsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>;
export function useGetAttendanceRecordsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAttendanceRecordsQuery | undefined, GetAttendanceRecordsQueryVariables>;
export function useGetAttendanceRecordsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>(GetAttendanceRecordsDocument, options);
        }
export type GetAttendanceRecordsQueryHookResult = ReturnType<typeof useGetAttendanceRecordsQuery>;
export type GetAttendanceRecordsLazyQueryHookResult = ReturnType<typeof useGetAttendanceRecordsLazyQuery>;
export type GetAttendanceRecordsSuspenseQueryHookResult = ReturnType<typeof useGetAttendanceRecordsSuspenseQuery>;
export type GetAttendanceRecordsQueryResult = Apollo.QueryResult<GetAttendanceRecordsQuery, GetAttendanceRecordsQueryVariables>;
export const GetEquipmentsDocument = gql`
    query GetEquipments {
  getEquipments {
    id
    name
    imageUrl
    description
    notes
    sortOrder
    status
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetEquipmentsQuery__
 *
 * To run a query within a React component, call `useGetEquipmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEquipmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEquipmentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetEquipmentsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetEquipmentsQuery, GetEquipmentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetEquipmentsQuery, GetEquipmentsQueryVariables>(GetEquipmentsDocument, options);
      }
export function useGetEquipmentsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetEquipmentsQuery, GetEquipmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetEquipmentsQuery, GetEquipmentsQueryVariables>(GetEquipmentsDocument, options);
        }
// @ts-ignore
export function useGetEquipmentsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetEquipmentsQuery, GetEquipmentsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetEquipmentsQuery, GetEquipmentsQueryVariables>;
export function useGetEquipmentsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetEquipmentsQuery, GetEquipmentsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetEquipmentsQuery | undefined, GetEquipmentsQueryVariables>;
export function useGetEquipmentsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetEquipmentsQuery, GetEquipmentsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetEquipmentsQuery, GetEquipmentsQueryVariables>(GetEquipmentsDocument, options);
        }
export type GetEquipmentsQueryHookResult = ReturnType<typeof useGetEquipmentsQuery>;
export type GetEquipmentsLazyQueryHookResult = ReturnType<typeof useGetEquipmentsLazyQuery>;
export type GetEquipmentsSuspenseQueryHookResult = ReturnType<typeof useGetEquipmentsSuspenseQuery>;
export type GetEquipmentsQueryResult = Apollo.QueryResult<GetEquipmentsQuery, GetEquipmentsQueryVariables>;