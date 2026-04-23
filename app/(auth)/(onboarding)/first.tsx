import DatePicker from '@/components/DatePicker';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import PhilippinePhoneInput from '@/components/PhilippinePhoneInput';
import Select from '@/components/Select';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
	getAgeYears,
	isBelowMinAppAge,
	isMinorAt,
	MIN_APP_AGE,
} from '@/utils/age-waiver';
import {
	isValidPhilippineMobileNational,
	nationalDigitsFromStoredPhone,
} from '@/utils/philippine-phone';
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

	const [phoneNumber, setPhoneNumber] = useState(() =>
		nationalDigitsFromStoredPhone(data.phoneNumber || '')
	);
	const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
		data.dateOfBirth
	);
	const [gender, setGender] = useState(data.gender || '');

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!phoneNumber.trim()) {
			newErrors.phoneNumber = 'Phone number is required';
		} else if (!isValidPhilippineMobileNational(phoneNumber)) {
			newErrors.phoneNumber =
				'Enter 10 digits after +63 (Philippine mobile, e.g. 9XX XXX XXXX — no leading 0)';
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
						minimumDate={MIN_DOB}
						maximumDate={new Date()}
						error={errors.dateOfBirth}
					/>

					{dateOfBirth && !errors.dateOfBirth && isMinorAt(dateOfBirth) ? (
						<View className='-mt-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3'>
							<Text className='text-red-400 text-xs font-semibold mb-1 uppercase tracking-wide'>
								Reminder
							</Text>
							<Text className='text-red-300 text-sm leading-5'>
								Members under 18 should ask the clerk for the printed waiver with parent or
								guardian signature.
							</Text>
						</View>
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
