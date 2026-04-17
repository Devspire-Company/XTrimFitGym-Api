import { GraphQLResolveInfo } from 'graphql';
import { IAuthContext } from '../context/auth-context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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

export enum ClassEnrollmentStatus {
  Accepted = 'accepted',
  Declined = 'declined',
  Invited = 'invited',
  Pending = 'pending',
  Rejected = 'rejected'
}

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

export enum CoachRequestStatus {
  Approved = 'approved',
  Denied = 'denied',
  Pending = 'pending'
}

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
  acquiredAt?: InputMaybe<Scalars['String']['input']>;
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
  /** Development-only fallback email verification code used when Clerk email quota is exceeded. */
  devVerificationCode?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<Scalars['String']['input']>;
  guardianIdVerificationPhotoUrl?: InputMaybe<Scalars['String']['input']>;
  heardFrom?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastName: Scalars['String']['input'];
  membershipDetails?: InputMaybe<MemberDetailsInput>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  minorLiabilityWaiverPrintedName?: InputMaybe<Scalars['String']['input']>;
  minorLiabilityWaiverSignatureUrl?: InputMaybe<Scalars['String']['input']>;
  /**
   * Password is optional for Clerk-based admin creation (backend generates one).
   * Legacy email/password auth still uses this field.
   */
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  role: RoleType;
};

export type CreateWalkInClientInput = {
  ageYears: Scalars['Int']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  gender: WalkInGender;
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  /** Required when ageYears is under 18: admin confirms guardian waiver on file. */
  minorWaiverAcknowledged?: InputMaybe<Scalars['Boolean']['input']>;
  /** Parent/guardian full name when under 18. */
  minorWaiverGuardianName?: InputMaybe<Scalars['String']['input']>;
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
  /** Override plan length: months from startedAt for monthly/quarterly/yearly plans; **calendar days** for DAILY plans. Defaults to the plan's monthDuration. */
  monthDuration?: InputMaybe<Scalars['Int']['input']>;
  /** When the subscription started (e.g. legacy walk-in). Defaults to now. ISO-8601 string. */
  startedAt?: InputMaybe<Scalars['String']['input']>;
};

export enum DurationType {
  /** Fixed calendar-day promos (plan `monthDuration` = number of days). */
  Daily = 'DAILY',
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Yearly = 'YEARLY'
}

