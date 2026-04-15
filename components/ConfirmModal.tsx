import GradientButton from '@/components/GradientButton';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
	Modal,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export type ConfirmVariant = 'danger' | 'warning' | 'neutral' | 'success';

interface ConfirmModalProps {
	visible: boolean;
	title: string;
	message: string;
	variant?: ConfirmVariant;
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	loading?: boolean;
	/** When true, only show confirm button (e.g. for success/info modals). */
	hideCancel?: boolean;
}

const iconMap = {
	danger: {
		name: 'trash-outline' as const,
		color: '#EF4444',
		bg: 'bg-red-500/20',
		border: 'border-red-500/40',
	},
	warning: {
		name: 'warning-outline' as const,
		color: '#F59E0B',
		bg: 'bg-amber-500/20',
		border: 'border-amber-500/40',
	},
	neutral: {
		name: 'help-circle-outline' as const,
		color: '#F9C513',
		bg: 'bg-[#F9C513]/20',
		border: 'border-[#F9C513]/40',
	},
	success: {
		name: 'checkmark-circle-outline' as const,
		color: '#22C55E',
		bg: 'bg-green-500/20',
		border: 'border-green-500/40',
	},
};

const confirmButtonMap = {
	danger: 'bg-red-500/20 border border-red-500/50 rounded-xl py-3 items-center justify-center flex-1',
	warning: 'bg-amber-500/20 border border-amber-500/50 rounded-xl py-3 items-center justify-center flex-1',
	neutral: 'flex-1',
	success: 'flex-1',
};

const confirmTextMap = {
	danger: 'text-red-400 font-semibold text-base',
	warning: 'text-amber-400 font-semibold text-base',
	neutral: 'text-base',
	success: 'text-green-400 font-semibold text-base',
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
	visible,
	title,
	message,
	variant = 'neutral',
	confirmLabel,
	cancelLabel = 'Cancel',
	onConfirm,
	onCancel,
	loading = false,
	hideCancel = false,
}) => {
	const icon = iconMap[variant];
	const isDangerOrWarning = variant === 'danger' || variant === 'warning';

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<TouchableOpacity
				activeOpacity={1}
				className="flex-1 bg-black/50 justify-center items-center px-6"
				onPress={onCancel}
			>
				<TouchableOpacity
					activeOpacity={1}
					className="rounded-2xl p-6 w-full max-w-sm border border-[#F9C513]/30"
					style={{
						backgroundColor: 'rgba(28, 28, 30, 0.98)',
						borderWidth: 1,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.4,
						shadowRadius: 12,
						elevation: 10,
					}}
					onPress={(e) => e.stopPropagation()}
				>
					<View className="items-center mb-4">
						<View className={`${icon.bg} rounded-full p-4 mb-3 border ${icon.border}`}>
							<Ionicons name={icon.name} size={32} color={icon.color} />
						</View>
						<Text className="text-text-primary font-bold text-xl text-center">
							{title}
						</Text>
						<Text className="text-text-secondary text-center mt-2 text-sm">
							{message}
						</Text>
					</View>
					<View className="flex-row gap-3">
						{!hideCancel && (
							<GradientButton
								variant="secondary"
								className="flex-1"
								onPress={onCancel}
								disabled={loading}
							>
								{cancelLabel}
							</GradientButton>
						)}
						{isDangerOrWarning ? (
							<TouchableOpacity
								activeOpacity={0.7}
								onPress={onConfirm}
								disabled={loading}
								className={confirmButtonMap[variant] + (hideCancel ? ' flex-1' : '')}
							>
								<Text className={confirmTextMap[variant]}>{confirmLabel}</Text>
							</TouchableOpacity>
						) : (
							<GradientButton
								className="flex-1"
								onPress={onConfirm}
								loading={loading}
								disabled={loading}
							>
								{confirmLabel}
							</GradientButton>
						)}
					</View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
};

export default ConfirmModal;
