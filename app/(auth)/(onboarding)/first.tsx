import DatePicker from '@/components/DatePicker';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
	getAgeYears,
	isBelowMinAppAge,
	isMinorAt,
	MIN_APP_AGE,
} from '@/utils/age-waiver';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from 'react-native';

const genderOptions = [
	{ label: 'Male', value: 'Male' },
	{ label: 'Female', value: 'Female' },
	{ label: 'Prefer not to say', value: 'Prefer not to say' },
];

const MIN_DOB = new Date(1900, 0, 1);

const First = () => {
	const router = useRouter();
	const { data, updateData } = useOnboarding();

	const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || '');
	const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
		data.dateOfBirth
	);
	const [gender, setGender] = useState(data.gender || '');

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		const digitsOnly = phoneNumber.replace(/\D/g, '');
		if (!digitsOnly) {
			newErrors.phoneNumber = 'Phone number is required';
		} else if (!/^\d{11}$/.test(digitsOnly)) {
			newErrors.phoneNumber = 'Enter an 11-digit mobile number';
		}

		if (!dateOfBirth) {
			newErrors.dateOfBirth = 'Date of birth is required';
		} else if (isBelowMinAppAge(dateOfBirth)) {
			newErrors.dateOfBirth = `You must be at least ${MIN_APP_AGE} years old to register`;
		} else if (Number.isNaN(getAgeYears(dateOfBirth))) {
			newErrors.dateOfBirth = 'Invalid date of birth';
		}

		if (!gender) {
			newErrors.gender = 'Gender is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleContinue = () => {
		if (validateForm()) {
			updateData({
				phoneNumber: phoneNumber.trim(),
				dateOfBirth,
				gender,
			});
			router.push('/(auth)/(onboarding)/second');
		}
	};

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className='flex-1'
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
			>
				<ScrollView
					contentContainerClassName='flex-grow px-5 py-8'
					keyboardShouldPersistTaps='handled'
					showsVerticalScrollIndicator={false}
				>
				<Text className='text-text-secondary text-sm mb-4'>Step 1 of 4</Text>
				<Text className='text-3xl font-bold mb-2 text-text-primary'>
					Personal Information
				</Text>
				<Text className='text-base text-text-secondary mb-8'>
					Let&apos;s start with some basic information about you
				</Text>

				<View className='gap-4'>
					<Input
						label='Phone Number'
						placeholder='Enter your phone number'
						value={phoneNumber}
						onChangeText={(text) => {
							const digits = text.replace(/\D/g, '').slice(0, 11);
							setPhoneNumber(digits);
							setErrors({ ...errors, phoneNumber: '' });
						}}
						keyboardType='phone-pad'
						maxLength={11}
						error={errors.phoneNumber}
					/>

					<DatePicker
						label='Date of Birth'
						value={dateOfBirth}
						onChange={(date) => {
							setDateOfBirth(date);
							setErrors({ ...errors, dateOfBirth: '' });
						}}
						minimumDate={MIN_DOB}
						maximumDate={new Date()}
						error={errors.dateOfBirth}
					/>

					{dateOfBirth && !errors.dateOfBirth && isMinorAt(dateOfBirth) ? (
						<Text className='text-text-secondary text-sm -mt-2'>
							Members under 18 need a parent or guardian to sign the liability waiver in the
							final onboarding step.
						</Text>
					) : null}

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

					<View className='flex-row gap-3 mt-4'>
						{/* <GradientButton
							onPress={() => router.back()}
							className='flex-1'
							variant='secondary'
						>
							Back
						</GradientButton> */}
						<GradientButton onPress={handleContinue} className='flex-1'>
							Continue
						</GradientButton>
					</View>
				</View>
			</ScrollView>
			</KeyboardAvoidingView>
		</FixedView>
	);
};

export default First;
