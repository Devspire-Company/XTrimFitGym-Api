import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createClerkClient } from '@clerk/backend';
import User from '../../database/models/user/user-schema.js';
import { Resolvers } from '../../types/types.js';
import type { IUser } from '../../database/models/user/user-schema.js';
import { pubsub, EVENTS } from '../pubsub.js';
import { generateUniqueAttendanceId } from '../../database/generateUniqueAttendanceId.js';
import {
	provisionClerkUserForAdmin,
	provisionClerkUserForCoach,
} from '../../lib/clerk-provision.js';
import { hasRailwayAttendanceRowForCardNo } from '../../lib/railway-attendance-gate.js';

function normalizeEmail(email?: string | null) {
	return (email || '').trim().toLowerCase();
}

function buildExactEmailRegex(normalizedEmail: string) {
	return new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

function maskEmailForLogs(email?: string | null) {
	const normalized = normalizeEmail(email);
	if (!normalized) return '(no-email)';
	const [localPart, domain = ''] = normalized.split('@');
	const safeLocal = localPart.length <= 2
		? `${localPart[0] || '*'}*`
		: `${localPart.slice(0, 2)}***`;
	return `${safeLocal}@${domain}`;
}

function maskIdForLogs(id?: string | null) {
	if (!id) return '(no-id)';
	if (id.length <= 6) return `${id[0]}***`;
	return `${id.slice(0, 3)}***${id.slice(-3)}`;
}

type DevEmailVerificationEntry = {
	code: string;
	expiresAtMs: number;
	attempts: number;
};

const DEV_EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const DEV_EMAIL_CODE_MAX_ATTEMPTS = 5;
const devEmailVerificationStore = new Map<string, DevEmailVerificationEntry>();
const devCoachSignInCodeStore = new Map<string, DevEmailVerificationEntry>();

function generateDevVerificationCode() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

function consumeValidDevVerificationCode(email: string, code: string): boolean {
	const normalizedEmail = normalizeEmail(email);
	const entry = devEmailVerificationStore.get(normalizedEmail);
	if (!entry) return false;
	if (Date.now() > entry.expiresAtMs) {
		devEmailVerificationStore.delete(normalizedEmail);
		return false;
	}

	if (entry.code !== code) {
		entry.attempts += 1;
		if (entry.attempts >= DEV_EMAIL_CODE_MAX_ATTEMPTS) {
			devEmailVerificationStore.delete(normalizedEmail);
		} else {
			devEmailVerificationStore.set(normalizedEmail, entry);
		}
		return false;
	}

	devEmailVerificationStore.delete(normalizedEmail);
	return true;
}

function consumeValidDevCoachSignInCode(email: string, code: string): boolean {
	const normalizedEmail = normalizeEmail(email);
	const entry = devCoachSignInCodeStore.get(normalizedEmail);
	if (!entry) return false;
	if (Date.now() > entry.expiresAtMs) {
		devCoachSignInCodeStore.delete(normalizedEmail);
		return false;
	}

	if (entry.code !== code) {
		entry.attempts += 1;
		if (entry.attempts >= DEV_EMAIL_CODE_MAX_ATTEMPTS) {
			devCoachSignInCodeStore.delete(normalizedEmail);
		} else {
			devCoachSignInCodeStore.set(normalizedEmail, entry);
		}
		return false;
	}

	devCoachSignInCodeStore.delete(normalizedEmail);
	return true;
}

async function findUserByNormalizedEmail(normalizedEmail: string) {
	if (!normalizedEmail) return null;

	const exactCi = await User.findOne({ email: buildExactEmailRegex(normalizedEmail) });
	if (exactCi) return exactCi;

	return User.findOne({
		$expr: {
			$eq: [
				{
					$toLower: {
						$trim: { input: '$email' },
					},
				},
				normalizedEmail,
			],
		},
	});
}

/** Internal only: used by MemberDetails field resolver (not in GraphQL schema). */
const RAILWAY_GATE_ATTENDANCE_ID = '__railwayGateAttendanceId';

// Helper function to convert Mongoose document to GraphQL User type
const mapUserToGraphQL = (
	user: IUser & {
		_id: mongoose.Types.ObjectId;
		createdAt?: Date;
		updatedAt?: Date;
	}
) => {
	return {
		id: user._id.toString(),
		firstName: user.firstName,
		middleName: user.middleName || null,
		lastName: user.lastName,
		email: user.email,
		role: user.role as any, // Type assertion needed due to enum mismatch
		phoneNumber: user.phoneNumber?.toString(),
		dateOfBirth: user.dateOfBirth?.toISOString(),
		gender: user.gender || '',
		heardFrom: user.heardFrom || [],
		agreedToTermsAndConditions: user.agreedToTermsAndConditions,
		agreedToPrivacyPolicy: user.agreedToPrivacyPolicy,
		agreedToLiabilityWaiver: user.agreedToLiabilityWaiver,
		guardianIdVerificationPhotoUrl: user.guardianIdVerificationPhotoUrl || null,
		minorLiabilityWaiverPrintedName: user.minorLiabilityWaiverPrintedName || null,
		minorLiabilityWaiverSignatureUrl: user.minorLiabilityWaiverSignatureUrl || null,
		attendanceId: user.attendanceId || null,
		membershipDetails: user.membershipDetails
			? {
					membershipId: user.membershipDetails.membership_id?.toString(),
					physiqueGoalType: user.membershipDetails.physiqueGoalType || '',
					fitnessGoal: user.membershipDetails.fitnessGoal || [],
					workOutTime: user.membershipDetails.workOutTime || [],
					coachesIds:
						user.membershipDetails.coaches_ids?.map(
							(id: mongoose.Types.ObjectId) => id.toString()
						) || [],
					hasEnteredDetails: user.membershipDetails.hasEnteredDetails || false,
					facilityBiometricEnrollmentComplete:
						user.membershipDetails.facilityBiometricEnrollmentComplete ?? false,
					[RAILWAY_GATE_ATTENDANCE_ID]: user.attendanceId ?? null,
			  }
			: null,
		coachDetails: user.coachDetails
			? {
					clientsIds:
						user.coachDetails.clients_ids?.map((id: mongoose.Types.ObjectId) =>
							id.toString()
						) || [],
					sessionsIds:
						user.coachDetails.sessions_ids?.map((id: mongoose.Types.ObjectId) =>
							id.toString()
						) || [],
					specialization: user.coachDetails.specialization || [],
					ratings: user.coachDetails.ratings,
					yearsOfExperience: user.coachDetails.yearsOfExperience,
					moreDetails: user.coachDetails.moreDetails,
					teachingDate: user.coachDetails.teachingDate || [],
					teachingTime: user.coachDetails.teachingTime || [],
					clientLimit: user.coachDetails.clientLimit || 999,
			  }
			: null,
		loginHistory: user.loginHistory
			? user.loginHistory.map((entry) => ({
					ipAddress: entry.ipAddress || null,
					userAgent: entry.userAgent || null,
					loginAt: entry.loginAt?.toISOString() || new Date().toISOString(),
			  }))
			: [],
		isDisabled: !!user.isDisabled,
		disabledAt: user.disabledAt?.toISOString() || null,
		disableReason: user.disableReason || null,
		createdAt: user.createdAt?.toISOString(),
		updatedAt: user.updatedAt?.toISOString(),
	};
};

const userResolvers: Resolvers = {
	Query: {
		me: async (_, __, context) => {
			const userId = context.auth.user?.id;
			if (!userId) return null;
			const user = await User.findById(userId).lean();
			if (!user) return null;
			return mapUserToGraphQL(user as any);
		},
		getUser: async (_, { id }, context) => {
			const viewer = context.auth.user;
			if (!viewer) {
				throw new Error('Unauthorized: Please log in');
			}
			if (viewer.role !== 'admin' && viewer.id !== id) {
				throw new Error('Unauthorized: You can only view your own profile');
			}
			const user = await User.findById(id).lean();
			if (!user) return null;
			return mapUserToGraphQL(user as any);
		},
		getUsers: async (_, { role, includeDisabled }, context) => {
			const viewer = context.auth.user;
			if (!viewer) {
				throw new Error('Unauthorized: Please log in');
			}

			const query: Record<string, unknown> = role ? { role } : {};
			if (!includeDisabled) {
				query.isDisabled = { $ne: true };
			}

			if (viewer.role === 'coach') {
				const coach = await User.findById(viewer.id)
					.select('coachDetails.clients_ids')
					.lean();
				if (!coach) {
					throw new Error('Unauthorized: Coach account not found');
				}

				const clientIds =
					coach.coachDetails?.clients_ids?.map((id: mongoose.Types.ObjectId) =>
						id.toString()
					) || [];
				if (clientIds.length === 0) {
					return [];
				}

				// Coaches can only view their assigned member clients.
				if (role && role !== 'member') {
					return [];
				}
				query.role = 'member';
				query._id = {
					$in: clientIds.map((id) => new mongoose.Types.ObjectId(id)),
				};
			} else if (viewer.role !== 'admin') {
				throw new Error('Unauthorized: Only admins and coaches can view users');
			}

			const users = await User.find(query).lean();
			return users.map((user) => mapUserToGraphQL(user as any));
		},
	},
	Mutation: {
		login: async (_, { input }, context) => {
			const { email, password } = input;
			const normalizedEmail = normalizeEmail(email);

			console.log('[API] Login attempt for:', normalizedEmail ? `${normalizedEmail.slice(0, 3)}***` : '(no email)');

			// Match legacy rows with odd casing or surrounding whitespace too
			const user = await findUserByNormalizedEmail(normalizedEmail);
			if (!user) {
				throw new Error('Invalid email or password');
			}
			if (user.isDisabled) {
				throw new Error(user.disableReason || 'This account is disabled');
			}

			// Verify password
			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				throw new Error('Invalid email or password');
			}

			// Get IP address and user agent from request (req is available at runtime from Apollo context)
			const req = (context as { req?: { ip?: string; socket?: { remoteAddress?: string }; headers?: Record<string, string> } }).req;
			const ipAddress = req?.ip || req?.socket?.remoteAddress || 'Unknown';
			const userAgent = req?.headers?.['user-agent'] || 'Unknown';

			// Add login history entry
			if (!user.loginHistory) {
				user.loginHistory = [];
			}
			user.loginHistory.push({
				ipAddress,
				userAgent,
				loginAt: new Date(),
			});

			// Keep only last 50 login entries
			if (user.loginHistory.length > 50) {
				user.loginHistory = user.loginHistory.slice(-50);
			}

			await user.save();

			// Generate token
			const token = jwt.sign(
				{
					id: user._id!.toString(),
					role: user.role,
				},
				process.env.JWT_SIKRIT!
			);

			// Login user (sets cookie)
			context.auth.logIn({
				id: user._id!.toString(),
				role: user.role,
			});

			const userObj = user.toObject();
			return {
				user: mapUserToGraphQL(userObj as any),
				token, // Return token for React Native (cookies may not work)
			};
		},
		createUser: async (_, { input }, context) => {
			const {
				firstName,
				middleName,
				lastName,
				email,
				password,
				role,
				phoneNumber,
				dateOfBirth,
				gender,
				heardFrom,
				agreedToTermsAndConditions,
				agreedToPrivacyPolicy,
				agreedToLiabilityWaiver,
				guardianIdVerificationPhotoUrl,
				minorLiabilityWaiverPrintedName,
				minorLiabilityWaiverSignatureUrl,
				devVerificationCode,
				membershipDetails,
				coachDetails,
			} = input;
			const normalizedEmail = normalizeEmail(email);

			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			const clerkSub = context.auth.clerkSub;

			if (role === 'admin' || role === 'coach') {
				if (!userId || userRole !== 'admin') {
					throw new Error(
						role === 'admin'
							? 'Unauthorized: Only admins can create admin accounts'
							: 'Unauthorized: Only admins can create coach accounts'
					);
				}
			}

			// Check if user already exists
			const existingUser = await findUserByNormalizedEmail(normalizedEmail);
			if (existingUser) {
				throw new Error('User with this email already exists');
			}

			let clerkId: string | undefined;
			if (role === 'admin') {
				clerkId = await provisionClerkUserForAdmin({
					email,
					firstName,
					lastName,
				});
			} else if (role === 'coach') {
				const cd = coachDetails;
				clerkId = await provisionClerkUserForCoach({
					email,
					firstName,
					lastName,
					middleName,
					phoneNumber,
					gender,
					dateOfBirth,
					coachDetails: cd
						? {
								specialization: cd.specialization?.filter((s): s is string => s != null),
								yearsOfExperience: cd.yearsOfExperience ?? undefined,
								teachingDate: cd.teachingDate?.filter((s): s is string => s != null),
								teachingTime: cd.teachingTime?.filter((s): s is string => s != null),
								clientLimit: cd.clientLimit ?? undefined,
								moreDetails: cd.moreDetails ?? undefined,
						  }
						: undefined,
				});
			} else if (role === 'member' && clerkSub) {
				console.log(
					`[API][MEMBER_VERIFICATION] Start mobile member verification email=${maskEmailForLogs(normalizedEmail)} clerkSub=${maskIdForLogs(clerkSub)}`
				);
				const secret = process.env.CLERK_SECRET_KEY;
				if (!secret) {
					console.error(
						`[API][MEMBER_VERIFICATION] Failed: missing CLERK_SECRET_KEY email=${maskEmailForLogs(normalizedEmail)}`
					);
					throw new Error('CLERK_SECRET_KEY is not set; cannot complete member registration.');
				}
				const clerk = createClerkClient({ secretKey: secret });
				const cu = await clerk.users.getUser(clerkSub);
				const clerkEmail =
					cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
					cu.emailAddresses[0]?.emailAddress;
				if (!clerkEmail) {
					console.warn(
						`[API][MEMBER_VERIFICATION] Failed: no verified Clerk email clerkSub=${maskIdForLogs(clerkSub)}`
					);
					throw new Error('Your Clerk account has no verified email.');
				}
				if (normalizedEmail !== normalizeEmail(clerkEmail)) {
					console.warn(
						`[API][MEMBER_VERIFICATION] Failed: email mismatch input=${maskEmailForLogs(normalizedEmail)} clerk=${maskEmailForLogs(clerkEmail)} clerkSub=${maskIdForLogs(clerkSub)}`
					);
					throw new Error('Email must match your Clerk sign-in email.');
				}
				const dupeClerk = await User.findOne({ clerkId: clerkSub });
				if (dupeClerk) {
					console.warn(
						`[API][MEMBER_VERIFICATION] Failed: clerkSub already linked clerkSub=${maskIdForLogs(clerkSub)} existingUser=${maskIdForLogs(dupeClerk._id?.toString())}`
					);
					throw new Error('This sign-in is already linked to a gym account.');
				}
				console.log(
					`[API][MEMBER_VERIFICATION] Passed email=${maskEmailForLogs(clerkEmail)} clerkSub=${maskIdForLogs(clerkSub)}`
				);
				clerkId = clerkSub;
			} else if (role === 'member') {
				if (devVerificationCode && devVerificationCode.trim()) {
					const normalizedCode = devVerificationCode.replace(/\D/g, '');
					const verified = consumeValidDevVerificationCode(normalizedEmail, normalizedCode);
					if (!verified) {
						console.warn(
							`[API][DEV_EMAIL_CODE] Verification failed email=${maskEmailForLogs(normalizedEmail)}`
						);
						throw new Error('Invalid or expired verification code.');
					}
					console.log(
						`[API][DEV_EMAIL_CODE] Verification passed email=${maskEmailForLogs(normalizedEmail)}`
					);
				} else if (!password || password.trim().length < 6) {
					throw new Error('Password must be at least 6 characters');
				}
			}

			// Hash password (legacy auth) or generate one for Clerk-only users.
			const hashedPassword =
				password && password.trim().length > 0
					? await bcrypt.hash(password, 10)
					: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

			// Generate unique attendanceId
			const attendanceId = await generateUniqueAttendanceId();

			// Create user
			const user = new User({
				firstName,
				middleName,
				lastName,
				email: normalizedEmail,
				password: hashedPassword,
				...(clerkId ? { clerkId } : {}),
				role,
				phoneNumber: phoneNumber ? parseInt(phoneNumber) : undefined,
				dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
				gender: gender && gender.trim() !== '' ? gender : undefined,
				heardFrom,
				agreedToTermsAndConditions,
				agreedToPrivacyPolicy,
				agreedToLiabilityWaiver,
				guardianIdVerificationPhotoUrl,
				minorLiabilityWaiverPrintedName,
				minorLiabilityWaiverSignatureUrl,
				attendanceId,
				membershipDetails: membershipDetails
					? {
							membership_id: membershipDetails.membershipId,
							physiqueGoalType: membershipDetails.physiqueGoalType,
							fitnessGoal: membershipDetails.fitnessGoal,
							workOutTime: membershipDetails.workOutTime,
							coaches_ids: membershipDetails.coachesIds,
							hasEnteredDetails: membershipDetails.hasEnteredDetails ?? false,
							facilityBiometricEnrollmentComplete:
								membershipDetails.facilityBiometricEnrollmentComplete ?? false,
					  }
					: undefined,
				coachDetails: coachDetails
					? {
							clients_ids: coachDetails.clientsIds,
							sessions_ids: coachDetails.sessionsIds,
							specialization: coachDetails.specialization,
							ratings: coachDetails.ratings,
							yearsOfExperience: coachDetails.yearsOfExperience,
							moreDetails: coachDetails.moreDetails,
							teachingDate: coachDetails.teachingDate,
							teachingTime: coachDetails.teachingTime,
							clientLimit: coachDetails.clientLimit || 999,
					  }
					: undefined,
			});

			await user.save();
			if (role === 'member') {
				console.log(
					`[API][MEMBER_VERIFICATION] Account created userId=${maskIdForLogs(user._id?.toString())} email=${maskEmailForLogs(user.email)}`
				);
			}

			// Publish event for user updates
			pubsub.publish(EVENTS.USERS_UPDATED, {});

			// Generate token
			const token = jwt.sign(
				{
					id: user._id!.toString(),
					role: user.role,
				},
				process.env.JWT_SIKRIT!
			);

			// Login user (sets cookie)
			context.auth.logIn({
				id: user._id!.toString(),
				role: user.role,
			});

			const userObj = user.toObject();
			return {
				user: mapUserToGraphQL(userObj as any),
				token, // Return token for React Native (cookies may not work)
			};
		},
		updateUser: async (_, { id, input }, context) => {
			// Check if user is authenticated and can update this user
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Allow admins to update any user, or users to update their own profile
			const isAdmin = userRole === 'admin';
			const isUpdatingOwnProfile = userId === id;

			if (!isAdmin && !isUpdatingOwnProfile) {
				throw new Error('Unauthorized: You can only update your own profile');
			}

			// Note: Role cannot be updated (not in UpdateUserInput)

			// Get the current user to verify password and check email uniqueness
			const currentUser = await User.findById(id);
			if (!currentUser) {
				throw new Error('User not found');
			}

			// Prevent users from updating their own email (only admins can update other users' emails)
			if (input.email !== undefined && input.email !== currentUser.email) {
				// If user is updating their own profile (not an admin updating another user), prevent email change
				if (!isAdmin && isUpdatingOwnProfile) {
					throw new Error('You cannot change your own email address');
				}
				
				// Check email uniqueness if email is being changed (for admin updating another user)
				const normalizedInputEmail = normalizeEmail(input.email);
				const existingUser = await findUserByNormalizedEmail(normalizedInputEmail);
				if (existingUser && existingUser._id.toString() !== id) {
					throw new Error('Email is already in use');
				}
			}

			// Verify current password if password is being changed
			if (input.password) {
				// If user is updating their own profile, current password is always required
				if (isUpdatingOwnProfile) {
					if (!input.currentPassword) {
						throw new Error('Current password is required to change your password');
					}
					const isPasswordValid = await bcrypt.compare(
						input.currentPassword,
						currentUser.password
					);
					if (!isPasswordValid) {
						throw new Error('Current password is incorrect');
					}
				}
				// If admin is updating another user's password, current password is not required
				// (admins can reset other users' passwords)
			}

			// Get the user document (not lean) so we can modify and save it
			const userDoc = await User.findById(id);
			if (!userDoc) {
				throw new Error('User not found');
			}

			// Update top-level fields (InputMaybe = T | null; only assign when not null)
			if (input.firstName != null) userDoc.firstName = input.firstName;
			if (input.middleName !== undefined) userDoc.middleName = input.middleName ?? undefined;
			if (input.lastName != null) userDoc.lastName = input.lastName;
			// Only allow email update if admin is updating another user (not their own profile)
			if (input.email != null && (isAdmin && !isUpdatingOwnProfile)) {
				userDoc.email = normalizeEmail(input.email);
			}
			if (input.password) {
				userDoc.password = await bcrypt.hash(input.password, 10);
			}
			if (input.phoneNumber !== undefined) {
				userDoc.phoneNumber = input.phoneNumber != null ? parseInt(input.phoneNumber) : undefined;
			}
			if (input.dateOfBirth !== undefined) {
				userDoc.dateOfBirth = input.dateOfBirth != null ? new Date(input.dateOfBirth) : undefined;
			}
			if (input.gender != null) userDoc.gender = input.gender as IUser['gender'];
			if (input.heardFrom !== undefined) userDoc.heardFrom = (input.heardFrom ?? []).filter((x): x is string => x != null);
			if (input.agreedToTermsAndConditions !== undefined && input.agreedToTermsAndConditions !== null)
				userDoc.agreedToTermsAndConditions = input.agreedToTermsAndConditions;
			if (input.agreedToPrivacyPolicy !== undefined && input.agreedToPrivacyPolicy !== null)
				userDoc.agreedToPrivacyPolicy = input.agreedToPrivacyPolicy;
			if (input.agreedToLiabilityWaiver !== undefined && input.agreedToLiabilityWaiver !== null)
				userDoc.agreedToLiabilityWaiver = input.agreedToLiabilityWaiver;
			if (input.guardianIdVerificationPhotoUrl !== undefined) {
				userDoc.guardianIdVerificationPhotoUrl =
					input.guardianIdVerificationPhotoUrl ?? undefined;
			}
			if (input.minorLiabilityWaiverPrintedName !== undefined) {
				userDoc.minorLiabilityWaiverPrintedName =
					input.minorLiabilityWaiverPrintedName ?? undefined;
			}
			if (input.minorLiabilityWaiverSignatureUrl !== undefined) {
				userDoc.minorLiabilityWaiverSignatureUrl =
					input.minorLiabilityWaiverSignatureUrl ?? undefined;
			}

			// Update membershipDetails if provided
			if (input.membershipDetails !== undefined && input.membershipDetails !== null) {
				if (!userDoc.membershipDetails) {
					userDoc.membershipDetails = {};
				}
				const md = input.membershipDetails;
				if (md.membershipId != null)
					userDoc.membershipDetails.membership_id = new mongoose.Types.ObjectId(md.membershipId);
				if (md.physiqueGoalType !== undefined)
					userDoc.membershipDetails.physiqueGoalType = (md.physiqueGoalType ?? undefined) as any;
				if (md.fitnessGoal !== undefined)
					userDoc.membershipDetails.fitnessGoal = (md.fitnessGoal ?? []).filter((x): x is string => x != null);
				if (md.workOutTime !== undefined)
					userDoc.membershipDetails.workOutTime = (md.workOutTime ?? []).filter((x): x is string => x != null);
				if (md.coachesIds !== undefined)
					userDoc.membershipDetails.coaches_ids = (md.coachesIds ?? []).filter((id): id is string => id != null).map((id) => new mongoose.Types.ObjectId(id));
				if (md.hasEnteredDetails !== undefined && md.hasEnteredDetails !== null)
					userDoc.membershipDetails.hasEnteredDetails = md.hasEnteredDetails;
				if (
					md.facilityBiometricEnrollmentComplete !== undefined &&
					md.facilityBiometricEnrollmentComplete !== null
				)
					userDoc.membershipDetails.facilityBiometricEnrollmentComplete =
						md.facilityBiometricEnrollmentComplete;

				// Mark the nested object as modified to ensure Mongoose saves it
				userDoc.markModified('membershipDetails');
			}

			// Update coachDetails if provided
			if (input.coachDetails !== undefined && input.coachDetails !== null) {
				// Initialize coachDetails if it doesn't exist
				if (!userDoc.coachDetails) {
					userDoc.coachDetails = {
						clients_ids: [],
						sessions_ids: [],
						specialization: [],
						ratings: 0,
						yearsOfExperience: undefined,
						moreDetails: undefined,
						teachingDate: [],
						teachingTime: [],
						clientLimit: 999,
					} as NonNullable<IUser['coachDetails']>;
				}
				const cd = userDoc.coachDetails!;

				// Update only the fields that are explicitly provided
				if (input.coachDetails.specialization !== undefined) {
					cd.specialization =
						input.coachDetails.specialization === null
							? []
							: (input.coachDetails.specialization ?? []).filter((x): x is string => x != null);
				}
				if (input.coachDetails.yearsOfExperience !== undefined) {
					cd.yearsOfExperience = input.coachDetails.yearsOfExperience ?? undefined;
				}
				if (input.coachDetails.moreDetails !== undefined) {
					cd.moreDetails =
						input.coachDetails.moreDetails === null ||
						input.coachDetails.moreDetails === ''
							? undefined
							: input.coachDetails.moreDetails ?? undefined;
				}
				if (input.coachDetails.teachingDate !== undefined) {
					cd.teachingDate =
						input.coachDetails.teachingDate === null
							? []
							: (input.coachDetails.teachingDate ?? []).filter((x): x is string => x != null);
				}
				if (input.coachDetails.teachingTime !== undefined) {
					cd.teachingTime =
						input.coachDetails.teachingTime === null
							? []
							: (input.coachDetails.teachingTime ?? []).filter((x): x is string => x != null);
				}
				if (input.coachDetails.clientLimit !== undefined && input.coachDetails.clientLimit !== null) {
					cd.clientLimit = input.coachDetails.clientLimit;
				}

				// Mark the nested object as modified to ensure Mongoose saves it
				userDoc.markModified('coachDetails');
			}

			// Save the document
			await userDoc.save();

			// Publish event for user updates
			pubsub.publish(EVENTS.USERS_UPDATED, {});

			// Return the updated user
			const updatedUser = userDoc.toObject();
			return mapUserToGraphQL(updatedUser as any);
		},
		deleteUser: async (_, { id }, context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can delete users');
			}
			if (userId === id) {
				throw new Error('You cannot delete your own account');
			}

			const targetUser = await User.findById(id).lean();
			if (!targetUser) {
				return false;
			}

			const targetUserObjectId = new mongoose.Types.ObjectId(id);

			// Keep related documents clean by removing references to the user being deleted.
			if (targetUser.role === 'coach') {
				await User.updateMany(
					{ 'membershipDetails.coaches_ids': targetUserObjectId },
					{ $pull: { 'membershipDetails.coaches_ids': targetUserObjectId } }
				);
			}

			if (targetUser.role === 'member') {
				await User.updateMany(
					{ 'coachDetails.clients_ids': targetUserObjectId },
					{ $pull: { 'coachDetails.clients_ids': targetUserObjectId } }
				);
			}

			const deletedUser = await User.findByIdAndDelete(id);
			if (!deletedUser) {
				return false;
			}

			pubsub.publish(EVENTS.USERS_UPDATED, {});
			return true;
		},
		disableUser: async (
			_: any,
			{ id, reason }: { id: string; reason: string },
			context: any
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can disable users');
			}
			if (!reason?.trim()) {
				throw new Error('Disable reason is required');
			}
			if (userId === id) {
				throw new Error('You cannot disable your own account');
			}
			const user = await User.findByIdAndUpdate(
				id,
				{
					$set: {
						isDisabled: true,
						disabledAt: new Date(),
						disabledBy: new mongoose.Types.ObjectId(userId),
						disableReason: reason.trim(),
					},
				},
				{ new: true }
			).lean();
			if (!user) {
				throw new Error('User not found');
			}
			pubsub.publish(EVENTS.USERS_UPDATED, {});
			return mapUserToGraphQL(user as any);
		},
		enableUser: async (_: any, { id }: { id: string }, context: any) => {
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can enable users');
			}
			const user = await User.findByIdAndUpdate(
				id,
				{
					$set: { isDisabled: false },
					$unset: { disabledAt: '', disabledBy: '', disableReason: '' },
				},
				{ new: true }
			).lean();
			if (!user) throw new Error('User not found');
			pubsub.publish(EVENTS.USERS_UPDATED, {});
			return mapUserToGraphQL(user as any);
		},
		removeClient: async (_, { clientId }, context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			if (userRole !== 'coach') {
				throw new Error('Only coaches can remove clients');
			}

			// Get coach and client
			const coach = await User.findById(userId);
			const client = await User.findById(clientId);

			if (!coach) {
				throw new Error('Coach not found');
			}

			if (!client) {
				throw new Error('Client not found');
			}

			// Verify the client is actually a client of this coach
			const clientIdObj = new mongoose.Types.ObjectId(clientId);
			const coachClientIds = coach.coachDetails?.clients_ids || [];
			const isClient = coachClientIds.some(
				(id: mongoose.Types.ObjectId) => id.toString() === clientId
			);

			if (!isClient) {
				throw new Error('This client is not in your client list');
			}

			// Remove client from coach's clientsIds
			await User.findByIdAndUpdate(userId, {
				$pull: { 'coachDetails.clients_ids': clientIdObj },
			});

			// Remove coach from client's coachesIds
			const coachIdObj = new mongoose.Types.ObjectId(userId);
			await User.findByIdAndUpdate(clientId, {
				$pull: { 'membershipDetails.coaches_ids': coachIdObj },
			});

			return true;
		},
		requestDevEmailVerificationCode: async (_: any, { email }: { email: string }) => {
			const normalizedEmail = normalizeEmail(email);
			if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
				throw new Error('A valid email address is required.');
			}

			const code = generateDevVerificationCode();
			const expiresAtMs = Date.now() + DEV_EMAIL_CODE_TTL_MS;
			devEmailVerificationStore.set(normalizedEmail, {
				code,
				expiresAtMs,
				attempts: 0,
			});

			console.log(
				`[API][DEV_EMAIL_CODE] email=${maskEmailForLogs(normalizedEmail)} code=${code} expiresInMinutes=10`
			);
			return true;
		},
		requestDevCoachSignInCode: async (_: any, { email }: { email: string }) => {
			const normalizedEmail = normalizeEmail(email);
			if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
				throw new Error('A valid email address is required.');
			}

			const coach = await findUserByNormalizedEmail(normalizedEmail);
			if (!coach || coach.role !== 'coach') {
				throw new Error('Coach account not found for this email.');
			}
			if (coach.isDisabled) {
				throw new Error(coach.disableReason || 'This account is disabled');
			}

			const code = generateDevVerificationCode();
			const expiresAtMs = Date.now() + DEV_EMAIL_CODE_TTL_MS;
			devCoachSignInCodeStore.set(normalizedEmail, {
				code,
				expiresAtMs,
				attempts: 0,
			});

			console.log(
				`[API][DEV_COACH_SIGNIN_CODE] email=${maskEmailForLogs(normalizedEmail)} code=${code} expiresInMinutes=10`
			);
			return true;
		},
		devCoachSignIn: async (_: any, { email, code }: { email: string; code: string }, context: any) => {
			const normalizedEmail = normalizeEmail(email);
			const normalizedCode = (code || '').replace(/\D/g, '');
			if (!normalizedEmail || !normalizedCode) {
				throw new Error('Email and verification code are required.');
			}

			const coach = await findUserByNormalizedEmail(normalizedEmail);
			if (!coach || coach.role !== 'coach') {
				throw new Error('Coach account not found for this email.');
			}
			if (coach.isDisabled) {
				throw new Error(coach.disableReason || 'This account is disabled');
			}

			const verified = consumeValidDevCoachSignInCode(normalizedEmail, normalizedCode);
			if (!verified) {
				console.warn(
					`[API][DEV_COACH_SIGNIN_CODE] Verification failed email=${maskEmailForLogs(normalizedEmail)}`
				);
				throw new Error('Invalid or expired verification code.');
			}

			console.log(
				`[API][DEV_COACH_SIGNIN_CODE] Verification passed email=${maskEmailForLogs(normalizedEmail)}`
			);

			const token = jwt.sign(
				{
					id: coach._id!.toString(),
					role: coach.role,
				},
				process.env.JWT_SIKRIT!
			);

			context.auth.logIn({
				id: coach._id!.toString(),
				role: coach.role,
			});

			const userObj = coach.toObject();
			return {
				user: mapUserToGraphQL(userObj as any),
				token,
			};
		},
	},
	Subscription: {
		_empty: {
			subscribe: () => {
				// Placeholder subscription - never actually used
				// This is required because GraphQL doesn't allow empty types
				return pubsub.asyncIterator('_EMPTY');
			},
		},
		usersUpdated: {
			subscribe: (_: any, args: { role?: string | null }, context: any) => {
				// Authorization check
				if (!context.auth?.user || context.auth.user.role !== 'admin') {
					throw new Error('Unauthorized: Only admins can subscribe to user updates');
				}

				// Return async iterator for the subscription
				return pubsub.asyncIterator(EVENTS.USERS_UPDATED);
			},
			resolve: async (payload: any, args: { role?: string | null }) => {
				// Re-fetch users when event is published
				const role = args.role ?? undefined;
				const query = role ? { role } : {};
				const users = await User.find(query).lean();
				return users.map((user) => mapUserToGraphQL(user as any));
			},
		},
	},
	MemberDetails: {
		facilityBiometricEnrollmentComplete: async (parent: Record<string, unknown>) => {
			const stored = parent.facilityBiometricEnrollmentComplete;
			const normalized = (stored ?? false) as boolean;
			if (normalized !== false) return normalized;
			const aid = parent[RAILWAY_GATE_ATTENDANCE_ID];
			if (typeof aid !== 'number' || !Number.isFinite(aid) || aid <= 0) return false;
			return hasRailwayAttendanceRowForCardNo(aid);
		},
	},
};

export default userResolvers;