export type Equipment = {
  __typename?: 'Equipment';
  acquiredAt?: Maybe<Scalars['String']['output']>;
  archiveReason?: Maybe<Scalars['String']['output']>;
  archivedAt?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  isArchived: Scalars['Boolean']['output'];
  lifecycleLogs: Array<EquipmentLifecycleLog>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  sortOrder: Scalars['Int']['output'];
  status: EquipmentStatus;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type EquipmentLifecycleLog = {
  __typename?: 'EquipmentLifecycleLog';
  action: Scalars['String']['output'];
  changedAt: Scalars['String']['output'];
  changedById?: Maybe<Scalars['ID']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  status?: Maybe<EquipmentStatus>;
};

export enum EquipmentStatus {
  Available = 'AVAILABLE',
  Damaged = 'DAMAGED',
  Undermaintenance = 'UNDERMAINTENANCE'
}

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

export enum GoalStatus {
  Active = 'active',
  Cancelled = 'cancelled',
  Completed = 'completed',
  Paused = 'paused'
}

export type LogReportDownloadInput = {
  dateRange?: InputMaybe<ReportDownloadDateRangeInput>;
  fileName?: InputMaybe<Scalars['String']['input']>;
  filterSummary?: InputMaybe<Scalars['String']['input']>;
  metadataJson?: InputMaybe<Scalars['String']['input']>;
  reportType: ReportType;
};

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
  /** Member completed gym/facility biometric enrollment (mobile + web). */
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

export enum MembershipStatus {
  Active = 'ACTIVE',
  ComingSoon = 'COMING_SOON',
  Inactive = 'INACTIVE'
}

export type MembershipTransaction = {
  __typename?: 'MembershipTransaction';
  canceledAt?: Maybe<Scalars['String']['output']>;
  canceledById?: Maybe<Scalars['ID']['output']>;
  canceledReason?: Maybe<Scalars['String']['output']>;
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  /** When set, subscription length is day-based from startedAt (promo / daily plans). */
  dayDuration?: Maybe<Scalars['Int']['output']>;
  expiresAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastAdjustedAt?: Maybe<Scalars['String']['output']>;
  lastAdjustedById?: Maybe<Scalars['ID']['output']>;
  lastAdjustedReason?: Maybe<Scalars['String']['output']>;
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
  archiveEquipment: Equipment;
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
  disableUser?: Maybe<User>;
  enableUser?: Maybe<User>;
  inviteClientsToClassSession: Session;
  leaveClassSession: Session;
  logReportDownload: ReportDownloadLog;
  login: AuthResponse;
  markAllMyNotificationsRead: Scalars['Boolean']['output'];
  markNotificationRead: Notification;
  purchaseMembership: MembershipTransaction;
  rejectSubscriptionRequest: Scalars['Boolean']['output'];
  removeClient: Scalars['Boolean']['output'];
  removeClientFromClassSession: Session;
  requestDevEmailVerificationCode: Scalars['Boolean']['output'];
  requestToJoinClassSession: Session;
  respondToClassInvitation: Session;
  unarchiveEquipment: Equipment;
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


export type MutationArchiveEquipmentArgs = {
  id: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationAssignCoachToGoalArgs = {
  goalId: Scalars['ID']['input'];
};


export type MutationCancelCoachRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelMembershipArgs = {
  reason: Scalars['String']['input'];
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


export type MutationDisableUserArgs = {
  id: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationEnableUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationInviteClientsToClassSessionArgs = {
  clientIds: Array<Scalars['ID']['input']>;
  sessionId: Scalars['ID']['input'];
};


export type MutationLeaveClassSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationLogReportDownloadArgs = {
  input: LogReportDownloadInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
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


export type MutationRequestDevEmailVerificationCodeArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestToJoinClassSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationRespondToClassInvitationArgs = {
  accept: Scalars['Boolean']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationUnarchiveEquipmentArgs = {
  id: Scalars['ID']['input'];
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

export type Notification = {
  __typename?: 'Notification';
  createdAt?: Maybe<Scalars['String']['output']>;
  dedupeKey: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isRead: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
  metadataJson?: Maybe<Scalars['String']['output']>;
  readAt?: Maybe<Scalars['String']['output']>;
  recipientId: Scalars['ID']['output'];
  recipientRole: RoleType;
  title: Scalars['String']['output'];
  type: NotificationType;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export enum NotificationType {
  Inactivity = 'INACTIVITY',
  MembershipExpiring = 'MEMBERSHIP_EXPIRING'
}

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

export enum ProgressVerdict {
  Achieved = 'achieved',
  CloseToAchievement = 'close_to_achievement',
  Progressive = 'progressive',
  Regressing = 'regressing'
}

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
  getMyNotifications: Array<Notification>;
  getMySubscriptionRequests: Array<SubscriptionRequest>;
  getPendingCoachRequests: Array<CoachRequest>;
  getPendingSubscriptionRequests: Array<SubscriptionRequest>;
  getProgressRatings: Array<ProgressRating>;
  getReportDownloadLogs: Array<ReportDownloadLog>;
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


export type QueryGetEquipmentsArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
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


export type QueryGetMyNotificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetProgressRatingsArgs = {
  clientId: Scalars['ID']['input'];
  goalId: Scalars['ID']['input'];
};


export type QueryGetReportDownloadLogsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  reportType?: InputMaybe<ReportType>;
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
  includeDisabled?: InputMaybe<Scalars['Boolean']['input']>;
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

export type ReportDownloadDateRange = {
  __typename?: 'ReportDownloadDateRange';
  endDate?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
};

export type ReportDownloadDateRangeInput = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type ReportDownloadLog = {
  __typename?: 'ReportDownloadLog';
  createdAt?: Maybe<Scalars['String']['output']>;
  dateRange?: Maybe<ReportDownloadDateRange>;
  downloadedBy?: Maybe<User>;
  downloadedById: Scalars['ID']['output'];
  downloadedByRole: RoleType;
  fileName?: Maybe<Scalars['String']['output']>;
  filterSummary?: Maybe<Scalars['String']['output']>;
  format: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadataJson?: Maybe<Scalars['String']['output']>;
  reportType: ReportType;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export enum ReportType {
  Attendance = 'ATTENDANCE',
  Equipment = 'EQUIPMENT',
  NearEndingMemberships = 'NEAR_ENDING_MEMBERSHIPS',
  Revenue = 'REVENUE',
  WalkIn = 'WALK_IN'
}

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

export enum RoleType {
  Admin = 'admin',
  Coach = 'coach',
  Member = 'member'
}

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

export enum SessionKind {
  GroupClass = 'group_class',
  Personal = 'personal'
}

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

export enum SessionStatus {
  Cancelled = 'cancelled',
  Completed = 'completed',
  Scheduled = 'scheduled'
}

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

export enum SubscriptionRequestStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum TransactionStatus {
  Active = 'ACTIVE',
  Canceled = 'CANCELED',
  Expired = 'EXPIRED'
}

export type UpdateCoachRequestInput = {
  status: CoachRequestStatus;
};

export type UpdateEquipmentInput = {
  acquiredAt?: InputMaybe<Scalars['String']['input']>;
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
  /** New total calendar days from startedAt (recalculates expiresAt). Omit when using monthDuration. */
  dayDuration?: InputMaybe<Scalars['Int']['input']>;
  /** New total months from the transaction's startedAt (recalculates expiresAt). Omit when using dayDuration. */
  monthDuration?: InputMaybe<Scalars['Int']['input']>;
  /** Required audit reason for changing length/start date. */
  reason: Scalars['String']['input'];
  /** Optional ISO 8601 start datetime. When set, replaces the transaction startedAt and recalculates expiresAt from it (walk-ins / legacy corrections). Omit to keep the existing start date. */
  startedAt?: InputMaybe<Scalars['String']['input']>;
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
  coachDetails?: InputMaybe<CoachDetailsInput>;
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  guardianIdVerificationPhotoUrl?: InputMaybe<Scalars['String']['input']>;
  heardFrom?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  membershipDetails?: InputMaybe<MemberDetailsInput>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  minorLiabilityWaiverPrintedName?: InputMaybe<Scalars['String']['input']>;
  minorLiabilityWaiverSignatureUrl?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWalkInClientInput = {
  ageYears: Scalars['Int']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  gender: WalkInGender;
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  minorWaiverAcknowledged?: InputMaybe<Scalars['Boolean']['input']>;
  minorWaiverGuardianName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  agreedToLiabilityWaiver?: Maybe<Scalars['Boolean']['output']>;
  agreedToPrivacyPolicy?: Maybe<Scalars['Boolean']['output']>;
  agreedToTermsAndConditions?: Maybe<Scalars['Boolean']['output']>;
  attendanceId?: Maybe<Scalars['Int']['output']>;
  coachDetails?: Maybe<CoachDetails>;
  createdAt?: Maybe<Scalars['String']['output']>;
  currentMembership?: Maybe<MembershipTransaction>;
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  disableReason?: Maybe<Scalars['String']['output']>;
  disabledAt?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender: Scalars['String']['output'];
  guardianIdVerificationPhotoUrl?: Maybe<Scalars['String']['output']>;
  heardFrom?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  isDisabled: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  loginHistory?: Maybe<Array<Maybe<LoginHistoryEntry>>>;
  membershipDetails?: Maybe<MemberDetails>;
  middleName?: Maybe<Scalars['String']['output']>;
  minorLiabilityWaiverPrintedName?: Maybe<Scalars['String']['output']>;
  minorLiabilityWaiverSignatureUrl?: Maybe<Scalars['String']['output']>;
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
  /** Age in whole years (admin-entered). */
  ageYears?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  gender: WalkInGender;
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  middleName?: Maybe<Scalars['String']['output']>;
  /** When the guardian liability waiver was recorded (ISO). */
  minorWaiverAcceptedAt?: Maybe<Scalars['String']['output']>;
  /** Parent/guardian name on file when under 18 with waiver. */
  minorWaiverGuardianName?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export enum WalkInGender {
  Female = 'FEMALE',
  Male = 'MALE',
  NonBinary = 'NON_BINARY',
  PreferNotToSay = 'PREFER_NOT_TO_SAY'
}

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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Analytics: ResolverTypeWrapper<Partial<Analytics>>;
  ApproveSubscriptionRequestInput: ResolverTypeWrapper<Partial<ApproveSubscriptionRequestInput>>;
  AttendanceConnection: ResolverTypeWrapper<Partial<AttendanceConnection>>;
  AttendanceFilter: ResolverTypeWrapper<Partial<AttendanceFilter>>;
  AttendancePagination: ResolverTypeWrapper<Partial<AttendancePagination>>;
  AttendanceRecord: ResolverTypeWrapper<Partial<AttendanceRecord>>;
  AuthResponse: ResolverTypeWrapper<Partial<AuthResponse>>;
  Boolean: ResolverTypeWrapper<Partial<Scalars['Boolean']['output']>>;
  ClassEnrollment: ResolverTypeWrapper<Partial<ClassEnrollment>>;
  ClassEnrollmentStatus: ResolverTypeWrapper<Partial<ClassEnrollmentStatus>>;
  CoachDetails: ResolverTypeWrapper<Partial<CoachDetails>>;
  CoachDetailsInput: ResolverTypeWrapper<Partial<CoachDetailsInput>>;
  CoachRating: ResolverTypeWrapper<Partial<CoachRating>>;
  CoachRequest: ResolverTypeWrapper<Partial<CoachRequest>>;
  CoachRequestStatus: ResolverTypeWrapper<Partial<CoachRequestStatus>>;
  ConfirmSessionCompletionInput: ResolverTypeWrapper<Partial<ConfirmSessionCompletionInput>>;
  CreateCoachRatingInput: ResolverTypeWrapper<Partial<CreateCoachRatingInput>>;
  CreateCoachRequestInput: ResolverTypeWrapper<Partial<CreateCoachRequestInput>>;
  CreateEquipmentInput: ResolverTypeWrapper<Partial<CreateEquipmentInput>>;
  CreateGoalInput: ResolverTypeWrapper<Partial<CreateGoalInput>>;
  CreateMembershipInput: ResolverTypeWrapper<Partial<CreateMembershipInput>>;
  CreateProgressRatingInput: ResolverTypeWrapper<Partial<CreateProgressRatingInput>>;
  CreateSessionFromTemplateInput: ResolverTypeWrapper<Partial<CreateSessionFromTemplateInput>>;
  CreateSessionInput: ResolverTypeWrapper<Partial<CreateSessionInput>>;
  CreateSessionLogInput: ResolverTypeWrapper<Partial<CreateSessionLogInput>>;
  CreateSubscriptionRequestInput: ResolverTypeWrapper<Partial<CreateSubscriptionRequestInput>>;
  CreateUserInput: ResolverTypeWrapper<Partial<CreateUserInput>>;
  CreateWalkInClientInput: ResolverTypeWrapper<Partial<CreateWalkInClientInput>>;
  CreateWalkInClientResult: ResolverTypeWrapper<Partial<CreateWalkInClientResult>>;
  DateRangeInput: ResolverTypeWrapper<Partial<DateRangeInput>>;
  DirectSubscribeInput: ResolverTypeWrapper<Partial<DirectSubscribeInput>>;
  DurationType: ResolverTypeWrapper<Partial<DurationType>>;
  Equipment: ResolverTypeWrapper<Partial<Equipment>>;
  EquipmentLifecycleLog: ResolverTypeWrapper<Partial<EquipmentLifecycleLog>>;
  EquipmentStatus: ResolverTypeWrapper<Partial<EquipmentStatus>>;
  Float: ResolverTypeWrapper<Partial<Scalars['Float']['output']>>;
  Goal: ResolverTypeWrapper<Partial<Goal>>;
  GoalStatus: ResolverTypeWrapper<Partial<GoalStatus>>;
  ID: ResolverTypeWrapper<Partial<Scalars['ID']['output']>>;
  Int: ResolverTypeWrapper<Partial<Scalars['Int']['output']>>;
  LogReportDownloadInput: ResolverTypeWrapper<Partial<LogReportDownloadInput>>;
  LoginHistoryEntry: ResolverTypeWrapper<Partial<LoginHistoryEntry>>;
  LoginInput: ResolverTypeWrapper<Partial<LoginInput>>;
  MemberDetails: ResolverTypeWrapper<Partial<MemberDetails>>;
  MemberDetailsInput: ResolverTypeWrapper<Partial<MemberDetailsInput>>;
  Membership: ResolverTypeWrapper<Partial<Membership>>;
  MembershipRevenue: ResolverTypeWrapper<Partial<MembershipRevenue>>;
  MembershipStatus: ResolverTypeWrapper<Partial<MembershipStatus>>;
  MembershipTransaction: ResolverTypeWrapper<Partial<MembershipTransaction>>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Notification: ResolverTypeWrapper<Partial<Notification>>;
  NotificationType: ResolverTypeWrapper<Partial<NotificationType>>;
  PeriodRevenue: ResolverTypeWrapper<Partial<PeriodRevenue>>;
  ProgressImages: ResolverTypeWrapper<Partial<ProgressImages>>;
  ProgressImagesInput: ResolverTypeWrapper<Partial<ProgressImagesInput>>;
  ProgressRating: ResolverTypeWrapper<Partial<ProgressRating>>;
  ProgressVerdict: ResolverTypeWrapper<Partial<ProgressVerdict>>;
  PurchaseMembershipInput: ResolverTypeWrapper<Partial<PurchaseMembershipInput>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RejectSubscriptionRequestInput: ResolverTypeWrapper<Partial<RejectSubscriptionRequestInput>>;
  ReportDownloadDateRange: ResolverTypeWrapper<Partial<ReportDownloadDateRange>>;
  ReportDownloadDateRangeInput: ResolverTypeWrapper<Partial<ReportDownloadDateRangeInput>>;
  ReportDownloadLog: ResolverTypeWrapper<Partial<ReportDownloadLog>>;
  ReportType: ResolverTypeWrapper<Partial<ReportType>>;
  RevenueSummary: ResolverTypeWrapper<Partial<RevenueSummary>>;
  RoleType: ResolverTypeWrapper<Partial<RoleType>>;
  Session: ResolverTypeWrapper<Partial<Session>>;
  SessionKind: ResolverTypeWrapper<Partial<SessionKind>>;
  SessionLog: ResolverTypeWrapper<Partial<SessionLog>>;
  SessionStatus: ResolverTypeWrapper<Partial<SessionStatus>>;
  String: ResolverTypeWrapper<Partial<Scalars['String']['output']>>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SubscriptionRequest: ResolverTypeWrapper<Partial<SubscriptionRequest>>;
  SubscriptionRequestStatus: ResolverTypeWrapper<Partial<SubscriptionRequestStatus>>;
  TransactionStatus: ResolverTypeWrapper<Partial<TransactionStatus>>;
  UpdateCoachRequestInput: ResolverTypeWrapper<Partial<UpdateCoachRequestInput>>;
  UpdateEquipmentInput: ResolverTypeWrapper<Partial<UpdateEquipmentInput>>;
  UpdateGoalInput: ResolverTypeWrapper<Partial<UpdateGoalInput>>;
  UpdateMembershipInput: ResolverTypeWrapper<Partial<UpdateMembershipInput>>;
  UpdateMembershipTransactionDurationInput: ResolverTypeWrapper<Partial<UpdateMembershipTransactionDurationInput>>;
  UpdateProgressRatingInput: ResolverTypeWrapper<Partial<UpdateProgressRatingInput>>;
  UpdateSessionInput: ResolverTypeWrapper<Partial<UpdateSessionInput>>;
  UpdateUserInput: ResolverTypeWrapper<Partial<UpdateUserInput>>;
  UpdateWalkInClientInput: ResolverTypeWrapper<Partial<UpdateWalkInClientInput>>;
  User: ResolverTypeWrapper<Partial<User>>;
  WalkInAccountRow: ResolverTypeWrapper<Partial<WalkInAccountRow>>;
  WalkInAccountsOverview: ResolverTypeWrapper<Partial<WalkInAccountsOverview>>;
  WalkInAttendanceLog: ResolverTypeWrapper<Partial<WalkInAttendanceLog>>;
  WalkInClient: ResolverTypeWrapper<Partial<WalkInClient>>;
  WalkInGender: ResolverTypeWrapper<Partial<WalkInGender>>;
  WalkInLogsConnection: ResolverTypeWrapper<Partial<WalkInLogsConnection>>;
  WalkInLogsFilter: ResolverTypeWrapper<Partial<WalkInLogsFilter>>;
  WalkInPagination: ResolverTypeWrapper<Partial<WalkInPagination>>;
  WalkInPaymentSettings: ResolverTypeWrapper<Partial<WalkInPaymentSettings>>;
  WalkInStats: ResolverTypeWrapper<Partial<WalkInStats>>;
  WeightProgress: ResolverTypeWrapper<Partial<WeightProgress>>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Analytics: Partial<Analytics>;
  ApproveSubscriptionRequestInput: Partial<ApproveSubscriptionRequestInput>;
  AttendanceConnection: Partial<AttendanceConnection>;
  AttendanceFilter: Partial<AttendanceFilter>;
  AttendancePagination: Partial<AttendancePagination>;
  AttendanceRecord: Partial<AttendanceRecord>;
  AuthResponse: Partial<AuthResponse>;
  Boolean: Partial<Scalars['Boolean']['output']>;
  ClassEnrollment: Partial<ClassEnrollment>;
  CoachDetails: Partial<CoachDetails>;
  CoachDetailsInput: Partial<CoachDetailsInput>;
  CoachRating: Partial<CoachRating>;
  CoachRequest: Partial<CoachRequest>;
  ConfirmSessionCompletionInput: Partial<ConfirmSessionCompletionInput>;
  CreateCoachRatingInput: Partial<CreateCoachRatingInput>;
  CreateCoachRequestInput: Partial<CreateCoachRequestInput>;
  CreateEquipmentInput: Partial<CreateEquipmentInput>;
  CreateGoalInput: Partial<CreateGoalInput>;
  CreateMembershipInput: Partial<CreateMembershipInput>;
  CreateProgressRatingInput: Partial<CreateProgressRatingInput>;
  CreateSessionFromTemplateInput: Partial<CreateSessionFromTemplateInput>;
  CreateSessionInput: Partial<CreateSessionInput>;
  CreateSessionLogInput: Partial<CreateSessionLogInput>;
  CreateSubscriptionRequestInput: Partial<CreateSubscriptionRequestInput>;
  CreateUserInput: Partial<CreateUserInput>;
  CreateWalkInClientInput: Partial<CreateWalkInClientInput>;
  CreateWalkInClientResult: Partial<CreateWalkInClientResult>;
  DateRangeInput: Partial<DateRangeInput>;
  DirectSubscribeInput: Partial<DirectSubscribeInput>;
  Equipment: Partial<Equipment>;
  EquipmentLifecycleLog: Partial<EquipmentLifecycleLog>;
  Float: Partial<Scalars['Float']['output']>;
  Goal: Partial<Goal>;
  ID: Partial<Scalars['ID']['output']>;
  Int: Partial<Scalars['Int']['output']>;
  LogReportDownloadInput: Partial<LogReportDownloadInput>;
  LoginHistoryEntry: Partial<LoginHistoryEntry>;
  LoginInput: Partial<LoginInput>;
  MemberDetails: Partial<MemberDetails>;
  MemberDetailsInput: Partial<MemberDetailsInput>;
  Membership: Partial<Membership>;
  MembershipRevenue: Partial<MembershipRevenue>;
  MembershipTransaction: Partial<MembershipTransaction>;
  Mutation: Record<PropertyKey, never>;
  Notification: Partial<Notification>;
  PeriodRevenue: Partial<PeriodRevenue>;
  ProgressImages: Partial<ProgressImages>;
  ProgressImagesInput: Partial<ProgressImagesInput>;
  ProgressRating: Partial<ProgressRating>;
  PurchaseMembershipInput: Partial<PurchaseMembershipInput>;
  Query: Record<PropertyKey, never>;
  RejectSubscriptionRequestInput: Partial<RejectSubscriptionRequestInput>;
  ReportDownloadDateRange: Partial<ReportDownloadDateRange>;
  ReportDownloadDateRangeInput: Partial<ReportDownloadDateRangeInput>;
  ReportDownloadLog: Partial<ReportDownloadLog>;
  RevenueSummary: Partial<RevenueSummary>;
  Session: Partial<Session>;
  SessionLog: Partial<SessionLog>;
  String: Partial<Scalars['String']['output']>;
  Subscription: Record<PropertyKey, never>;
  SubscriptionRequest: Partial<SubscriptionRequest>;
  UpdateCoachRequestInput: Partial<UpdateCoachRequestInput>;
  UpdateEquipmentInput: Partial<UpdateEquipmentInput>;
  UpdateGoalInput: Partial<UpdateGoalInput>;
  UpdateMembershipInput: Partial<UpdateMembershipInput>;
  UpdateMembershipTransactionDurationInput: Partial<UpdateMembershipTransactionDurationInput>;
  UpdateProgressRatingInput: Partial<UpdateProgressRatingInput>;
  UpdateSessionInput: Partial<UpdateSessionInput>;
  UpdateUserInput: Partial<UpdateUserInput>;
  UpdateWalkInClientInput: Partial<UpdateWalkInClientInput>;
  User: Partial<User>;
  WalkInAccountRow: Partial<WalkInAccountRow>;
  WalkInAccountsOverview: Partial<WalkInAccountsOverview>;
  WalkInAttendanceLog: Partial<WalkInAttendanceLog>;
  WalkInClient: Partial<WalkInClient>;
  WalkInLogsConnection: Partial<WalkInLogsConnection>;
  WalkInLogsFilter: Partial<WalkInLogsFilter>;
  WalkInPagination: Partial<WalkInPagination>;
  WalkInPaymentSettings: Partial<WalkInPaymentSettings>;
  WalkInStats: Partial<WalkInStats>;
  WeightProgress: Partial<WeightProgress>;
};

export type AnalyticsResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Analytics'] = ResolversParentTypes['Analytics']> = {
  activeSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  canceledSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expiredSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  membershipSubscriptionRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  newSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revenueByMembership?: Resolver<Array<ResolversTypes['MembershipRevenue']>, ParentType, ContextType>;
  totalRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  walkInRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type AttendanceConnectionResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['AttendanceConnection'] = ResolversParentTypes['AttendanceConnection']> = {
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  records?: Resolver<Array<ResolversTypes['AttendanceRecord']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type AttendanceRecordResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['AttendanceRecord'] = ResolversParentTypes['AttendanceRecord']> = {
  authDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  authDateTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  authTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cardNo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deviceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deviceSerNum?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  direction?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  personName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AuthResponseResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['AuthResponse'] = ResolversParentTypes['AuthResponse']> = {
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
};

export type ClassEnrollmentResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['ClassEnrollment'] = ResolversParentTypes['ClassEnrollment']> = {
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ClassEnrollmentStatus'], ParentType, ContextType>;
};

export type CoachDetailsResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['CoachDetails'] = ResolversParentTypes['CoachDetails']> = {
  clientLimit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  clientsIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['ID']>>>, ParentType, ContextType>;
  moreDetails?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ratings?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  sessionsIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['ID']>>>, ParentType, ContextType>;
  specialization?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  teachingDate?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  teachingTime?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  yearsOfExperience?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type CoachRatingResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['CoachRating'] = ResolversParentTypes['CoachRating']> = {
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  rating?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sessionLog?: Resolver<Maybe<ResolversTypes['SessionLog']>, ParentType, ContextType>;
  sessionLogId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CoachRequestResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['CoachRequest'] = ResolversParentTypes['CoachRequest']> = {
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CoachRequestStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CreateWalkInClientResultResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['CreateWalkInClientResult'] = ResolversParentTypes['CreateWalkInClientResult']> = {
  client?: Resolver<ResolversTypes['WalkInClient'], ParentType, ContextType>;
  log?: Resolver<Maybe<ResolversTypes['WalkInAttendanceLog']>, ParentType, ContextType>;
};

export type EquipmentResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Equipment'] = ResolversParentTypes['Equipment']> = {
  acquiredAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  archiveReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  archivedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isArchived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lifecycleLogs?: Resolver<Array<ResolversTypes['EquipmentLifecycleLog']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sortOrder?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EquipmentStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EquipmentLifecycleLogResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['EquipmentLifecycleLog'] = ResolversParentTypes['EquipmentLifecycleLog']> = {
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  changedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  changedById?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['EquipmentStatus']>, ParentType, ContextType>;
};

export type GoalResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Goal'] = ResolversParentTypes['Goal']> = {
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  currentWeight?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  goalType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['GoalStatus'], ParentType, ContextType>;
  targetDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  targetWeight?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LoginHistoryEntryResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['LoginHistoryEntry'] = ResolversParentTypes['LoginHistoryEntry']> = {
  ipAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  loginAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userAgent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MemberDetailsResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['MemberDetails'] = ResolversParentTypes['MemberDetails']> = {
  coachesIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['ID']>>>, ParentType, ContextType>;
  facilityBiometricEnrollmentComplete?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  fitnessGoal?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  hasEnteredDetails?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  membershipId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  membershipTransaction?: Resolver<Maybe<ResolversTypes['MembershipTransaction']>, ParentType, ContextType>;
  physiqueGoalType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workOutTime?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
};

export type MembershipResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Membership'] = ResolversParentTypes['Membership']> = {
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  durationType?: Resolver<ResolversTypes['DurationType'], ParentType, ContextType>;
  features?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  monthDuration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  monthlyPrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MembershipStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MembershipRevenueResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['MembershipRevenue'] = ResolversParentTypes['MembershipRevenue']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  membershipId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  membershipName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  revenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type MembershipTransactionResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['MembershipTransaction'] = ResolversParentTypes['MembershipTransaction']> = {
  canceledAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  canceledById?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  canceledReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dayDuration?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastAdjustedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastAdjustedById?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  lastAdjustedReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  membership?: Resolver<Maybe<ResolversTypes['Membership']>, ParentType, ContextType>;
  membershipId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  monthDuration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  priceAtPurchase?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TransactionStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MutationResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  approveSubscriptionRequest?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationApproveSubscriptionRequestArgs, 'input'>>;
  archiveEquipment?: Resolver<ResolversTypes['Equipment'], ParentType, ContextType, RequireFields<MutationArchiveEquipmentArgs, 'id' | 'reason'>>;
  assignCoachToGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationAssignCoachToGoalArgs, 'goalId'>>;
  cancelCoachRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelCoachRequestArgs, 'id'>>;
  cancelMembership?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelMembershipArgs, 'reason' | 'transactionId'>>;
  cancelSession?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelSessionArgs, 'id'>>;
  clientConfirmWeight?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationClientConfirmWeightArgs, 'sessionLogId'>>;
  coachRespondToJoinRequest?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationCoachRespondToJoinRequestArgs, 'accept' | 'clientId' | 'sessionId'>>;
  completeSession?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationCompleteSessionArgs, 'input'>>;
  confirmSessionCompletion?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationConfirmSessionCompletionArgs, 'input'>>;
  createCoachRating?: Resolver<ResolversTypes['CoachRating'], ParentType, ContextType, RequireFields<MutationCreateCoachRatingArgs, 'input'>>;
  createCoachRequest?: Resolver<ResolversTypes['CoachRequest'], ParentType, ContextType, RequireFields<MutationCreateCoachRequestArgs, 'input'>>;
  createEquipment?: Resolver<ResolversTypes['Equipment'], ParentType, ContextType, RequireFields<MutationCreateEquipmentArgs, 'input'>>;
  createGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationCreateGoalArgs, 'input'>>;
  createMembership?: Resolver<ResolversTypes['Membership'], ParentType, ContextType, RequireFields<MutationCreateMembershipArgs, 'input'>>;
  createProgressRating?: Resolver<ResolversTypes['ProgressRating'], ParentType, ContextType, RequireFields<MutationCreateProgressRatingArgs, 'input'>>;
  createSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationCreateSessionArgs, 'input'>>;
  createSessionFromTemplate?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationCreateSessionFromTemplateArgs, 'input'>>;
  createSubscriptionRequest?: Resolver<ResolversTypes['SubscriptionRequest'], ParentType, ContextType, RequireFields<MutationCreateSubscriptionRequestArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  createWalkInClient?: Resolver<ResolversTypes['CreateWalkInClientResult'], ParentType, ContextType, RequireFields<MutationCreateWalkInClientArgs, 'input' | 'timeInNow'>>;
  deleteCoachRating?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCoachRatingArgs, 'id'>>;
  deleteEquipment?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEquipmentArgs, 'id'>>;
  deleteGoal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGoalArgs, 'id'>>;
  deleteMembership?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteMembershipArgs, 'id'>>;
  deleteProgressRating?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProgressRatingArgs, 'id'>>;
  deleteSubscriptionRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSubscriptionRequestArgs, 'id'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  directSubscribeMember?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationDirectSubscribeMemberArgs, 'input'>>;
  disableUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationDisableUserArgs, 'id' | 'reason'>>;
  enableUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationEnableUserArgs, 'id'>>;
  inviteClientsToClassSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationInviteClientsToClassSessionArgs, 'clientIds' | 'sessionId'>>;
  leaveClassSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationLeaveClassSessionArgs, 'sessionId'>>;
  logReportDownload?: Resolver<ResolversTypes['ReportDownloadLog'], ParentType, ContextType, RequireFields<MutationLogReportDownloadArgs, 'input'>>;
  login?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'input'>>;
  markAllMyNotificationsRead?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  markNotificationRead?: Resolver<ResolversTypes['Notification'], ParentType, ContextType, RequireFields<MutationMarkNotificationReadArgs, 'id'>>;
  purchaseMembership?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationPurchaseMembershipArgs, 'input'>>;
  rejectSubscriptionRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRejectSubscriptionRequestArgs, 'input'>>;
  removeClient?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveClientArgs, 'clientId'>>;
  removeClientFromClassSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationRemoveClientFromClassSessionArgs, 'clientId' | 'sessionId'>>;
  requestDevEmailVerificationCode?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRequestDevEmailVerificationCodeArgs, 'email'>>;
  requestToJoinClassSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationRequestToJoinClassSessionArgs, 'sessionId'>>;
  respondToClassInvitation?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationRespondToClassInvitationArgs, 'accept' | 'sessionId'>>;
  unarchiveEquipment?: Resolver<ResolversTypes['Equipment'], ParentType, ContextType, RequireFields<MutationUnarchiveEquipmentArgs, 'id'>>;
  updateCoachRating?: Resolver<ResolversTypes['CoachRating'], ParentType, ContextType, RequireFields<MutationUpdateCoachRatingArgs, 'id'>>;
  updateCoachRequest?: Resolver<ResolversTypes['CoachRequest'], ParentType, ContextType, RequireFields<MutationUpdateCoachRequestArgs, 'id' | 'input'>>;
  updateEquipment?: Resolver<ResolversTypes['Equipment'], ParentType, ContextType, RequireFields<MutationUpdateEquipmentArgs, 'id' | 'input'>>;
  updateGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationUpdateGoalArgs, 'id' | 'input'>>;
  updateMembership?: Resolver<ResolversTypes['Membership'], ParentType, ContextType, RequireFields<MutationUpdateMembershipArgs, 'id' | 'input'>>;
  updateMembershipTransactionDuration?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationUpdateMembershipTransactionDurationArgs, 'input'>>;
  updateProgressRating?: Resolver<ResolversTypes['ProgressRating'], ParentType, ContextType, RequireFields<MutationUpdateProgressRatingArgs, 'id' | 'input'>>;
  updateSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationUpdateSessionArgs, 'id' | 'input'>>;
  updateUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
  updateWalkInClient?: Resolver<ResolversTypes['WalkInClient'], ParentType, ContextType, RequireFields<MutationUpdateWalkInClientArgs, 'input' | 'walkInClientId'>>;
  updateWalkInPaymentSettings?: Resolver<ResolversTypes['WalkInPaymentSettings'], ParentType, ContextType, RequireFields<MutationUpdateWalkInPaymentSettingsArgs, 'paymentPesos'>>;
  walkInTimeIn?: Resolver<ResolversTypes['WalkInAttendanceLog'], ParentType, ContextType, RequireFields<MutationWalkInTimeInArgs, 'walkInClientId'>>;
};

export type NotificationResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = {
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dedupeKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isRead?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metadataJson?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  readAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  recipientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  recipientRole?: Resolver<ResolversTypes['RoleType'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['NotificationType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PeriodRevenueResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['PeriodRevenue'] = ResolversParentTypes['PeriodRevenue']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  period?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  revenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  walkInCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  walkInRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type ProgressImagesResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['ProgressImages'] = ResolversParentTypes['ProgressImages']> = {
  back?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  front?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  leftSide?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rightSide?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ProgressRatingResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['ProgressRating'] = ResolversParentTypes['ProgressRating']> = {
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  comment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  goal?: Resolver<Maybe<ResolversTypes['Goal']>, ParentType, ContextType>;
  goalId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  rating?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sessionLogIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  sessionLogs?: Resolver<Maybe<Array<ResolversTypes['SessionLog']>>, ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  verdict?: Resolver<ResolversTypes['ProgressVerdict'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getAllClientGoals?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType, RequireFields<QueryGetAllClientGoalsArgs, 'coachId'>>;
  getAllSubscriptionRequests?: Resolver<Array<ResolversTypes['SubscriptionRequest']>, ParentType, ContextType>;
  getAnalytics?: Resolver<Maybe<ResolversTypes['Analytics']>, ParentType, ContextType, RequireFields<QueryGetAnalyticsArgs, 'date'>>;
  getAnalyticsRange?: Resolver<Array<ResolversTypes['Analytics']>, ParentType, ContextType, RequireFields<QueryGetAnalyticsRangeArgs, 'dateRange'>>;
  getAttendanceRecord?: Resolver<Maybe<ResolversTypes['AttendanceRecord']>, ParentType, ContextType, RequireFields<QueryGetAttendanceRecordArgs, 'id'>>;
  getAttendanceRecords?: Resolver<ResolversTypes['AttendanceConnection'], ParentType, ContextType, Partial<QueryGetAttendanceRecordsArgs>>;
  getClientProgressRatings?: Resolver<Array<ResolversTypes['ProgressRating']>, ParentType, ContextType, RequireFields<QueryGetClientProgressRatingsArgs, 'clientId'>>;
  getClientRequests?: Resolver<Array<ResolversTypes['CoachRequest']>, ParentType, ContextType, RequireFields<QueryGetClientRequestsArgs, 'clientId'>>;
  getClientSessions?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType, RequireFields<QueryGetClientSessionsArgs, 'clientId'>>;
  getCoachProgressRatings?: Resolver<Array<ResolversTypes['ProgressRating']>, ParentType, ContextType, RequireFields<QueryGetCoachProgressRatingsArgs, 'coachId'>>;
  getCoachRatingBySessionLog?: Resolver<Maybe<ResolversTypes['CoachRating']>, ParentType, ContextType, RequireFields<QueryGetCoachRatingBySessionLogArgs, 'sessionLogId'>>;
  getCoachRatings?: Resolver<Array<ResolversTypes['CoachRating']>, ParentType, ContextType, RequireFields<QueryGetCoachRatingsArgs, 'coachId'>>;
  getCoachRequests?: Resolver<Array<ResolversTypes['CoachRequest']>, ParentType, ContextType, RequireFields<QueryGetCoachRequestsArgs, 'coachId'>>;
  getCoachSessionLogs?: Resolver<Array<ResolversTypes['SessionLog']>, ParentType, ContextType, RequireFields<QueryGetCoachSessionLogsArgs, 'coachId'>>;
  getCoachSessions?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType, RequireFields<QueryGetCoachSessionsArgs, 'coachId'>>;
  getCurrentMembership?: Resolver<Maybe<ResolversTypes['MembershipTransaction']>, ParentType, ContextType>;
  getEquipment?: Resolver<Maybe<ResolversTypes['Equipment']>, ParentType, ContextType, RequireFields<QueryGetEquipmentArgs, 'id'>>;
  getEquipments?: Resolver<Array<ResolversTypes['Equipment']>, ParentType, ContextType, Partial<QueryGetEquipmentsArgs>>;
  getFitnessGoalTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  getGoal?: Resolver<Maybe<ResolversTypes['Goal']>, ParentType, ContextType, RequireFields<QueryGetGoalArgs, 'id'>>;
  getGoals?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType, RequireFields<QueryGetGoalsArgs, 'clientId'>>;
  getJoinableGroupClasses?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType>;
  getMembership?: Resolver<Maybe<ResolversTypes['Membership']>, ParentType, ContextType, RequireFields<QueryGetMembershipArgs, 'id'>>;
  getMembershipTransaction?: Resolver<Maybe<ResolversTypes['MembershipTransaction']>, ParentType, ContextType, RequireFields<QueryGetMembershipTransactionArgs, 'id'>>;
  getMemberships?: Resolver<Array<ResolversTypes['Membership']>, ParentType, ContextType, Partial<QueryGetMembershipsArgs>>;
  getMyNotifications?: Resolver<Array<ResolversTypes['Notification']>, ParentType, ContextType, Partial<QueryGetMyNotificationsArgs>>;
  getMySubscriptionRequests?: Resolver<Array<ResolversTypes['SubscriptionRequest']>, ParentType, ContextType>;
  getPendingCoachRequests?: Resolver<Array<ResolversTypes['CoachRequest']>, ParentType, ContextType>;
  getPendingSubscriptionRequests?: Resolver<Array<ResolversTypes['SubscriptionRequest']>, ParentType, ContextType>;
  getProgressRatings?: Resolver<Array<ResolversTypes['ProgressRating']>, ParentType, ContextType, RequireFields<QueryGetProgressRatingsArgs, 'clientId' | 'goalId'>>;
  getReportDownloadLogs?: Resolver<Array<ResolversTypes['ReportDownloadLog']>, ParentType, ContextType, Partial<QueryGetReportDownloadLogsArgs>>;
  getRevenueSummary?: Resolver<ResolversTypes['RevenueSummary'], ParentType, ContextType, Partial<QueryGetRevenueSummaryArgs>>;
  getSession?: Resolver<Maybe<ResolversTypes['Session']>, ParentType, ContextType, RequireFields<QueryGetSessionArgs, 'id'>>;
  getSessionLogBySessionId?: Resolver<Maybe<ResolversTypes['SessionLog']>, ParentType, ContextType, RequireFields<QueryGetSessionLogBySessionIdArgs, 'sessionId'>>;
  getSessionLogs?: Resolver<Array<ResolversTypes['SessionLog']>, ParentType, ContextType, RequireFields<QueryGetSessionLogsArgs, 'clientId'>>;
  getSessionLogsForRating?: Resolver<Array<ResolversTypes['SessionLog']>, ParentType, ContextType, RequireFields<QueryGetSessionLogsForRatingArgs, 'clientId' | 'endDate' | 'goalId' | 'startDate'>>;
  getSessionTemplates?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType, RequireFields<QueryGetSessionTemplatesArgs, 'coachId'>>;
  getSubscriptionRequest?: Resolver<Maybe<ResolversTypes['SubscriptionRequest']>, ParentType, ContextType, RequireFields<QueryGetSubscriptionRequestArgs, 'id'>>;
  getUpcomingSessions?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType>;
  getUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryGetUserArgs, 'id'>>;
  getUsers?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, Partial<QueryGetUsersArgs>>;
  getWeightProgress?: Resolver<Array<ResolversTypes['SessionLog']>, ParentType, ContextType, RequireFields<QueryGetWeightProgressArgs, 'clientId'>>;
  getWeightProgressChart?: Resolver<Array<ResolversTypes['WeightProgress']>, ParentType, ContextType, RequireFields<QueryGetWeightProgressChartArgs, 'clientId'>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  searchWalkInClients?: Resolver<Array<ResolversTypes['WalkInClient']>, ParentType, ContextType, Partial<QuerySearchWalkInClientsArgs>>;
  walkInAccountsOverview?: Resolver<ResolversTypes['WalkInAccountsOverview'], ParentType, ContextType, Partial<QueryWalkInAccountsOverviewArgs>>;
  walkInAttendanceLogs?: Resolver<ResolversTypes['WalkInLogsConnection'], ParentType, ContextType, RequireFields<QueryWalkInAttendanceLogsArgs, 'filter'>>;
  walkInLogsByClient?: Resolver<ResolversTypes['WalkInLogsConnection'], ParentType, ContextType, RequireFields<QueryWalkInLogsByClientArgs, 'walkInClientId'>>;
  walkInPaymentSettings?: Resolver<ResolversTypes['WalkInPaymentSettings'], ParentType, ContextType>;
  walkInStats?: Resolver<ResolversTypes['WalkInStats'], ParentType, ContextType>;
};

export type ReportDownloadDateRangeResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['ReportDownloadDateRange'] = ResolversParentTypes['ReportDownloadDateRange']> = {
  endDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ReportDownloadLogResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['ReportDownloadLog'] = ResolversParentTypes['ReportDownloadLog']> = {
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dateRange?: Resolver<Maybe<ResolversTypes['ReportDownloadDateRange']>, ParentType, ContextType>;
  downloadedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  downloadedById?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  downloadedByRole?: Resolver<ResolversTypes['RoleType'], ParentType, ContextType>;
  fileName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  filterSummary?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  format?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  metadataJson?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  reportType?: Resolver<ResolversTypes['ReportType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type RevenueSummaryResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['RevenueSummary'] = ResolversParentTypes['RevenueSummary']> = {
  activeSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  canceledSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  expiredSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  membershipSubscriptionRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  newSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revenueByMembership?: Resolver<Array<ResolversTypes['MembershipRevenue']>, ParentType, ContextType>;
  revenueByPeriod?: Resolver<Array<ResolversTypes['PeriodRevenue']>, ParentType, ContextType>;
  totalRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  walkInRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type SessionResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Session'] = ResolversParentTypes['Session']> = {
  clients?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType>;
  clientsIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enrollments?: Resolver<Array<ResolversTypes['ClassEnrollment']>, ParentType, ContextType>;
  goal?: Resolver<Maybe<ResolversTypes['Goal']>, ParentType, ContextType>;
  goalId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  gymArea?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTemplate?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  maxParticipants?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sessionKind?: Resolver<ResolversTypes['SessionKind'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SessionStatus'], ParentType, ContextType>;
  templateId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  time?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  workoutType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type SessionLogResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['SessionLog'] = ResolversParentTypes['SessionLog']> = {
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientConfirmed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachConfirmed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  coachId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  progressImages?: Resolver<Maybe<ResolversTypes['ProgressImages']>, ParentType, ContextType>;
  session?: Resolver<Maybe<ResolversTypes['Session']>, ParentType, ContextType>;
  sessionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  weight?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _empty?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "_empty", ParentType, ContextType>;
  attendanceRecordAdded?: SubscriptionResolver<ResolversTypes['AttendanceRecord'], "attendanceRecordAdded", ParentType, ContextType>;
  attendanceUpdated?: SubscriptionResolver<Array<ResolversTypes['AttendanceRecord']>, "attendanceUpdated", ParentType, ContextType>;
  membershipsUpdated?: SubscriptionResolver<Array<ResolversTypes['Membership']>, "membershipsUpdated", ParentType, ContextType>;
  revenueSummaryUpdated?: SubscriptionResolver<ResolversTypes['RevenueSummary'], "revenueSummaryUpdated", ParentType, ContextType, Partial<SubscriptionRevenueSummaryUpdatedArgs>>;
  usersUpdated?: SubscriptionResolver<Array<ResolversTypes['User']>, "usersUpdated", ParentType, ContextType, Partial<SubscriptionUsersUpdatedArgs>>;
};

export type SubscriptionRequestResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['SubscriptionRequest'] = ResolversParentTypes['SubscriptionRequest']> = {
  approvedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  approvedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  member?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  memberId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  membership?: Resolver<Maybe<ResolversTypes['Membership']>, ParentType, ContextType>;
  membershipId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  rejectedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rejectedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  requestedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SubscriptionRequestStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type UserResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  agreedToLiabilityWaiver?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  agreedToPrivacyPolicy?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  agreedToTermsAndConditions?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  attendanceId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  coachDetails?: Resolver<Maybe<ResolversTypes['CoachDetails']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  currentMembership?: Resolver<Maybe<ResolversTypes['MembershipTransaction']>, ParentType, ContextType>;
  dateOfBirth?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  disableReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  disabledAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gender?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  guardianIdVerificationPhotoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  heardFrom?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDisabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loginHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['LoginHistoryEntry']>>>, ParentType, ContextType>;
  membershipDetails?: Resolver<Maybe<ResolversTypes['MemberDetails']>, ParentType, ContextType>;
  middleName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minorLiabilityWaiverPrintedName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minorLiabilityWaiverSignatureUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phoneNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['RoleType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type WalkInAccountRowResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WalkInAccountRow'] = ResolversParentTypes['WalkInAccountRow']> = {
  client?: Resolver<ResolversTypes['WalkInClient'], ParentType, ContextType>;
  timeInCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type WalkInAccountsOverviewResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WalkInAccountsOverview'] = ResolversParentTypes['WalkInAccountsOverview']> = {
  rows?: Resolver<Array<ResolversTypes['WalkInAccountRow']>, ParentType, ContextType>;
  totalTimeInRecords?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalWalkInAccounts?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type WalkInAttendanceLogResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WalkInAttendanceLog'] = ResolversParentTypes['WalkInAttendanceLog']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  localDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  payment?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  timedInAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  walkInClient?: Resolver<ResolversTypes['WalkInClient'], ParentType, ContextType>;
};

export type WalkInClientResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WalkInClient'] = ResolversParentTypes['WalkInClient']> = {
  ageYears?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gender?: Resolver<ResolversTypes['WalkInGender'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  middleName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minorWaiverAcceptedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minorWaiverGuardianName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phoneNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type WalkInLogsConnectionResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WalkInLogsConnection'] = ResolversParentTypes['WalkInLogsConnection']> = {
  logs?: Resolver<Array<ResolversTypes['WalkInAttendanceLog']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type WalkInPaymentSettingsResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WalkInPaymentSettings'] = ResolversParentTypes['WalkInPaymentSettings']> = {
  defaultPaymentPesos?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type WalkInStatsResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WalkInStats'] = ResolversParentTypes['WalkInStats']> = {
  totalTimeInRecords?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalWalkInAccounts?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type WeightProgressResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['WeightProgress'] = ResolversParentTypes['WeightProgress']> = {
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sessionId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  sessionLogId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  weight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type Resolvers<ContextType = IAuthContext> = {
  Analytics?: AnalyticsResolvers<ContextType>;
  AttendanceConnection?: AttendanceConnectionResolvers<ContextType>;
  AttendanceRecord?: AttendanceRecordResolvers<ContextType>;
  AuthResponse?: AuthResponseResolvers<ContextType>;
  ClassEnrollment?: ClassEnrollmentResolvers<ContextType>;
  CoachDetails?: CoachDetailsResolvers<ContextType>;
  CoachRating?: CoachRatingResolvers<ContextType>;
  CoachRequest?: CoachRequestResolvers<ContextType>;
  CreateWalkInClientResult?: CreateWalkInClientResultResolvers<ContextType>;
  Equipment?: EquipmentResolvers<ContextType>;
  EquipmentLifecycleLog?: EquipmentLifecycleLogResolvers<ContextType>;
  Goal?: GoalResolvers<ContextType>;
  LoginHistoryEntry?: LoginHistoryEntryResolvers<ContextType>;
  MemberDetails?: MemberDetailsResolvers<ContextType>;
  Membership?: MembershipResolvers<ContextType>;
  MembershipRevenue?: MembershipRevenueResolvers<ContextType>;
  MembershipTransaction?: MembershipTransactionResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  PeriodRevenue?: PeriodRevenueResolvers<ContextType>;
  ProgressImages?: ProgressImagesResolvers<ContextType>;
  ProgressRating?: ProgressRatingResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ReportDownloadDateRange?: ReportDownloadDateRangeResolvers<ContextType>;
  ReportDownloadLog?: ReportDownloadLogResolvers<ContextType>;
  RevenueSummary?: RevenueSummaryResolvers<ContextType>;
  Session?: SessionResolvers<ContextType>;
  SessionLog?: SessionLogResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  SubscriptionRequest?: SubscriptionRequestResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  WalkInAccountRow?: WalkInAccountRowResolvers<ContextType>;
  WalkInAccountsOverview?: WalkInAccountsOverviewResolvers<ContextType>;
  WalkInAttendanceLog?: WalkInAttendanceLogResolvers<ContextType>;
  WalkInClient?: WalkInClientResolvers<ContextType>;
  WalkInLogsConnection?: WalkInLogsConnectionResolvers<ContextType>;
  WalkInPaymentSettings?: WalkInPaymentSettingsResolvers<ContextType>;
  WalkInStats?: WalkInStatsResolvers<ContextType>;
  WeightProgress?: WeightProgressResolvers<ContextType>;
};

