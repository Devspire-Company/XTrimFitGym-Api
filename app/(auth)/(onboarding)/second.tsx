import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import TimePicker from '@/components/TimePicker';
import {
	bodyTypeOptions,
	fitnessGoalOptions,
	workoutTimePresets,
} from '@/constants/onboarding-options';
import { getGymMinutesBoundsNoReferenceDate } from '@/constants/gym-hours';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { minutesOfDayFromDate } from '@/utils/time-utils';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const gymDayBounds = getGymMinutesBoundsNoReferenceDate();

const Second = () => {
	const router = useRouter();
	const { data, updateData } = useOnboarding();

	const [fitnessGoal, setFitnessGoal] = useState<string[]>(
		data.fitnessGoal || [],
	);
	const [physiqueGoalType, setPhysiqueGoalType] = useState(
		data.physiqueGoalType || '',
	);

	const parseWorkoutTime = (timeStr?: string[]) => {
		if (!timeStr || timeStr.length === 0)
			return { start: undefined, end: undefined, presetId: '' };
		const timeRange = timeStr[0];
		if (timeRange?.includes('-')) {
			const parts = timeRange.split('-');
			const startHour = parseInt(parts[0] ?? '', 10);
			const endHour = parseInt(parts[1] ?? '', 10);
			if (Number.isNaN(startHour) || Number.isNaN(endHour))
				return { start: undefined, end: undefined, presetId: '' };
			const preset = workoutTimePresets.find((p) => p.value === timeRange);
			const startDate = new Date();
			startDate.setHours(startHour, 0, 0, 0);
			const endDate = new Date();
			endDate.setHours(endHour, 0, 0, 0);
			return {
				start: startDate,
				end: endDate,
				presetId: preset ? preset.id : 'custom',
			};
		}
		return { start: undefined, end: undefined, presetId: '' };
	};

	const initial = parseWorkoutTime(data.workOutTime);
	const [selectedTimePresetId, setSelectedTimePresetId] = useState(
		initial.presetId || '',
	);
	const [workOutTimeStart, setWorkOutTimeStart] = useState<Date | undefined>(
		initial.start,
	);
	const [workOutTimeEnd, setWorkOutTimeEnd] = useState<Date | undefined>(
		initial.end,
	);

	const [errors, setErrors] = useState<Record<string, string>>({});

	const toggleFitnessGoal = (value: string) => {
		setFitnessGoal((prev) =>
			prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value],
		);
		setErrors((e) => ({ ...e, fitnessGoal: '' }));
	};

	const selectTimePreset = (presetId: string) => {
		setSelectedTimePresetId(presetId);
		setErrors((e) => ({ ...e, workOutTime: '' }));
		if (presetId === 'custom') return;
		const preset = workoutTimePresets.find((p) => p.id === presetId);
		if (preset?.value) {
			const [s, e] = preset.value.split('-').map(Number);
			const start = new Date();
			start.setHours(s, 0, 0, 0);
			const end = new Date();
			end.setHours(e, 0, 0, 0);
			setWorkOutTimeStart(start);
			setWorkOutTimeEnd(end);
		}
	};

	const getWorkOutTimeForSubmit = (): string[] | null => {
		if (selectedTimePresetId === 'custom') {
			if (!workOutTimeStart || !workOutTimeEnd) return null;
			const startM = minutesOfDayFromDate(workOutTimeStart);
			const endM = minutesOfDayFromDate(workOutTimeEnd);
			if (startM >= endM) return null;
			if (startM < gymDayBounds.min || endM > gymDayBounds.max) return null;
			return [
				`${workOutTimeStart.getHours()}-${workOutTimeEnd.getHours()}`,
			];
		}
		const preset = workoutTimePresets.find((p) => p.id === selectedTimePresetId);
		return preset?.value ? [preset.value] : null;
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (fitnessGoal.length === 0)
			newErrors.fitnessGoal = 'Please select at least one fitness goal';
		if (!physiqueGoalType)
			newErrors.physiqueGoalType = 'Please select your body type';
		const timeRange = getWorkOutTimeForSubmit();
		if (!timeRange) {
			if (selectedTimePresetId === 'custom' && workOutTimeStart && workOutTimeEnd) {
				const startM = minutesOfDayFromDate(workOutTimeStart);
				const endM = minutesOfDayFromDate(workOutTimeEnd);
				if (startM >= endM)
					newErrors.workOutTime = 'End time must be after start time';
				else if (startM < gymDayBounds.min || endM > gymDayBounds.max)
					newErrors.workOutTime =
						'Times must be within gym hours (10 AM – 10 PM; Fri opens 2 PM)';
			} else newErrors.workOutTime = 'Please select a preferred workout time';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleContinue = () => {
		if (!validateForm()) return;
		const timeRange = getWorkOutTimeForSubmit();
		if (!timeRange) return;
		updateData({
			fitnessGoal,
			physiqueGoalType,
			workOutTime: timeRange,
		});
		router.push('/(auth)/(onboarding)/third');
	};

	const endMinMinutes = workOutTimeStart
		? Math.min(
				gymDayBounds.max,
				minutesOfDayFromDate(workOutTimeStart) + 15,
			)
		: gymDayBounds.min;

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
					<Text className='text-text-secondary text-sm mb-4'>Step 2 of 4</Text>
					<Text className='text-3xl font-bold mb-2 text-text-primary'>
						Fitness Goals
					</Text>
					<Text className='text-base text-text-secondary mb-8'>
						Tell us about your fitness objectives
					</Text>

					{/* ── Section 1: Fitness Goals ── */}
					<View className='mb-6'>
						<Text className='text-text-primary text-lg font-semibold mb-2'>
							Fitness Goals
						</Text>
						<Text className='text-text-secondary text-sm mb-4'>
							Select all that apply — we&apos;ll match you with coaches
						</Text>
						<View className='gap-3'>
							{fitnessGoalOptions.map((option) => {
								const active = fitnessGoal.includes(option.value);
								return (
									<TouchableOpacity
										key={option.value}
										onPress={() => toggleFitnessGoal(option.value)}
										activeOpacity={0.7}
										className={`border rounded-lg p-4 ${
											active
												? 'border-[#F9C513] bg-[rgba(249,197,19,0.06)]'
												: 'border-input bg-input'
										}`}
									>
										<Text
											className={`text-base ${
												active
													? 'text-[#F9C513] font-semibold'
													: 'text-text-primary'
											}`}
										>
											{option.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
						{errors.fitnessGoal ? (
							<Text className='text-red-500 text-sm mt-2'>
								{errors.fitnessGoal}
							</Text>
						) : null}
					</View>

					{/* ── Section 2: Body Type ── */}
					<View className='mb-6 mt-10'>
						<Text className='text-text-primary text-lg font-semibold mb-2'>
							Body Type
						</Text>
						<Text className='text-text-secondary text-sm mb-4'>
							Helps us tailor recommendations to your profile.
						</Text>
						<View className='gap-3'>
							{bodyTypeOptions.map((option) => {
								const active = physiqueGoalType === option.value;
								return (
									<TouchableOpacity
										key={option.value}
										onPress={() => {
											setPhysiqueGoalType(option.value);
											setErrors((e) => ({ ...e, physiqueGoalType: '' }));
										}}
										activeOpacity={0.7}
										className={`border rounded-lg p-4 ${
											active
												? 'border-[#F9C513] bg-[rgba(249,197,19,0.06)]'
												: 'border-input bg-input'
										}`}
									>
										<Text
											className={`text-base ${
												active
													? 'text-[#F9C513] font-semibold'
													: 'text-text-primary'
											}`}
										>
											{option.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
						{errors.physiqueGoalType ? (
							<Text className='text-red-500 text-sm mt-2'>
								{errors.physiqueGoalType}
							</Text>
						) : null}
					</View>

					{/* ── Section 3: Preferred Workout Time ── */}
					<View className='mb-6 mt-10'>
						<Text className='text-text-primary text-lg font-semibold mb-2'>
							Preferred Workout Time
						</Text>
						<Text className='text-text-secondary text-sm mb-4'>
							Mon–Thu &amp; Sat–Sun: 10 AM – 10 PM · Fri: 2 PM – 10 PM
						</Text>
						<View className='gap-3'>
							{workoutTimePresets.map((preset) => {
								const active = selectedTimePresetId === preset.id;
								return (
									<TouchableOpacity
										key={preset.id}
										onPress={() => selectTimePreset(preset.id)}
										activeOpacity={0.7}
										className={`border rounded-lg p-4 ${
											active
												? 'border-[#F9C513] bg-[rgba(249,197,19,0.06)]'
												: 'border-input bg-input'
										}`}
									>
										<Text
											className={`text-base ${
												active
													? 'text-[#F9C513] font-semibold'
													: 'text-text-primary'
											}`}
										>
											{preset.label}
										</Text>
										{preset.hint ? (
											<Text className='text-text-secondary text-sm mt-1'>
												{preset.hint}
											</Text>
										) : null}
									</TouchableOpacity>
								);
							})}
						</View>

						{selectedTimePresetId === 'custom' && (
							<View className='mt-4 gap-3'>
								<View className='flex-row gap-3'>
									<View className='flex-1'>
										<TimePicker
											label='Start Time'
											value={workOutTimeStart}
											onChange={(d) => {
												setWorkOutTimeStart(d);
												setErrors((e) => ({ ...e, workOutTime: '' }));
												setWorkOutTimeEnd((prev) => {
													if (!prev) return prev;
													if (minutesOfDayFromDate(prev) <= minutesOfDayFromDate(d))
														return undefined;
													return prev;
												});
											}}
											placeholder='Start'
											containerClassName='mb-0'
											modalTitle='Start time'
											minMinutes={gymDayBounds.min}
											maxMinutes={gymDayBounds.max - 15}
										/>
									</View>
									<View className='flex-1'>
										<TimePicker
											label='End Time'
											value={workOutTimeEnd}
											onChange={(d) => {
												setWorkOutTimeEnd(d);
												setErrors((e) => ({ ...e, workOutTime: '' }));
											}}
											placeholder='End'
											containerClassName='mb-0'
											modalTitle='End time'
											minMinutes={endMinMinutes}
											maxMinutes={gymDayBounds.max}
										/>
									</View>
								</View>
								<Text className='text-text-secondary text-sm'>
									Friday opens at 2 PM — pick a range that fits your schedule.
								</Text>
							</View>
						)}

						{errors.workOutTime ? (
							<Text className='text-red-500 text-sm mt-2'>
								{errors.workOutTime}
							</Text>
						) : null}
					</View>

					{/* ── Buttons ── */}
					<View className='flex-row gap-3 mt-6'>
						<GradientButton
							onPress={() => router.back()}
							className='flex-1'
							variant='secondary'
						>
							Back
						</GradientButton>
						<GradientButton onPress={handleContinue} className='flex-1'>
							Continue
						</GradientButton>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</FixedView>
	);
};

export default Second;
