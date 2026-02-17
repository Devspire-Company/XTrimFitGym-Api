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
  newSubscriptions: Scalars['Int']['output'];
  revenueByMembership: Array<MembershipRevenue>;
  totalRevenue: Scalars['Float']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
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
  clientsIds: Array<Scalars['ID']['input']>;
  date: Scalars['String']['input'];
  endTime?: InputMaybe<Scalars['String']['input']>;
  goalId?: InputMaybe<Scalars['ID']['input']>;
  gymArea: Scalars['String']['input'];
  isTemplate?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
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
  password: Scalars['String']['input'];
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  role: RoleType;
};

export type DateRangeInput = {
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type DirectSubscribeInput = {
  memberId: Scalars['ID']['input'];
  membershipId: Scalars['ID']['input'];
};

export enum DurationType {
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Yearly = 'YEARLY'
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
  fitnessGoal?: Maybe<Array<Scalars['String']['output']>>;
  hasEnteredDetails?: Maybe<Scalars['Boolean']['output']>;
  membershipId?: Maybe<Scalars['ID']['output']>;
  membershipTransaction?: Maybe<MembershipTransaction>;
  physiqueGoalType: Scalars['String']['output'];
  workOutTime?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type MemberDetailsInput = {
  coachesIds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
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
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  membership?: Maybe<Membership>;
  membershipId: Scalars['ID']['output'];
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
  completeSession: SessionLog;
  confirmSessionCompletion: SessionLog;
  createCoachRating: CoachRating;
  createCoachRequest: CoachRequest;
  createGoal: Goal;
  createMembership: Membership;
  createProgressRating: ProgressRating;
  createSession: Session;
  createSessionFromTemplate: Session;
  createSubscriptionRequest: SubscriptionRequest;
  createUser: AuthResponse;
  deleteCoachRating: Scalars['Boolean']['output'];
  deleteGoal: Scalars['Boolean']['output'];
  deleteMembership: Scalars['Boolean']['output'];
  deleteProgressRating: Scalars['Boolean']['output'];
  deleteSubscriptionRequest: Scalars['Boolean']['output'];
  deleteUser?: Maybe<Scalars['Boolean']['output']>;
  directSubscribeMember: MembershipTransaction;
  login: AuthResponse;
  purchaseMembership: MembershipTransaction;
  rejectSubscriptionRequest: Scalars['Boolean']['output'];
  removeClient: Scalars['Boolean']['output'];
  updateCoachRating: CoachRating;
  updateCoachRequest: CoachRequest;
  updateGoal: Goal;
  updateMembership: Membership;
  updateProgressRating: ProgressRating;
  updateSession: Session;
  updateUser?: Maybe<User>;
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


export type MutationDeleteCoachRatingArgs = {
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


export type MutationUpdateCoachRatingArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  rating?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationUpdateCoachRequestArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCoachRequestInput;
};


export type MutationUpdateGoalArgs = {
  id: Scalars['ID']['input'];
  input: UpdateGoalInput;
};


export type MutationUpdateMembershipArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMembershipInput;
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

export type PeriodRevenue = {
  __typename?: 'PeriodRevenue';
  count: Scalars['Int']['output'];
  period: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
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
  getFitnessGoalTypes: Array<Scalars['String']['output']>;
  getGoal?: Maybe<Goal>;
  getGoals: Array<Goal>;
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

export type RejectSubscriptionRequestInput = {
  requestId: Scalars['ID']['input'];
};

export type RevenueSummary = {
  __typename?: 'RevenueSummary';
  activeSubscriptions: Scalars['Int']['output'];
  canceledSubscriptions: Scalars['Int']['output'];
  expiredSubscriptions: Scalars['Int']['output'];
  newSubscriptions: Scalars['Int']['output'];
  revenueByMembership: Array<MembershipRevenue>;
  revenueByPeriod: Array<PeriodRevenue>;
  totalRevenue: Scalars['Float']['output'];
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
  goal?: Maybe<Goal>;
  goalId?: Maybe<Scalars['ID']['output']>;
  gymArea: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isTemplate?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  note?: Maybe<Scalars['String']['output']>;
  startTime: Scalars['String']['output'];
  status: SessionStatus;
  templateId?: Maybe<Scalars['ID']['output']>;
  time?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  workoutType?: Maybe<Scalars['String']['output']>;
};

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
  heardFrom?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  membershipDetails?: InputMaybe<MemberDetailsInput>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
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
  CoachDetails: ResolverTypeWrapper<Partial<CoachDetails>>;
  CoachDetailsInput: ResolverTypeWrapper<Partial<CoachDetailsInput>>;
  CoachRating: ResolverTypeWrapper<Partial<CoachRating>>;
  CoachRequest: ResolverTypeWrapper<Partial<CoachRequest>>;
  CoachRequestStatus: ResolverTypeWrapper<Partial<CoachRequestStatus>>;
  ConfirmSessionCompletionInput: ResolverTypeWrapper<Partial<ConfirmSessionCompletionInput>>;
  CreateCoachRatingInput: ResolverTypeWrapper<Partial<CreateCoachRatingInput>>;
  CreateCoachRequestInput: ResolverTypeWrapper<Partial<CreateCoachRequestInput>>;
  CreateGoalInput: ResolverTypeWrapper<Partial<CreateGoalInput>>;
  CreateMembershipInput: ResolverTypeWrapper<Partial<CreateMembershipInput>>;
  CreateProgressRatingInput: ResolverTypeWrapper<Partial<CreateProgressRatingInput>>;
  CreateSessionFromTemplateInput: ResolverTypeWrapper<Partial<CreateSessionFromTemplateInput>>;
  CreateSessionInput: ResolverTypeWrapper<Partial<CreateSessionInput>>;
  CreateSessionLogInput: ResolverTypeWrapper<Partial<CreateSessionLogInput>>;
  CreateSubscriptionRequestInput: ResolverTypeWrapper<Partial<CreateSubscriptionRequestInput>>;
  CreateUserInput: ResolverTypeWrapper<Partial<CreateUserInput>>;
  DateRangeInput: ResolverTypeWrapper<Partial<DateRangeInput>>;
  DirectSubscribeInput: ResolverTypeWrapper<Partial<DirectSubscribeInput>>;
  DurationType: ResolverTypeWrapper<Partial<DurationType>>;
  Float: ResolverTypeWrapper<Partial<Scalars['Float']['output']>>;
  Goal: ResolverTypeWrapper<Partial<Goal>>;
  GoalStatus: ResolverTypeWrapper<Partial<GoalStatus>>;
  ID: ResolverTypeWrapper<Partial<Scalars['ID']['output']>>;
  Int: ResolverTypeWrapper<Partial<Scalars['Int']['output']>>;
  LoginHistoryEntry: ResolverTypeWrapper<Partial<LoginHistoryEntry>>;
  LoginInput: ResolverTypeWrapper<Partial<LoginInput>>;
  MemberDetails: ResolverTypeWrapper<Partial<MemberDetails>>;
  MemberDetailsInput: ResolverTypeWrapper<Partial<MemberDetailsInput>>;
  Membership: ResolverTypeWrapper<Partial<Membership>>;
  MembershipRevenue: ResolverTypeWrapper<Partial<MembershipRevenue>>;
  MembershipStatus: ResolverTypeWrapper<Partial<MembershipStatus>>;
  MembershipTransaction: ResolverTypeWrapper<Partial<MembershipTransaction>>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  PeriodRevenue: ResolverTypeWrapper<Partial<PeriodRevenue>>;
  ProgressImages: ResolverTypeWrapper<Partial<ProgressImages>>;
  ProgressImagesInput: ResolverTypeWrapper<Partial<ProgressImagesInput>>;
  ProgressRating: ResolverTypeWrapper<Partial<ProgressRating>>;
  ProgressVerdict: ResolverTypeWrapper<Partial<ProgressVerdict>>;
  PurchaseMembershipInput: ResolverTypeWrapper<Partial<PurchaseMembershipInput>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RejectSubscriptionRequestInput: ResolverTypeWrapper<Partial<RejectSubscriptionRequestInput>>;
  RevenueSummary: ResolverTypeWrapper<Partial<RevenueSummary>>;
  RoleType: ResolverTypeWrapper<Partial<RoleType>>;
  Session: ResolverTypeWrapper<Partial<Session>>;
  SessionLog: ResolverTypeWrapper<Partial<SessionLog>>;
  SessionStatus: ResolverTypeWrapper<Partial<SessionStatus>>;
  String: ResolverTypeWrapper<Partial<Scalars['String']['output']>>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SubscriptionRequest: ResolverTypeWrapper<Partial<SubscriptionRequest>>;
  SubscriptionRequestStatus: ResolverTypeWrapper<Partial<SubscriptionRequestStatus>>;
  TransactionStatus: ResolverTypeWrapper<Partial<TransactionStatus>>;
  UpdateCoachRequestInput: ResolverTypeWrapper<Partial<UpdateCoachRequestInput>>;
  UpdateGoalInput: ResolverTypeWrapper<Partial<UpdateGoalInput>>;
  UpdateMembershipInput: ResolverTypeWrapper<Partial<UpdateMembershipInput>>;
  UpdateProgressRatingInput: ResolverTypeWrapper<Partial<UpdateProgressRatingInput>>;
  UpdateSessionInput: ResolverTypeWrapper<Partial<UpdateSessionInput>>;
  UpdateUserInput: ResolverTypeWrapper<Partial<UpdateUserInput>>;
  User: ResolverTypeWrapper<Partial<User>>;
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
  CoachDetails: Partial<CoachDetails>;
  CoachDetailsInput: Partial<CoachDetailsInput>;
  CoachRating: Partial<CoachRating>;
  CoachRequest: Partial<CoachRequest>;
  ConfirmSessionCompletionInput: Partial<ConfirmSessionCompletionInput>;
  CreateCoachRatingInput: Partial<CreateCoachRatingInput>;
  CreateCoachRequestInput: Partial<CreateCoachRequestInput>;
  CreateGoalInput: Partial<CreateGoalInput>;
  CreateMembershipInput: Partial<CreateMembershipInput>;
  CreateProgressRatingInput: Partial<CreateProgressRatingInput>;
  CreateSessionFromTemplateInput: Partial<CreateSessionFromTemplateInput>;
  CreateSessionInput: Partial<CreateSessionInput>;
  CreateSessionLogInput: Partial<CreateSessionLogInput>;
  CreateSubscriptionRequestInput: Partial<CreateSubscriptionRequestInput>;
  CreateUserInput: Partial<CreateUserInput>;
  DateRangeInput: Partial<DateRangeInput>;
  DirectSubscribeInput: Partial<DirectSubscribeInput>;
  Float: Partial<Scalars['Float']['output']>;
  Goal: Partial<Goal>;
  ID: Partial<Scalars['ID']['output']>;
  Int: Partial<Scalars['Int']['output']>;
  LoginHistoryEntry: Partial<LoginHistoryEntry>;
  LoginInput: Partial<LoginInput>;
  MemberDetails: Partial<MemberDetails>;
  MemberDetailsInput: Partial<MemberDetailsInput>;
  Membership: Partial<Membership>;
  MembershipRevenue: Partial<MembershipRevenue>;
  MembershipTransaction: Partial<MembershipTransaction>;
  Mutation: Record<PropertyKey, never>;
  PeriodRevenue: Partial<PeriodRevenue>;
  ProgressImages: Partial<ProgressImages>;
  ProgressImagesInput: Partial<ProgressImagesInput>;
  ProgressRating: Partial<ProgressRating>;
  PurchaseMembershipInput: Partial<PurchaseMembershipInput>;
  Query: Record<PropertyKey, never>;
  RejectSubscriptionRequestInput: Partial<RejectSubscriptionRequestInput>;
  RevenueSummary: Partial<RevenueSummary>;
  Session: Partial<Session>;
  SessionLog: Partial<SessionLog>;
  String: Partial<Scalars['String']['output']>;
  Subscription: Record<PropertyKey, never>;
  SubscriptionRequest: Partial<SubscriptionRequest>;
  UpdateCoachRequestInput: Partial<UpdateCoachRequestInput>;
  UpdateGoalInput: Partial<UpdateGoalInput>;
  UpdateMembershipInput: Partial<UpdateMembershipInput>;
  UpdateProgressRatingInput: Partial<UpdateProgressRatingInput>;
  UpdateSessionInput: Partial<UpdateSessionInput>;
  UpdateUserInput: Partial<UpdateUserInput>;
  User: Partial<User>;
  WeightProgress: Partial<WeightProgress>;
};

export type AnalyticsResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Analytics'] = ResolversParentTypes['Analytics']> = {
  activeSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  canceledSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expiredSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  newSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revenueByMembership?: Resolver<Array<ResolversTypes['MembershipRevenue']>, ParentType, ContextType>;
  totalRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  membership?: Resolver<Maybe<ResolversTypes['Membership']>, ParentType, ContextType>;
  membershipId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  priceAtPurchase?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TransactionStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MutationResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  approveSubscriptionRequest?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationApproveSubscriptionRequestArgs, 'input'>>;
  assignCoachToGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationAssignCoachToGoalArgs, 'goalId'>>;
  cancelCoachRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelCoachRequestArgs, 'id'>>;
  cancelMembership?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelMembershipArgs, 'transactionId'>>;
  cancelSession?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelSessionArgs, 'id'>>;
  clientConfirmWeight?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationClientConfirmWeightArgs, 'sessionLogId'>>;
  completeSession?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationCompleteSessionArgs, 'input'>>;
  confirmSessionCompletion?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationConfirmSessionCompletionArgs, 'input'>>;
  createCoachRating?: Resolver<ResolversTypes['CoachRating'], ParentType, ContextType, RequireFields<MutationCreateCoachRatingArgs, 'input'>>;
  createCoachRequest?: Resolver<ResolversTypes['CoachRequest'], ParentType, ContextType, RequireFields<MutationCreateCoachRequestArgs, 'input'>>;
  createGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationCreateGoalArgs, 'input'>>;
  createMembership?: Resolver<ResolversTypes['Membership'], ParentType, ContextType, RequireFields<MutationCreateMembershipArgs, 'input'>>;
  createProgressRating?: Resolver<ResolversTypes['ProgressRating'], ParentType, ContextType, RequireFields<MutationCreateProgressRatingArgs, 'input'>>;
  createSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationCreateSessionArgs, 'input'>>;
  createSessionFromTemplate?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationCreateSessionFromTemplateArgs, 'input'>>;
  createSubscriptionRequest?: Resolver<ResolversTypes['SubscriptionRequest'], ParentType, ContextType, RequireFields<MutationCreateSubscriptionRequestArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deleteCoachRating?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCoachRatingArgs, 'id'>>;
  deleteGoal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGoalArgs, 'id'>>;
  deleteMembership?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteMembershipArgs, 'id'>>;
  deleteProgressRating?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProgressRatingArgs, 'id'>>;
  deleteSubscriptionRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSubscriptionRequestArgs, 'id'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  directSubscribeMember?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationDirectSubscribeMemberArgs, 'input'>>;
  login?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'input'>>;
  purchaseMembership?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationPurchaseMembershipArgs, 'input'>>;
  rejectSubscriptionRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRejectSubscriptionRequestArgs, 'input'>>;
  removeClient?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveClientArgs, 'clientId'>>;
  updateCoachRating?: Resolver<ResolversTypes['CoachRating'], ParentType, ContextType, RequireFields<MutationUpdateCoachRatingArgs, 'id'>>;
  updateCoachRequest?: Resolver<ResolversTypes['CoachRequest'], ParentType, ContextType, RequireFields<MutationUpdateCoachRequestArgs, 'id' | 'input'>>;
  updateGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationUpdateGoalArgs, 'id' | 'input'>>;
  updateMembership?: Resolver<ResolversTypes['Membership'], ParentType, ContextType, RequireFields<MutationUpdateMembershipArgs, 'id' | 'input'>>;
  updateProgressRating?: Resolver<ResolversTypes['ProgressRating'], ParentType, ContextType, RequireFields<MutationUpdateProgressRatingArgs, 'id' | 'input'>>;
  updateSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationUpdateSessionArgs, 'id' | 'input'>>;
  updateUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
};

export type PeriodRevenueResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['PeriodRevenue'] = ResolversParentTypes['PeriodRevenue']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  period?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  revenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
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
  getFitnessGoalTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  getGoal?: Resolver<Maybe<ResolversTypes['Goal']>, ParentType, ContextType, RequireFields<QueryGetGoalArgs, 'id'>>;
  getGoals?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType, RequireFields<QueryGetGoalsArgs, 'clientId'>>;
  getMembership?: Resolver<Maybe<ResolversTypes['Membership']>, ParentType, ContextType, RequireFields<QueryGetMembershipArgs, 'id'>>;
  getMembershipTransaction?: Resolver<Maybe<ResolversTypes['MembershipTransaction']>, ParentType, ContextType, RequireFields<QueryGetMembershipTransactionArgs, 'id'>>;
  getMemberships?: Resolver<Array<ResolversTypes['Membership']>, ParentType, ContextType, Partial<QueryGetMembershipsArgs>>;
  getMySubscriptionRequests?: Resolver<Array<ResolversTypes['SubscriptionRequest']>, ParentType, ContextType>;
  getPendingCoachRequests?: Resolver<Array<ResolversTypes['CoachRequest']>, ParentType, ContextType>;
  getPendingSubscriptionRequests?: Resolver<Array<ResolversTypes['SubscriptionRequest']>, ParentType, ContextType>;
  getProgressRatings?: Resolver<Array<ResolversTypes['ProgressRating']>, ParentType, ContextType, RequireFields<QueryGetProgressRatingsArgs, 'clientId' | 'goalId'>>;
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
};

export type RevenueSummaryResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['RevenueSummary'] = ResolversParentTypes['RevenueSummary']> = {
  activeSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  canceledSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  expiredSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  newSubscriptions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revenueByMembership?: Resolver<Array<ResolversTypes['MembershipRevenue']>, ParentType, ContextType>;
  revenueByPeriod?: Resolver<Array<ResolversTypes['PeriodRevenue']>, ParentType, ContextType>;
  totalRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type SessionResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Session'] = ResolversParentTypes['Session']> = {
  clients?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType>;
  clientsIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  goal?: Resolver<Maybe<ResolversTypes['Goal']>, ParentType, ContextType>;
  goalId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  gymArea?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTemplate?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gender?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  heardFrom?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loginHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['LoginHistoryEntry']>>>, ParentType, ContextType>;
  membershipDetails?: Resolver<Maybe<ResolversTypes['MemberDetails']>, ParentType, ContextType>;
  middleName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phoneNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['RoleType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  CoachDetails?: CoachDetailsResolvers<ContextType>;
  CoachRating?: CoachRatingResolvers<ContextType>;
  CoachRequest?: CoachRequestResolvers<ContextType>;
  Goal?: GoalResolvers<ContextType>;
  LoginHistoryEntry?: LoginHistoryEntryResolvers<ContextType>;
  MemberDetails?: MemberDetailsResolvers<ContextType>;
  Membership?: MembershipResolvers<ContextType>;
  MembershipRevenue?: MembershipRevenueResolvers<ContextType>;
  MembershipTransaction?: MembershipTransactionResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PeriodRevenue?: PeriodRevenueResolvers<ContextType>;
  ProgressImages?: ProgressImagesResolvers<ContextType>;
  ProgressRating?: ProgressRatingResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RevenueSummary?: RevenueSummaryResolvers<ContextType>;
  Session?: SessionResolvers<ContextType>;
  SessionLog?: SessionLogResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  SubscriptionRequest?: SubscriptionRequestResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  WeightProgress?: WeightProgressResolvers<ContextType>;
};

