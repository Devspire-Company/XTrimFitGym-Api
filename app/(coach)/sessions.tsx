import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import TabHeader from '@/components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

const CoachSessions = () => {
	const router = useRouter();

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<TabHeader showCoachIcon={false} />
			<View className='flex-1 p-5'>
				<View className='mb-6'>
					<Text className='text-3xl font-bold text-text-primary'>Sessions</Text>
					<Text className='text-text-secondary mt-1 text-sm'>
						Quick access to your scheduled and completed sessions.
					</Text>
				</View>

				<View className='gap-4'>
					<TouchableOpacity
						onPress={() => router.push('/(coach)/schedule')}
						activeOpacity={0.9}
						className='bg-bg-primary rounded-2xl p-4 border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<View className='flex-row items-center justify-between'>
							<View className='flex-row items-center flex-1'>
								<View className='w-10 h-10 rounded-full bg-[#F9C513]/15 items-center justify-center mr-3'>
									<Ionicons name='calendar-outline' size={22} color='#F9C513' />
								</View>
								<View className='flex-1'>
									<Text className='text-text-primary font-semibold text-base'>
										Scheduled Sessions
									</Text>
									<Text className='text-text-secondary text-xs mt-1'>
										View and manage upcoming workouts with your clients.
									</Text>
								</View>
							</View>
							<Ionicons name='chevron-forward' size={20} color='#8E8E93' />
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.push('/(coach)/completed-sessions')}
						activeOpacity={0.9}
						className='bg-bg-primary rounded-2xl p-4 border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<View className='flex-row items-center justify-between'>
							<View className='flex-row items-center flex-1'>
								<View className='w-10 h-10 rounded-full bg-[#22C55E]/15 items-center justify-center mr-3'>
									<Ionicons name='checkmark-done-outline' size={22} color='#22C55E' />
								</View>
								<View className='flex-1'>
									<Text className='text-text-primary font-semibold text-base'>
										Completed Sessions
									</Text>
									<Text className='text-text-secondary text-xs mt-1'>
										Review logs, photos, and progress from finished sessions.
									</Text>
								</View>
							</View>
							<Ionicons name='chevron-forward' size={20} color='#8E8E93' />
						</View>
					</TouchableOpacity>
				</View>

				<View className='mt-8'>
					<GradientButton onPress={() => router.push('/(coach)/schedule')}>
						Go to Schedule
					</GradientButton>
				</View>
			</View>
		</FixedView>
	);
};

export default CoachSessions;

