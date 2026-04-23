import DatePicker from '@/components/DatePicker';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import Input from '@/components/Input';
import PhilippinePhoneInput from '@/components/PhilippinePhoneInput';
import Select from '@/components/Select';
import TabHeader from '@/components/TabHeader';
import TimePicker from '@/components/TimePicker';
import { useAuth } from '@/contexts/AuthContext';
import { UPDATE_USER_MUTATION } from '@/graphql/mutations';
import { GET_COACH_RATINGS_QUERY } from '@/graphql/queries';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import {
	formatPhilippinePhoneDisplay,
	isValidPhilippineMobileNational,
	nationalDigitsFromStoredPhone,
} from '@/utils/philippine-phone';
import { formatTimeRangeTo12Hour } from '@/utils/time-utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import ConfirmModal from '@/components/ConfirmModal';
import React, { useEffect, useState } from 'react';
import {
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

type UpdateUserMutation = any;
type UpdateUserMutationVariables = any;

const genderOptions = [
	{ label: 'Male', value: 'Male' },
	{ label: 'Female', value: 'Female' },
	{ label: 'Prefer not to say', value: 'Prefer not to say' },
];

const fitnessGoalOptions = [
	{ label: 'Weight loss', value: 'Weight loss' },
	{ label: 'Muscle building', value: 'Muscle building' },
	{ label: 'General fitness', value: 'General fitness' },
	{ label: 'Strength training', value: 'Strength training' },
	{ label: 'Endurance', value: 'Endurance' },
	{ label: 'Flexibility', value: 'Flexibility' },
	{ label: 'Athletic Performance', value: 'Athletic Performance' },
	{ label: 'Rehabilitation', value: 'Rehabilitation' },
];

const dayOptions = [
	{ label: 'Monday', value: 'Monday' },
	{ label: 'Tuesday', value: 'Tuesday' },
	{ label: 'Wednesday', value: 'Wednesday' },
	{ label: 'Thursday', value: 'Thursday' },
	{ label: 'Friday', value: 'Friday' },
	{ label: 'Saturday', value: 'Saturday' },
	{ label: 'Sunday', value: 'Sunday' },
];

const CoachProfile = () => {
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingCredentials, setIsEditingCredentials] = useState(false);
	const [showRatingsModal, setShowRatingsModal] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });

	// Query coach ratings
	const { data: ratingsData, refetch: refetchRatings } = useQuery<any>(
		GET_COACH_RATINGS_QUERY,
		{
			variables: { coachId: user?.id || '' },
			skip: !user?.id || !showRatingsModal,
			fetchPolicy: 'cache-and-network',
		}
	);

	const [firstName, setFirstName] = useState(user?.firstName || '');
	const [middleName, setMiddleName] = useState(user?.middleName || '');
	const [lastName, setLastName] = useState(user?.lastName || '');
	const [phoneNumber, setPhoneNumber] = useState(() =>
		nationalDigitsFromStoredPhone(user?.phoneNumber)
	);
	const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
		user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined
	);
	const [gender, setGender] = useState(user?.gender || '');
	const [specializations, setSpecializations] = useState<string[]>(
		user?.coachDetails?.specialization || []
	);
	const [yearsOfExperience, setYearsOfExperience] = useState(
		user?.coachDetails?.yearsOfExperience?.toString() || ''
	);
	const [moreDetails, setMoreDetails] = useState(
		user?.coachDetails?.moreDetails || ''
	);
	const [teachingDates, setTeachingDates] = useState<string[]>(
		(user?.coachDetails?.teachingDate?.filter((d): d is string => d !== null) ||
			[]) as string[]
	);

	// Parse teaching time
	const parseTeachingTime = (timeStr?: (string | null)[] | null) => {
		if (!timeStr || timeStr.length === 0) {
			const startDate = new Date();
			startDate.setHours(8, 0, 0, 0);
			const endDate = new Date();
			endDate.setHours(18, 0, 0, 0);
			return { start: startDate, end: endDate };
		}
		const timeRange = timeStr[0];
		if (timeRange && timeRange.includes('-') && !timeRange.includes(' ')) {
			const [start, end] = timeRange.split('-');
			const startHour = parseInt(start);
			const endHour = parseInt(end);
			const startDate = new Date();
			startDate.setHours(startHour, 0, 0, 0);
			const endDate = new Date();
			endDate.setHours(endHour, 0, 0, 0);
			return { start: startDate, end: endDate };
		}
		// Default: 8 AM start, 6 PM end
		const startDate = new Date();
		startDate.setHours(8, 0, 0, 0);
		const endDate = new Date();
		endDate.setHours(18, 0, 0, 0);
		return { start: startDate, end: endDate };
	};

	const initialTeachingTime = parseTeachingTime(
		user?.coachDetails?.teachingTime as (string | null)[] | undefined
	);
	const [teachingTimeStart, setTeachingTimeStart] = useState<Date | undefined>(
		initialTeachingTime.start
	);
	const [teachingTimeEnd, setTeachingTimeEnd] = useState<Date | undefined>(
		initialTeachingTime.end
	);
	const [clientLimit, setClientLimit] = useState(
		user?.coachDetails?.clientLimit?.toString() || ''
	);

	// Credentials section
	const [email, setEmail] = useState(user?.email || '');
	const [password, setPassword] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [credentialErrors, setCredentialErrors] = useState<
		Record<string, string>
	>({});

	useEffect(() => {
		if (!user || isEditing) return;
		setPhoneNumber(nationalDigitsFromStoredPhone(user.phoneNumber));
	}, [user?.id, user?.phoneNumber, isEditing]);

	const [updateUserMutation, { loading }] = useMutation<
		UpdateUserMutation,
		UpdateUserMutationVariables
	>(UPDATE_USER_MUTATION, {
		onCompleted: (data) => {
			if (data.updateUser) {
				const updatedUser = convertGraphQLUser(data.updateUser);
				dispatch(setUser(updatedUser));
				setIsEditing(false);
				setIsEditingCredentials(false);
				setAlertModal({
					visible: true,
					title: 'Success',
					message: 'Profile updated successfully!',
					variant: 'success',
				});
				setPassword('');
				setCurrentPassword('');
			}
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!firstName.trim()) {
			newErrors.firstName = 'First name is required';
		}

		if (!lastName.trim()) {
			newErrors.lastName = 'Last name is required';
		}

		if (!phoneNumber.trim()) {
			newErrors.phoneNumber = 'Phone number is required';
		} else if (!isValidPhilippineMobileNational(phoneNumber)) {
			newErrors.phoneNumber =
				'Enter 10 digits after +63 (Philippine mobile, e.g. 9XX XXX XXXX — no leading 0)';
		}

		if (!dateOfBirth) {
			newErrors.dateOfBirth = 'Date of birth is required';
		}

		if (!gender) {
			newErrors.gender = 'Gender is required';
		}

		if (specializations.length === 0) {
			newErrors.specializations = 'At least one specialization is required';
		}

		if (!teachingTimeStart || !teachingTimeEnd) {
			newErrors.teachingTime = 'Teaching time range is required';
		} else {
			const startHours =
				teachingTimeStart.getHours() * 60 + teachingTimeStart.getMinutes();
			const endHours =
				teachingTimeEnd.getHours() * 60 + teachingTimeEnd.getMinutes();
			if (startHours >= endHours) {
				newErrors.teachingTime = 'End time must be after start time';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validateCredentials = () => {
		const newErrors: Record<string, string> = {};

		if (!email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = 'Please enter a valid email';
		}

		if (password) {
			if (!currentPassword) {
				newErrors.currentPassword =
					'Current password is required to change password';
			}
			if (password.length < 6) {
				newErrors.password = 'Password must be at least 6 characters';
			}
		}

		setCredentialErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm() || !user?.id) return;

		const coachDetailsInput: any = {};

		coachDetailsInput.specialization = specializations;

		if (yearsOfExperience && yearsOfExperience.trim()) {
			coachDetailsInput.yearsOfExperience = parseInt(yearsOfExperience);
		}

		coachDetailsInput.moreDetails = moreDetails.trim() || undefined;

		coachDetailsInput.teachingDate = teachingDates;

		if (teachingTimeStart && teachingTimeEnd) {
			coachDetailsInput.teachingTime = [
				`${teachingTimeStart.getHours()}-${teachingTimeEnd.getHours()}`,
			];
		}

		if (clientLimit && clientLimit.trim()) {
			coachDetailsInput.clientLimit = parseInt(clientLimit);
		}

		const input: any = {
			firstName: firstName.trim(),
			middleName: middleName.trim() || undefined,
			lastName: lastName.trim(),
			phoneNumber: phoneNumber.trim(),
			dateOfBirth: dateOfBirth?.toISOString(),
			gender,
			coachDetails:
				Object.keys(coachDetailsInput).length > 0
					? coachDetailsInput
					: undefined,
		};

		updateUserMutation({
			variables: {
				id: user.id,
				input,
			},
		});
	};

	const handleSaveCredentials = () => {
		if (!validateCredentials() || !user?.id) return;

		const input: any = {
			email: email.trim(),
		};

		if (password) {
			input.password = password;
			input.currentPassword = currentPassword;
		}

		updateUserMutation({
			variables: {
				id: user.id,
				input,
			},
		});
	};

	const handleCancel = () => {
		// Reset form to original values
		setFirstName(user?.firstName || '');
		setMiddleName(user?.middleName || '');
		setLastName(user?.lastName || '');
		setPhoneNumber(nationalDigitsFromStoredPhone(user?.phoneNumber));
		setDateOfBirth(user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined);
		setGender(user?.gender || '');
		setSpecializations(user?.coachDetails?.specialization || []);
		setYearsOfExperience(
			user?.coachDetails?.yearsOfExperience?.toString() || ''
		);
		setMoreDetails(user?.coachDetails?.moreDetails || '');
		setTeachingDates(
			(user?.coachDetails?.teachingDate?.filter(
				(d): d is string => d !== null
			) || []) as string[]
		);
		const teachingTime = parseTeachingTime(
			user?.coachDetails?.teachingTime as (string | null)[] | undefined
		);
		setTeachingTimeStart(teachingTime.start);
		setTeachingTimeEnd(teachingTime.end);
		setClientLimit(user?.coachDetails?.clientLimit?.toString() || '');
		setErrors({});
		setIsEditing(false);
	};

	const handleCancelCredentials = () => {
		setEmail(user?.email || '');
		setPassword('');
		setCurrentPassword('');
		setCredentialErrors({});
		setIsEditingCredentials(false);
	};

	const toggleSpecialization = (goal: string) => {
		setSpecializations((prev) => {
			if (prev.includes(goal)) {
				return prev.filter((g) => g !== goal);
			}
			return [...prev, goal];
		});
		setErrors({ ...errors, specializations: '' });
	};

	const toggleTeachingDate = (day: string) => {
		setTeachingDates((prev) => {
			if (prev.includes(day)) {
				return prev.filter((d) => d !== day);
			}
			return [...prev, day];
		});
	};

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<TabHeader showCoachIcon={false} />
			<ScrollView
				className='flex-1'
				contentContainerClassName='p-5'
				showsVerticalScrollIndicator={false}
			>
				<View className='flex-row items-center justify-between mb-6 pb-4 border-b border-[#F9C513]/20'>
					<View>
						<Text className='text-3xl font-bold text-text-primary'>
							Profile
						</Text>
						<Text className='text-text-secondary mt-1'>
							Manage your account details
						</Text>
					</View>
					{!isEditing && (
						<TouchableOpacity
							onPress={() => setIsEditing(true)}
							className='flex-row items-center bg-bg-primary px-4 py-2 rounded-lg border border-[#F9C513]/20'
						>
							<Ionicons name='create-outline' size={20} color='#F9C513' />
							<Text className='text-[#F9C513] font-semibold ml-2'>Edit</Text>
						</TouchableOpacity>
					)}
				</View>

				<View className='items-center mb-6 pb-6 border-b border-[#F9C513]/20'>
					<View className='bg-[#F9C513] rounded-full w-24 h-24 items-center justify-center mb-4 border-2 border-bg-darker/30'>
						<Text className='text-bg-darker font-bold text-3xl'>
							{(firstName || user?.firstName || '').charAt(0)}
							{(lastName || user?.lastName || '').charAt(0)}
						</Text>
					</View>
					<Text className='text-2xl font-bold text-text-primary'>
						{`Coach ${firstName || user?.firstName || ''} ${lastName || user?.lastName || ''}`.trim()}
					</Text>
					<Text className='text-text-secondary mt-1'>
						{email || user?.email || ''}
					</Text>
				</View>

				{isEditing ? (
					<View className='gap-4'>
						<Input
							label='First Name'
							placeholder='Enter your first name'
							value={firstName}
							onChangeText={(text) => {
								setFirstName(text);
								setErrors({ ...errors, firstName: '' });
							}}
							autoCapitalize='words'
							error={errors.firstName}
						/>

						<Input
							label='Middle Name'
							placeholder='Enter your middle name (optional)'
							value={middleName}
							onChangeText={(text) => {
								setMiddleName(text);
							}}
							autoCapitalize='words'
						/>

						<Input
							label='Last Name'
							placeholder='Enter your last name'
							value={lastName}
							onChangeText={(text) => {
								setLastName(text);
								setErrors({ ...errors, lastName: '' });
							}}
							autoCapitalize='words'
							error={errors.lastName}
						/>

						<PhilippinePhoneInput
							label='Phone Number'
							value={phoneNumber}
							onChangeText={(digits) => {
								setPhoneNumber(digits);
								setErrors({ ...errors, phoneNumber: '' });
							}}
							error={errors.phoneNumber}
						/>

						<DatePicker
							label='Date of Birth'
							value={dateOfBirth}
							onChange={(date) => {
								setDateOfBirth(date);
								setErrors({ ...errors, dateOfBirth: '' });
							}}
							maximumDate={new Date()}
							minimumDate={new Date(1900, 0, 1)}
							error={errors.dateOfBirth}
						/>

						<Select
							label='Gender'
							options={genderOptions}
							value={gender}
							onChange={(value) => {
								setGender(value);
								setErrors({ ...errors, gender: '' });
							}}
							placeholder='Select your gender'
							error={errors.gender}
						/>

						{/* Coach Details Section */}
						<View className='border-t border-[#F9C513]/20 pt-4 mt-2'>
							<Text className='text-xl font-semibold text-text-primary mb-4 pb-4 border-b border-bg-darker/30'>
								Coach Information
							</Text>

							<View className='mb-4'>
								<Text className='text-text-primary font-semibold mb-2'>
									Specializations *
								</Text>
								<View className='flex-row flex-wrap gap-2'>
									{fitnessGoalOptions.map((option) => {
										const isSelected = specializations.includes(option.value);
										return (
											<TouchableOpacity
												key={option.value}
												onPress={() => toggleSpecialization(option.value)}
												className={`px-4 py-2 rounded-lg border-2 ${
													isSelected
														? 'bg-[#F9C513]/20 border-[#F9C513]'
														: 'bg-bg-darker border-[#F9C513]/30'
												}`}
											>
												<View className='flex-row items-center'>
													{isSelected && (
														<Ionicons
															name='checkmark-circle'
															size={18}
															color='#F9C513'
															style={{ marginRight: 6 }}
														/>
													)}
													<Text
														className={`font-medium ${
															isSelected
																? 'text-[#F9C513]'
																: 'text-text-secondary'
														}`}
													>
														{option.label}
													</Text>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
								{errors.specializations && (
									<Text className='text-red-500 text-sm mt-1'>
										{errors.specializations}
									</Text>
								)}
							</View>

							<Input
								label='Years of Experience'
								placeholder='Enter years of experience'
								value={yearsOfExperience}
								onChangeText={setYearsOfExperience}
								keyboardType='number-pad'
							/>

							<Input
								label='Bio / More Details'
								placeholder='Tell clients about yourself...'
								value={moreDetails}
								onChangeText={setMoreDetails}
								multiline
								numberOfLines={4}
							/>

							<View className='mb-4'>
								<Text className='text-text-primary font-semibold mb-2'>
									Teaching Days
								</Text>
								<View className='flex-row flex-wrap gap-2'>
									{dayOptions.map((option) => {
										const isSelected = teachingDates.includes(option.value);
										return (
											<TouchableOpacity
												key={option.value}
												onPress={() => toggleTeachingDate(option.value)}
												className={`px-4 py-2 rounded-lg border-2 ${
													isSelected
														? 'bg-[#F9C513]/20 border-[#F9C513]'
														: 'bg-bg-darker border-[#F9C513]/30'
												}`}
											>
												<View className='flex-row items-center'>
													{isSelected && (
														<Ionicons
															name='checkmark-circle'
															size={18}
															color='#F9C513'
															style={{ marginRight: 6 }}
														/>
													)}
													<Text
														className={`font-medium ${
															isSelected
																? 'text-[#F9C513]'
																: 'text-text-secondary'
														}`}
													>
														{option.label}
													</Text>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
							</View>

							<View className='mb-4'>
								<Text className='text-text-primary font-semibold mb-2'>
									Teaching Time
								</Text>
								<View className='flex-row gap-3'>
									<View className='flex-1'>
										<TimePicker
											label='Start Time'
											value={teachingTimeStart}
											onChange={(date) => {
												setTeachingTimeStart(date);
												setErrors({ ...errors, teachingTime: '' });
											}}
											placeholder='Select start time'
											error={errors.teachingTime}
											containerClassName='mb-0'
										/>
									</View>
									<View className='flex-1'>
										<TimePicker
											label='End Time'
											value={teachingTimeEnd}
											onChange={(date) => {
												setTeachingTimeEnd(date);
												setErrors({ ...errors, teachingTime: '' });
											}}
											placeholder='Select end time'
											containerClassName='mb-0'
										/>
									</View>
								</View>
							</View>

							<Input
								label='Client Limit'
								placeholder='Maximum number of clients (e.g., 10)'
								value={clientLimit}
								onChangeText={setClientLimit}
								keyboardType='number-pad'
							/>
						</View>

						<View className='flex-row gap-3 mt-4'>
							<GradientButton
								onPress={handleCancel}
								variant='secondary'
								style={{ flex: 1 }}
								disabled={loading}
							>
								Cancel
							</GradientButton>
							<GradientButton
								onPress={handleSave}
								loading={loading}
								style={{ flex: 1 }}
							>
								{loading ? 'Saving...' : 'Save Changes'}
							</GradientButton>
						</View>
					</View>
				) : (
					<>
						<View className='bg-bg-primary rounded-xl p-5 mb-4 border border-[#F9C513]/20'>
							<View className='flex-row items-center justify-between mb-4 pb-4 border-b border-bg-darker/30'>
								<Text className='text-xl font-semibold text-text-primary'>
									Personal Information
								</Text>
							</View>
							<View className='mb-3'>
								<Text className='text-text-secondary text-sm mb-1'>Phone</Text>
								<Text className='text-text-primary font-medium'>
									{formatPhilippinePhoneDisplay(user?.phoneNumber) ?? 'Not provided'}
								</Text>
							</View>
							<View className='mb-3'>
								<Text className='text-text-secondary text-sm mb-1'>
									Date of Birth
								</Text>
								<Text className='text-text-primary font-medium'>
									{user?.dateOfBirth
										? new Date(user.dateOfBirth).toLocaleDateString()
										: 'Not provided'}
								</Text>
							</View>
							<View>
								<Text className='text-text-secondary text-sm mb-1'>Gender</Text>
								<Text className='text-text-primary font-medium'>
									{user?.gender || 'Not provided'}
								</Text>
							</View>
						</View>

						<View className='bg-bg-primary rounded-xl p-5 mb-4 border border-[#F9C513]/20'>
							<View className='flex-row items-center justify-between mb-4 pb-4 border-b border-bg-darker/30'>
								<Text className='text-xl font-semibold text-text-primary'>
									Account Credentials
								</Text>
								<TouchableOpacity
									onPress={() => setIsEditingCredentials(true)}
									className='flex-row items-center px-3 py-1 rounded-lg border border-[#F9C513]/20'
								>
									<Ionicons name='create-outline' size={18} color='#F9C513' />
									<Text className='text-[#F9C513] font-semibold ml-1'>
										Edit
									</Text>
								</TouchableOpacity>
							</View>
							<View className='mb-3'>
								<Text className='text-text-secondary text-sm mb-1'>Email</Text>
								<Text className='text-text-primary font-medium'>
									{user?.email || 'Not provided'}
								</Text>
							</View>
							<View>
								<Text className='text-text-secondary text-sm mb-1'>
									Password
								</Text>
								<Text className='text-text-primary font-medium'>••••••••</Text>
							</View>
						</View>

						{isEditingCredentials && (
							<View className='bg-bg-primary rounded-xl p-5 mb-4 gap-4 border border-[#F9C513]/20'>
								<Text className='text-xl font-semibold text-text-primary mb-2 pb-4 border-b border-bg-darker/30'>
									Edit Credentials
								</Text>
								<Input
									label='Email'
									placeholder='Enter your email'
									value={email}
									onChangeText={(text) => {
										setEmail(text);
										setCredentialErrors({ ...credentialErrors, email: '' });
									}}
									keyboardType='email-address'
									autoCapitalize='none'
									autoComplete='email'
									error={credentialErrors.email}
								/>

								<Input
									label='Current Password'
									placeholder='Enter your current password'
									value={currentPassword}
									onChangeText={(text) => {
										setCurrentPassword(text);
										setCredentialErrors({
											...credentialErrors,
											currentPassword: '',
										});
									}}
									secureTextEntry
									autoCapitalize='none'
									error={credentialErrors.currentPassword}
								/>

								<Input
									label='New Password (optional)'
									placeholder='Enter new password (leave blank to keep current)'
									value={password}
									onChangeText={(text) => {
										setPassword(text);
										setCredentialErrors({ ...credentialErrors, password: '' });
									}}
									secureTextEntry
									autoCapitalize='none'
									autoComplete='password-new'
									error={credentialErrors.password}
								/>

								<View className='flex-row gap-3 mt-2'>
									<GradientButton
										onPress={handleCancelCredentials}
										variant='secondary'
										style={{ flex: 1 }}
										disabled={loading}
									>
										Cancel
									</GradientButton>
									<GradientButton
										onPress={handleSaveCredentials}
										loading={loading}
										style={{ flex: 1 }}
									>
										{loading ? 'Saving...' : 'Save Changes'}
									</GradientButton>
								</View>
							</View>
						)}

						{user?.coachDetails && (
							<View className='bg-bg-primary rounded-xl p-5 border border-[#F9C513]/20'>
								<Text className='text-xl font-semibold text-text-primary mb-4 pb-4 border-b border-bg-darker/30'>
									Coach Details
								</Text>
								{user.coachDetails.specialization &&
									user.coachDetails.specialization.length > 0 && (
										<View className='mb-4'>
											<Text className='text-text-secondary text-sm mb-2'>
												Specializations
											</Text>
											<View className='flex-row flex-wrap'>
												{user.coachDetails.specialization.map(
													(spec: string, index: number) => (
														<View
															key={index}
															className='bg-bg-darker px-3 py-2 rounded-lg mr-2 mb-2 border border-[#F9C513]/30'
														>
															<Text className='text-text-primary'>{spec}</Text>
														</View>
													)
												)}
											</View>
										</View>
									)}
								{user.coachDetails.yearsOfExperience && (
									<View className='mb-4'>
										<Text className='text-text-secondary text-sm mb-1'>
											Years of Experience
										</Text>
										<Text className='text-text-primary font-medium'>
											{String(user.coachDetails.yearsOfExperience)} years
										</Text>
									</View>
								)}
								{user.coachDetails.moreDetails && (
									<View className='mb-4'>
										<Text className='text-text-secondary text-sm mb-1'>
											Bio
										</Text>
										<Text className='text-text-primary font-medium'>
											{user.coachDetails.moreDetails}
										</Text>
									</View>
								)}
								{user.coachDetails.teachingTime &&
									user.coachDetails.teachingTime.length > 0 && (
										<View className='mb-4'>
											<Text className='text-text-secondary text-sm mb-1'>
												Teaching Time
											</Text>
											<Text className='text-text-primary font-medium'>
												{formatTimeRangeTo12Hour(
													user.coachDetails.teachingTime[0]
												)}
											</Text>
										</View>
									)}
								<View className='mb-4'>
									<Text className='text-text-secondary text-sm mb-1'>
										Average Rating
									</Text>
									<View className='flex-row items-center justify-between'>
										<Text className='text-text-primary font-medium'>
											{typeof user?.coachDetails?.ratings === 'number'
												? `${user.coachDetails.ratings.toFixed(1)} / 5.0`
												: '0.0 / 5.0'}
										</Text>
										<TouchableOpacity
											onPress={() => {
												setShowRatingsModal(true);
												refetchRatings();
											}}
											className='flex-row items-center bg-[#F9C513]/20 px-3 py-2 rounded-lg border border-[#F9C513]/30'
										>
											<Ionicons name='star' size={16} color='#F9C513' />
											<Text className='text-[#F9C513] font-semibold ml-2'>
												View All Ratings
											</Text>
										</TouchableOpacity>
									</View>
								</View>
							</View>
						)}
					</>
				)}
			</ScrollView>

			{/* Ratings Modal */}
			<Modal
				visible={showRatingsModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => setShowRatingsModal(false)}
			>
				<View className='flex-1 bg-bg-darker px-5 py-8'>
					<View
						className='bg-bg-primary rounded-2xl p-6 flex-1 border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<View className='flex-row justify-between items-center mb-4 pb-4 border-b border-bg-darker/30'>
							<View className='flex-1'>
								<Text className='text-2xl font-bold text-text-primary'>
									My Ratings
								</Text>
								{ratingsData?.getCoachRatings && (
									<Text className='text-text-secondary text-sm mt-1'>
										{ratingsData.getCoachRatings.length} rating
										{ratingsData.getCoachRatings.length !== 1 ? 's' : ''} •{' '}
										{
											ratingsData.getCoachRatings.filter((r: any) => r.comment)
												.length
										}{' '}
										with comments
									</Text>
								)}
							</View>
							<TouchableOpacity
								onPress={() => setShowRatingsModal(false)}
								className='p-2'
							>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>

						<ScrollView className='flex-1' showsVerticalScrollIndicator={true}>
							{ratingsData?.getCoachRatings &&
							ratingsData.getCoachRatings.length > 0 ? (
								ratingsData.getCoachRatings.map((rating: any) => (
									<View
										key={rating.id}
										className='bg-bg-darker rounded-xl p-4 mb-3 border border-[#F9C513]'
										style={{ borderWidth: 0.5 }}
									>
										<View className='flex-row justify-between items-start mb-2'>
											<View className='flex-1'>
												{rating.client && (
													<Text className='text-text-primary font-semibold text-base mb-1'>
														{rating.client.firstName} {rating.client.lastName}
													</Text>
												)}
												<Text className='text-text-secondary text-xs'>
													{new Date(rating.createdAt).toLocaleDateString(
														'en-US',
														{
															year: 'numeric',
															month: 'long',
															day: 'numeric',
														}
													)}
												</Text>
											</View>
											<View className='flex-row items-center'>
												{Array.from({ length: 5 }).map((_, index) => (
													<Ionicons
														key={index}
														name={
															index < rating.rating ? 'star' : 'star-outline'
														}
														size={20}
														color='#F9C513'
													/>
												))}
											</View>
										</View>

										{rating.comment && (
											<View className='mt-3 pt-3 border-t border-[#F9C513]/20'>
												<Text className='text-text-secondary text-xs mb-1'>
													Comment:
												</Text>
												<Text className='text-text-primary text-sm'>
													{rating.comment}
												</Text>
											</View>
										)}
									</View>
								))
							) : (
								<View className='items-center justify-center py-12'>
									<Ionicons name='star-outline' size={48} color='#8E8E93' />
									<Text className='text-text-secondary mt-4 text-center text-base'>
										No ratings yet
									</Text>
									<Text className='text-text-secondary mt-2 text-center text-sm'>
										Your clients have not rated you yet
									</Text>
								</View>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
				confirmLabel="OK"
				onConfirm={() => setAlertModal((p) => ({ ...p, visible: false }))}
				onCancel={() => setAlertModal((p) => ({ ...p, visible: false }))}
				hideCancel
			/>
		</FixedView>
	);
};

export default CoachProfile;
