import GradientButton from '@/components/GradientButton';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

const POST_ONBOARDING_WELCOME_MESSAGE =
	"Your account is ready. You can now use the app and explore your available member features.";
const FREE_ACCESS_WELCOME_MESSAGE =
	'Welcome to Free Access! You can use Workouts anytime. Upgrade to a gym membership whenever you are ready to unlock dashboard, schedule, progress, coaches, attendance, and session logs.';

type Props = {
	visible: boolean;
	onDismiss: () => void;
	kind?: 'active' | 'counter' | 'limited';
};

export function PostOnboardingWelcomeModal({ visible, onDismiss, kind }: Props) {
	const isFreeAccessWelcome = kind === 'limited';
	const modalTitle = isFreeAccessWelcome ? 'Welcome to Free Access!' : 'Welcome aboard!';
	const welcomeMessage = isFreeAccessWelcome
		? FREE_ACCESS_WELCOME_MESSAGE
		: POST_ONBOARDING_WELCOME_MESSAGE;

	return (
		<Modal
			visible={visible}
			animationType='fade'
			transparent
			onRequestClose={onDismiss}
		>
			<View style={styles.welcomeModalRoot}>
				<BlurView intensity={28} tint='default' style={StyleSheet.absoluteFill} />
				<View
					style={StyleSheet.absoluteFill}
					className='justify-center px-5 bg-black/15'
				>
					<View className='bg-bg-darker rounded-2xl border border-[#F9C513]/25 p-6 shadow-2xl'>
						<View className='items-center mb-5'>
							<View className='w-[72px] h-[72px] rounded-full bg-[#34C759] items-center justify-center'>
								<Ionicons name='checkmark' size={42} color='#ffffff' />
							</View>
						</View>
						<Text className='text-text-primary text-2xl font-bold text-center mb-4'>
							{modalTitle}
						</Text>
						<Text className='text-text-secondary text-base text-center leading-6 mb-8'>
							{welcomeMessage}
						</Text>
						<GradientButton onPress={onDismiss}>Let&apos;s go</GradientButton>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	welcomeModalRoot: {
		flex: 1,
	},
});
