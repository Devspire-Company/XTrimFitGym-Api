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

		if (userId !== id && userRole !== 'admin') {
			throw new Error('Unauthorized: You can only update your own profile');
		}

		// Prevent role changes - role cannot be updated
		if (input.role) {
			throw new Error('Role cannot be changed');
		}

		const updateData: any = {};

		if (input.firstName !== undefined) updateData.firstName = input.firstName;
		if (input.lastName !== undefined) updateData.lastName = input.lastName;
		if (input.email !== undefined) updateData.email = input.email;
		if (input.password) {
			updateData.password = await bcrypt.hash(input.password, 10);
		}
		if (input.phoneNumber !== undefined)
			updateData.phoneNumber = input.phoneNumber
				? parseInt(input.phoneNumber)
				: undefined;
		if (input.dateOfBirth !== undefined)
			updateData.dateOfBirth = input.dateOfBirth
				? new Date(input.dateOfBirth)
				: undefined;
		if (input.gender !== undefined) updateData.gender = input.gender;
		if (input.heardFrom !== undefined) updateData.heardFrom = input.heardFrom;
		if (input.agreedToTermsAndConditions !== undefined)
			updateData.agreedToTermsAndConditions =
				input.agreedToTermsAndConditions;
		if (input.agreedToPrivacyPolicy !== undefined)
			updateData.agreedToPrivacyPolicy = input.agreedToPrivacyPolicy;
		if (input.agreedToLiabilityWaiver !== undefined)
			updateData.agreedToLiabilityWaiver = input.agreedToLiabilityWaiver;

		if (input.membershipDetails !== undefined) {
			updateData.membershipDetails = {};
			if (input.membershipDetails.membershipId !== undefined)
				updateData.membershipDetails.membership_id = input.membershipDetails.membershipId;
			if (input.membershipDetails.physiqueGoalType !== undefined)
				updateData.membershipDetails.physiqueGoalType = input.membershipDetails.physiqueGoalType;
			if (input.membershipDetails.fitnessGoal !== undefined)
				updateData.membershipDetails.fitnessGoal = input.membershipDetails.fitnessGoal;
			if (input.membershipDetails.workOutTime !== undefined)
				updateData.membershipDetails.workOutTime = input.membershipDetails.workOutTime;
			if (input.membershipDetails.coachesIds !== undefined)
				updateData.membershipDetails.coaches_ids = input.membershipDetails.coachesIds;
		}

		if (input.coachDetails !== undefined) {
			updateData.coachDetails = {};
			if (input.coachDetails.clientsIds !== undefined)
				updateData.coachDetails.clients_ids = input.coachDetails.clientsIds;
			if (input.coachDetails.sessionsIds !== undefined)
				updateData.coachDetails.sessions_ids = input.coachDetails.sessionsIds;
			if (input.coachDetails.specialization !== undefined)
				updateData.coachDetails.specialization = input.coachDetails.specialization;
			if (input.coachDetails.ratings !== undefined)
				updateData.coachDetails.ratings = input.coachDetails.ratings;
			if (input.coachDetails.yearsOfExperience !== undefined)
				updateData.coachDetails.yearsOfExperience = input.coachDetails.yearsOfExperience;
			if (input.coachDetails.moreDetails !== undefined)
				updateData.coachDetails.moreDetails = input.coachDetails.moreDetails;
			if (input.coachDetails.teachingDate !== undefined)
				updateData.coachDetails.teachingDate = input.coachDetails.teachingDate;
			if (input.coachDetails.teachingTime !== undefined)
				updateData.coachDetails.teachingTime = input.coachDetails.teachingTime;
			if (input.coachDetails.clientLimit !== undefined)
				updateData.coachDetails.clientLimit = input.coachDetails.clientLimit;
		}

		const user = await User.findByIdAndUpdate(id, updateData, {
			new: true,
		}).lean();
		if (!user) {
			throw new Error('User not found');
		}

		return mapUserToGraphQL(user as any);
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
