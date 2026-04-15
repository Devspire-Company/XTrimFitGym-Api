import GradientButton from '@/components/GradientButton';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

type Props = {
	visible: boolean;
	onGotIt: () => void;
	/** Optional second action (e.g. onboarding “Back”). */
	onBack?: () => void;
};

/**
 * After a subscription request is submitted: remind member to complete payment at the front desk.
 * Matches onboarding step 3 “See you at the counter” flow.
 */
export function MembershipCounterReminderModal({
	visible,
	onGotIt,
	onBack,
}: Props) {
	return (
		<Modal
			visible={visible}
			animationType='fade'
			transparent
			onRequestClose={onGotIt}
		>
			<View style={styles.modalRoot}>
				<BlurView
					intensity={100}
					tint='dark'
					style={StyleSheet.absoluteFill}
				/>
				<View
					style={StyleSheet.absoluteFill}
					className='justify-center px-5 bg-black/95'
				>
					<View className='bg-bg-darker rounded-2xl border border-[#F9C513]/25 p-6 shadow-2xl'>
						<View className='items-center mb-6'>
							<View className='w-20 h-20 rounded-full bg-[#F9C513]/20 items-center justify-center border-2 border-[#F9C513]/40'>
								<Ionicons name='storefront' size={40} color='#F9C513' />
							</View>
						</View>
						<Text className='text-text-primary text-xl font-bold text-center mb-4'>
							See you at the counter
						</Text>
						<Text className='text-text-secondary text-base text-center leading-6 mb-8'>
							Your request is with the admin for approval. Head to the gym front
							desk with your payment. Staff will verify and activate your plan once
							approved.
						</Text>
						<View className='gap-3'>
							<GradientButton onPress={onGotIt}>Got it</GradientButton>
							{onBack ? (
								<GradientButton variant='secondary' onPress={onBack}>
									Back
								</GradientButton>
							) : null}
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalRoot: {
		flex: 1,
	},
});
