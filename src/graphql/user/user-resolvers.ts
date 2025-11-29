import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../database/models/user/user-schema.js';
import { Resolvers } from '../../types/types.js';
import type { IUser } from '../../database/models/user/user-schema.js';

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
		createdAt: user.createdAt?.toISOString(),
		updatedAt: user.updatedAt?.toISOString(),
	};
};

const userResolvers: Resolvers = {
	Query: {
		getUser: async (_, { id }, context) => {
			const user = await User.findById(id).lean();
			if (!user) return null;
			return mapUserToGraphQL(user as any);
		},
		getUsers: async (_, { role }, context) => {
			const query = role ? { role } : {};
			const users = await User.find(query).lean();
			return users.map((user) => mapUserToGraphQL(user as any));
		},
	},
	Mutation: {
		login: async (_, { input }, context) => {
			const { email, password } = input;

			// Find user by email
			const user = await User.findOne({ email }).lean();
			if (!user) {
				throw new Error('Invalid email or password');
			}

			// Verify password
			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				throw new Error('Invalid email or password');
			}

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

			return {
				user: mapUserToGraphQL(user as any),
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
				membershipDetails,
				coachDetails,
			} = input;

			// Check if user already exists
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				throw new Error('User with this email already exists');
			}

			// Hash password
			const hashedPassword = await bcrypt.hash(password, 10);

			// Create user
			const user = new User({
				firstName,
				middleName,
				lastName,
				email,
				password: hashedPassword,
				role,
				phoneNumber: phoneNumber ? parseInt(phoneNumber) : undefined,
				dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
				gender,
				heardFrom,
				agreedToTermsAndConditions,
				agreedToPrivacyPolicy,
				agreedToLiabilityWaiver,
				membershipDetails: membershipDetails
					? {
							membership_id: membershipDetails.membershipId,
							physiqueGoalType: membershipDetails.physiqueGoalType,
							fitnessGoal: membershipDetails.fitnessGoal,
							workOutTime: membershipDetails.workOutTime,
							coaches_ids: membershipDetails.coachesIds,
							hasEnteredDetails: membershipDetails.hasEnteredDetails ?? false,
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

			// Check email uniqueness if email is being changed
			if (input.email !== undefined && input.email !== currentUser.email) {
				const existingUser = await User.findOne({ email: input.email });
				if (existingUser && existingUser._id.toString() !== id) {
					throw new Error('Email is already in use');
				}
			}

			// Verify current password if password is being changed
			// Admins can change passwords without providing current password
			if (input.password) {
				if (!isAdmin && !input.currentPassword) {
					throw new Error('Current password is required to change password');
				}
				// Only verify current password if user is updating their own profile and not an admin
				if (!isAdmin && isUpdatingOwnProfile && input.currentPassword) {
					const isPasswordValid = await bcrypt.compare(
						input.currentPassword,
						currentUser.password
					);
					if (!isPasswordValid) {
						throw new Error('Current password is incorrect');
					}
				}
			}

			// Get the user document (not lean) so we can modify and save it
			const userDoc = await User.findById(id);
			if (!userDoc) {
				throw new Error('User not found');
			}

			// Update top-level fields
			if (input.firstName !== undefined) userDoc.firstName = input.firstName;
			if (input.middleName !== undefined) userDoc.middleName = input.middleName;
			if (input.lastName !== undefined) userDoc.lastName = input.lastName;
			if (input.email !== undefined) userDoc.email = input.email;
			if (input.password) {
				userDoc.password = await bcrypt.hash(input.password, 10);
			}
			if (input.phoneNumber !== undefined) {
				userDoc.phoneNumber = input.phoneNumber ? parseInt(input.phoneNumber) : undefined;
			}
			if (input.dateOfBirth !== undefined) {
				userDoc.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : undefined;
			}
			if (input.gender !== undefined) userDoc.gender = input.gender;
			if (input.heardFrom !== undefined) userDoc.heardFrom = input.heardFrom;
			if (input.agreedToTermsAndConditions !== undefined)
				userDoc.agreedToTermsAndConditions = input.agreedToTermsAndConditions;
			if (input.agreedToPrivacyPolicy !== undefined)
				userDoc.agreedToPrivacyPolicy = input.agreedToPrivacyPolicy;
			if (input.agreedToLiabilityWaiver !== undefined)
				userDoc.agreedToLiabilityWaiver = input.agreedToLiabilityWaiver;

			// Update membershipDetails if provided
			if (input.membershipDetails !== undefined && input.membershipDetails !== null) {
				if (!userDoc.membershipDetails) {
					userDoc.membershipDetails = {};
				}
				if (input.membershipDetails.membershipId !== undefined)
					userDoc.membershipDetails.membership_id = input.membershipDetails.membershipId;
				if (input.membershipDetails.physiqueGoalType !== undefined)
					userDoc.membershipDetails.physiqueGoalType = input.membershipDetails.physiqueGoalType;
				if (input.membershipDetails.fitnessGoal !== undefined)
					userDoc.membershipDetails.fitnessGoal = input.membershipDetails.fitnessGoal;
				if (input.membershipDetails.workOutTime !== undefined)
					userDoc.membershipDetails.workOutTime = input.membershipDetails.workOutTime;
				if (input.membershipDetails.coachesIds !== undefined)
					userDoc.membershipDetails.coaches_ids = input.membershipDetails.coachesIds;
				if (input.membershipDetails.hasEnteredDetails !== undefined)
					userDoc.membershipDetails.hasEnteredDetails = input.membershipDetails.hasEnteredDetails;
				
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
						ratings: [],
						yearsOfExperience: undefined,
						moreDetails: undefined,
						teachingDate: [],
						teachingTime: [],
						clientLimit: 999,
					};
				}

				// Update only the fields that are explicitly provided
				if (input.coachDetails.specialization !== undefined) {
					userDoc.coachDetails.specialization =
						input.coachDetails.specialization === null
							? []
							: input.coachDetails.specialization;
				}
				if (input.coachDetails.yearsOfExperience !== undefined) {
					userDoc.coachDetails.yearsOfExperience = input.coachDetails.yearsOfExperience;
				}
				if (input.coachDetails.moreDetails !== undefined) {
					userDoc.coachDetails.moreDetails =
						input.coachDetails.moreDetails === null ||
						input.coachDetails.moreDetails === ''
							? undefined
							: input.coachDetails.moreDetails;
				}
				if (input.coachDetails.teachingDate !== undefined) {
					userDoc.coachDetails.teachingDate =
						input.coachDetails.teachingDate === null
							? []
							: input.coachDetails.teachingDate;
				}
				if (input.coachDetails.teachingTime !== undefined) {
					userDoc.coachDetails.teachingTime =
						input.coachDetails.teachingTime === null
							? []
							: input.coachDetails.teachingTime;
				}
				if (input.coachDetails.clientLimit !== undefined) {
					userDoc.coachDetails.clientLimit = input.coachDetails.clientLimit;
				}

				// Mark the nested object as modified to ensure Mongoose saves it
				userDoc.markModified('coachDetails');
			}

			// Save the document
			await userDoc.save();

			// Return the updated user
			const updatedUser = userDoc.toObject();
			return mapUserToGraphQL(updatedUser as any);
		},
		deleteUser: async (_, { id }, context) => {
			// Check if user is authenticated and can delete this user
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			if (userId !== id && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only delete your own account');
			}

			const user = await User.findByIdAndDelete(id);
			return !!user;
		},
	},
};

export default userResolvers;
