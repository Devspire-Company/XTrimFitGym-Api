import { GraphQLResolveInfo } from 'graphql';
import { IAuthContext } from './src/context/auth-context.ts';
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

export type ConfirmSessionCompletionInput = {
  confirm: Scalars['Boolean']['input'];
  sessionLogId: Scalars['ID']['input'];
};

export type CreateGoalInput = {
  currentWeight?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  goalType: FitnessGoalType;
  targetDate?: InputMaybe<Scalars['String']['input']>;
  targetWeight?: InputMaybe<Scalars['Float']['input']>;
  title: Scalars['String']['input'];
};

export type CreateMembershipInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  durationType: DurationType;
  features: Array<Scalars['String']['input']>;
  monthlyPrice: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  status: MembershipStatus;
};

export type CreateSessionInput = {
  clientsIds: Array<Scalars['ID']['input']>;
  date: Scalars['String']['input'];
  endTime?: InputMaybe<Scalars['String']['input']>;
  gymArea: Scalars['String']['input'];
  name: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  startTime: Scalars['String']['input'];
  workoutType?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSessionLogInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  sessionId: Scalars['ID']['input'];
  weight: Scalars['Float']['input'];
};

export type CreateUserInput = {
  agreedToLiabilityWaiver?: InputMaybe<Scalars['Boolean']['input']>;
  agreedToPrivacyPolicy?: InputMaybe<Scalars['Boolean']['input']>;
  agreedToTermsAndConditions?: InputMaybe<Scalars['Boolean']['input']>;
  coachDetails?: InputMaybe<CoachDetailsInput>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<Scalars['String']['input']>;
  heardFrom?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastName: Scalars['String']['input'];
  membershipDetails?: InputMaybe<MemberDetailsInput>;
  password: Scalars['String']['input'];
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  role: RoleType;
};

export enum DurationType {
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Yearly = 'YEARLY'
}

export enum FitnessGoalType {
  AthleticPerformance = 'ATHLETIC_PERFORMANCE',
  Endurance = 'ENDURANCE',
  Flexibility = 'FLEXIBILITY',
  GeneralFitness = 'GENERAL_FITNESS',
  MuscleBuilding = 'MUSCLE_BUILDING',
  Rehabilitation = 'REHABILITATION',
  StrengthTraining = 'STRENGTH_TRAINING',
  WeightLoss = 'WEIGHT_LOSS'
}

export type Goal = {
  __typename?: 'Goal';
  client?: Maybe<User>;
  clientId: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  currentWeight?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  goalType: FitnessGoalType;
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

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MemberDetails = {
  __typename?: 'MemberDetails';
  coachesIds?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  fitnessGoal?: Maybe<Array<Scalars['String']['output']>>;
  membershipId?: Maybe<Scalars['ID']['output']>;
  membershipTransaction?: Maybe<MembershipTransaction>;
  physiqueGoalType: Scalars['String']['output'];
  workOutTime?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type MemberDetailsInput = {
  coachesIds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  fitnessGoal?: InputMaybe<Array<Scalars['String']['input']>>;
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
  monthlyPrice: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  status: MembershipStatus;
  updatedAt?: Maybe<Scalars['String']['output']>;
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
  cancelMembership: Scalars['Boolean']['output'];
  cancelSession: Scalars['Boolean']['output'];
  clientConfirmWeight: SessionLog;
  completeSession: SessionLog;
  confirmSessionCompletion: SessionLog;
  createGoal: Goal;
  createMembership: Membership;
  createSession: Session;
  createUser: AuthResponse;
  deleteGoal: Scalars['Boolean']['output'];
  deleteUser?: Maybe<Scalars['Boolean']['output']>;
  login: AuthResponse;
  purchaseMembership: MembershipTransaction;
  updateGoal: Goal;
  updateSession: Session;
  updateUser?: Maybe<User>;
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


export type MutationCreateGoalArgs = {
  input: CreateGoalInput;
};


export type MutationCreateMembershipArgs = {
  input: CreateMembershipInput;
};


export type MutationCreateSessionArgs = {
  input: CreateSessionInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteGoalArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationPurchaseMembershipArgs = {
  input: PurchaseMembershipInput;
};


export type MutationUpdateGoalArgs = {
  id: Scalars['ID']['input'];
  input: UpdateGoalInput;
};


export type MutationUpdateSessionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSessionInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: CreateUserInput;
};

export type PurchaseMembershipInput = {
  membershipId: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  getClientSessions: Array<Session>;
  getCoachSessions: Array<Session>;
  getCurrentMembership?: Maybe<MembershipTransaction>;
  getGoal?: Maybe<Goal>;
  getGoals: Array<Goal>;
  getMembership?: Maybe<Membership>;
  getMembershipTransaction?: Maybe<MembershipTransaction>;
  getMemberships: Array<Membership>;
  getSession?: Maybe<Session>;
  getSessionLogs: Array<SessionLog>;
  getUpcomingSessions: Array<Session>;
  getUser?: Maybe<User>;
  getUsers?: Maybe<Array<Maybe<User>>>;
  getWeightProgress: Array<SessionLog>;
  getWeightProgressChart: Array<WeightProgress>;
};


export type QueryGetClientSessionsArgs = {
  clientId: Scalars['ID']['input'];
  status?: InputMaybe<SessionStatus>;
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


export type QueryGetSessionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSessionLogsArgs = {
  clientId: Scalars['ID']['input'];
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
  gymArea: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  note?: Maybe<Scalars['String']['output']>;
  startTime: Scalars['String']['output'];
  status: SessionStatus;
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
  session?: Maybe<Session>;
  sessionId: Scalars['ID']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  weight: Scalars['Float']['output'];
};

export enum SessionStatus {
  Cancelled = 'cancelled',
  Completed = 'completed',
  Scheduled = 'scheduled'
}

export enum TransactionStatus {
  Active = 'ACTIVE',
  Canceled = 'CANCELED',
  Expired = 'EXPIRED'
}

export type UpdateGoalInput = {
  currentWeight?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  goalType?: InputMaybe<FitnessGoalType>;
  status?: InputMaybe<GoalStatus>;
  targetDate?: InputMaybe<Scalars['String']['input']>;
  targetWeight?: InputMaybe<Scalars['Float']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
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

export type User = {
  __typename?: 'User';
  agreedToLiabilityWaiver?: Maybe<Scalars['Boolean']['output']>;
  agreedToPrivacyPolicy?: Maybe<Scalars['Boolean']['output']>;
  agreedToTermsAndConditions?: Maybe<Scalars['Boolean']['output']>;
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
  membershipDetails?: Maybe<MemberDetails>;
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
  AuthResponse: ResolverTypeWrapper<Partial<AuthResponse>>;
  Boolean: ResolverTypeWrapper<Partial<Scalars['Boolean']['output']>>;
  CoachDetails: ResolverTypeWrapper<Partial<CoachDetails>>;
  CoachDetailsInput: ResolverTypeWrapper<Partial<CoachDetailsInput>>;
  ConfirmSessionCompletionInput: ResolverTypeWrapper<Partial<ConfirmSessionCompletionInput>>;
  CreateGoalInput: ResolverTypeWrapper<Partial<CreateGoalInput>>;
  CreateMembershipInput: ResolverTypeWrapper<Partial<CreateMembershipInput>>;
  CreateSessionInput: ResolverTypeWrapper<Partial<CreateSessionInput>>;
  CreateSessionLogInput: ResolverTypeWrapper<Partial<CreateSessionLogInput>>;
  CreateUserInput: ResolverTypeWrapper<Partial<CreateUserInput>>;
  DurationType: ResolverTypeWrapper<Partial<DurationType>>;
  FitnessGoalType: ResolverTypeWrapper<Partial<FitnessGoalType>>;
  Float: ResolverTypeWrapper<Partial<Scalars['Float']['output']>>;
  Goal: ResolverTypeWrapper<Partial<Goal>>;
  GoalStatus: ResolverTypeWrapper<Partial<GoalStatus>>;
  ID: ResolverTypeWrapper<Partial<Scalars['ID']['output']>>;
  Int: ResolverTypeWrapper<Partial<Scalars['Int']['output']>>;
  LoginInput: ResolverTypeWrapper<Partial<LoginInput>>;
  MemberDetails: ResolverTypeWrapper<Partial<MemberDetails>>;
  MemberDetailsInput: ResolverTypeWrapper<Partial<MemberDetailsInput>>;
  Membership: ResolverTypeWrapper<Partial<Membership>>;
  MembershipStatus: ResolverTypeWrapper<Partial<MembershipStatus>>;
  MembershipTransaction: ResolverTypeWrapper<Partial<MembershipTransaction>>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  PurchaseMembershipInput: ResolverTypeWrapper<Partial<PurchaseMembershipInput>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RoleType: ResolverTypeWrapper<Partial<RoleType>>;
  Session: ResolverTypeWrapper<Partial<Session>>;
  SessionLog: ResolverTypeWrapper<Partial<SessionLog>>;
  SessionStatus: ResolverTypeWrapper<Partial<SessionStatus>>;
  String: ResolverTypeWrapper<Partial<Scalars['String']['output']>>;
  TransactionStatus: ResolverTypeWrapper<Partial<TransactionStatus>>;
  UpdateGoalInput: ResolverTypeWrapper<Partial<UpdateGoalInput>>;
  UpdateSessionInput: ResolverTypeWrapper<Partial<UpdateSessionInput>>;
  User: ResolverTypeWrapper<Partial<User>>;
  WeightProgress: ResolverTypeWrapper<Partial<WeightProgress>>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AuthResponse: Partial<AuthResponse>;
  Boolean: Partial<Scalars['Boolean']['output']>;
  CoachDetails: Partial<CoachDetails>;
  CoachDetailsInput: Partial<CoachDetailsInput>;
  ConfirmSessionCompletionInput: Partial<ConfirmSessionCompletionInput>;
  CreateGoalInput: Partial<CreateGoalInput>;
  CreateMembershipInput: Partial<CreateMembershipInput>;
  CreateSessionInput: Partial<CreateSessionInput>;
  CreateSessionLogInput: Partial<CreateSessionLogInput>;
  CreateUserInput: Partial<CreateUserInput>;
  Float: Partial<Scalars['Float']['output']>;
  Goal: Partial<Goal>;
  ID: Partial<Scalars['ID']['output']>;
  Int: Partial<Scalars['Int']['output']>;
  LoginInput: Partial<LoginInput>;
  MemberDetails: Partial<MemberDetails>;
  MemberDetailsInput: Partial<MemberDetailsInput>;
  Membership: Partial<Membership>;
  MembershipTransaction: Partial<MembershipTransaction>;
  Mutation: Record<PropertyKey, never>;
  PurchaseMembershipInput: Partial<PurchaseMembershipInput>;
  Query: Record<PropertyKey, never>;
  Session: Partial<Session>;
  SessionLog: Partial<SessionLog>;
  String: Partial<Scalars['String']['output']>;
  UpdateGoalInput: Partial<UpdateGoalInput>;
  UpdateSessionInput: Partial<UpdateSessionInput>;
  User: Partial<User>;
  WeightProgress: Partial<WeightProgress>;
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

export type GoalResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Goal'] = ResolversParentTypes['Goal']> = {
  client?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  currentWeight?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  goalType?: Resolver<ResolversTypes['FitnessGoalType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['GoalStatus'], ParentType, ContextType>;
  targetDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  targetWeight?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MemberDetailsResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['MemberDetails'] = ResolversParentTypes['MemberDetails']> = {
  coachesIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['ID']>>>, ParentType, ContextType>;
  fitnessGoal?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
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
  monthlyPrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MembershipStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  cancelMembership?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelMembershipArgs, 'transactionId'>>;
  cancelSession?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelSessionArgs, 'id'>>;
  clientConfirmWeight?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationClientConfirmWeightArgs, 'sessionLogId'>>;
  completeSession?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationCompleteSessionArgs, 'input'>>;
  confirmSessionCompletion?: Resolver<ResolversTypes['SessionLog'], ParentType, ContextType, RequireFields<MutationConfirmSessionCompletionArgs, 'input'>>;
  createGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationCreateGoalArgs, 'input'>>;
  createMembership?: Resolver<ResolversTypes['Membership'], ParentType, ContextType, RequireFields<MutationCreateMembershipArgs, 'input'>>;
  createSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationCreateSessionArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deleteGoal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGoalArgs, 'id'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  login?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'input'>>;
  purchaseMembership?: Resolver<ResolversTypes['MembershipTransaction'], ParentType, ContextType, RequireFields<MutationPurchaseMembershipArgs, 'input'>>;
  updateGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationUpdateGoalArgs, 'id' | 'input'>>;
  updateSession?: Resolver<ResolversTypes['Session'], ParentType, ContextType, RequireFields<MutationUpdateSessionArgs, 'id' | 'input'>>;
  updateUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
};

export type QueryResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getClientSessions?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType, RequireFields<QueryGetClientSessionsArgs, 'clientId'>>;
  getCoachSessions?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType, RequireFields<QueryGetCoachSessionsArgs, 'coachId'>>;
  getCurrentMembership?: Resolver<Maybe<ResolversTypes['MembershipTransaction']>, ParentType, ContextType>;
  getGoal?: Resolver<Maybe<ResolversTypes['Goal']>, ParentType, ContextType, RequireFields<QueryGetGoalArgs, 'id'>>;
  getGoals?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType, RequireFields<QueryGetGoalsArgs, 'clientId'>>;
  getMembership?: Resolver<Maybe<ResolversTypes['Membership']>, ParentType, ContextType, RequireFields<QueryGetMembershipArgs, 'id'>>;
  getMembershipTransaction?: Resolver<Maybe<ResolversTypes['MembershipTransaction']>, ParentType, ContextType, RequireFields<QueryGetMembershipTransactionArgs, 'id'>>;
  getMemberships?: Resolver<Array<ResolversTypes['Membership']>, ParentType, ContextType, Partial<QueryGetMembershipsArgs>>;
  getSession?: Resolver<Maybe<ResolversTypes['Session']>, ParentType, ContextType, RequireFields<QueryGetSessionArgs, 'id'>>;
  getSessionLogs?: Resolver<Array<ResolversTypes['SessionLog']>, ParentType, ContextType, RequireFields<QueryGetSessionLogsArgs, 'clientId'>>;
  getUpcomingSessions?: Resolver<Array<ResolversTypes['Session']>, ParentType, ContextType>;
  getUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryGetUserArgs, 'id'>>;
  getUsers?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, Partial<QueryGetUsersArgs>>;
  getWeightProgress?: Resolver<Array<ResolversTypes['SessionLog']>, ParentType, ContextType, RequireFields<QueryGetWeightProgressArgs, 'clientId'>>;
  getWeightProgressChart?: Resolver<Array<ResolversTypes['WeightProgress']>, ParentType, ContextType, RequireFields<QueryGetWeightProgressChartArgs, 'clientId'>>;
};

export type SessionResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['Session'] = ResolversParentTypes['Session']> = {
  clients?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType>;
  clientsIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  coach?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  coachId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  gymArea?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SessionStatus'], ParentType, ContextType>;
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
  session?: Resolver<Maybe<ResolversTypes['Session']>, ParentType, ContextType>;
  sessionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  weight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type UserResolvers<ContextType = IAuthContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  agreedToLiabilityWaiver?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  agreedToPrivacyPolicy?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  agreedToTermsAndConditions?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
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
  membershipDetails?: Resolver<Maybe<ResolversTypes['MemberDetails']>, ParentType, ContextType>;
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
  AuthResponse?: AuthResponseResolvers<ContextType>;
  CoachDetails?: CoachDetailsResolvers<ContextType>;
  Goal?: GoalResolvers<ContextType>;
  MemberDetails?: MemberDetailsResolvers<ContextType>;
  Membership?: MembershipResolvers<ContextType>;
  MembershipTransaction?: MembershipTransactionResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Session?: SessionResolvers<ContextType>;
  SessionLog?: SessionLogResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  WeightProgress?: WeightProgressResolvers<ContextType>;
};

