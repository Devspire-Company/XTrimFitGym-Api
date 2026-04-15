import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberMembershipModal } from '@/contexts/MemberMembershipModalContext';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ProfileDropdownProps {
	visible: boolean;
	onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
	visible,
	onClose,
}) => {
	const { user, logout } = useAuth();
	const router = useRouter();
	const { openMembershipRequired } = useMemberMembershipModal();
	const isMemberWithoutMembership =
		user?.role === 'member' && !memberHasActiveGymMembership(user);
	const [fadeAnim] = React.useState(new Animated.Value(0));
	const [scaleAnim] = React.useState(new Animated.Value(0.95));
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					useNativeDriver: true,
					tension: 50,
					friction: 7,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 0.95,
					duration: 150,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible]);

	const handleProfilePress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/profile');
		} else {
			router.push('/(member)/profile');
		}
	};

	const handleAttendancePress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/attendance');
		} else if (isMemberWithoutMembership) {
			openMembershipRequired();
		} else {
			router.push('/(member)/attendance');
		}
	};

	const handleCoachesPress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/clients');
		} else if (isMemberWithoutMembership) {
			openMembershipRequired();
		} else {
			router.push('/(member)/coaches');
		}
	};

	const handleSubscriptionPress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/subscription');
		} else {
			router.push('/(member)/subscription');
		}
	};

	const handleSessionLogsPress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/sessions');
		} else if (isMemberWithoutMembership) {
			openMembershipRequired();
		} else {
			router.push('/(member)/session-logs');
		}
	};

	const handleEquipmentPress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/equipment');
		} else {
			router.push('/(member)/equipment');
		}
	};

	const handleHelpPress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/help');
		} else {
			router.push('/(member)/help');
		}
	};

	const handleSettingsPress = () => {
		onClose();
		if (user?.role === 'coach') {
			router.push('/(coach)/profile');
		} else {
			router.push('/(member)/profile');
		}
	};

	const handleLogout = () => {
		onClose();
		setShowLogoutConfirm(true);
	};

	const confirmLogout = async () => {
		setShowLogoutConfirm(false);
		await logout();
		router.replace('/(auth)/login');
	};

	if (!visible && !showLogoutConfirm) return null;

	return (
		<>
			{visible && (
				<Modal
					visible={visible}
					transparent
					animationType='none'
					onRequestClose={onClose}
				>
					<TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
						<Animated.View
							style={[
								styles.dropdown,
								{
									opacity: fadeAnim,
									transform: [{ scale: scaleAnim }],
								},
							]}
						>
							<LinearGradient
								colors={['#111111', '#1C1C1E', '#12100A']}
								start={{ x: 0, y: 0 }}
								end={{ x: 0, y: 1 }}
								style={{ flex: 1 }}
							>
								<TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
								<View style={{ flex: 1, justifyContent: 'space-between' }}>
									<View>
										{/* User Info */}
										<View className='px-4 py-4 border-b border-bg-darker flex-row items-center'>
											<View className='bg-[#F9C513] rounded-full w-10 h-10 items-center justify-center mr-3'>
												<Text className='text-bg-darker font-bold text-sm'>
													{`${user?.firstName?.charAt(0) || ''}${
														user?.lastName?.charAt(0) || ''
													}`.toUpperCase()}
												</Text>
											</View>
											<View className='flex-1'>
												<Text className='text-text-primary font-semibold text-base'>
													{user?.firstName} {user?.lastName}
												</Text>
												<Text className='text-text-secondary text-xs mt-1'>
													{user?.email}
												</Text>
												{user?.role && (
													<View className='mt-2 self-start px-2 py-1 rounded-full bg-[#F9C513]/15 border border-[#F9C513]/30'>
														<Text className='text-[10px] font-semibold text-[#F9C513] tracking-wide uppercase'>
															{user.role === 'coach' ? 'Coach' : 'Member'}
														</Text>
													</View>
												)}
											</View>
										</View>

										{/* Profile Option */}
										<TouchableOpacity
											onPress={handleProfilePress}
											className='flex-row items-center px-4 py-3 border-b border-bg-darker'
										>
											<Ionicons name='person-outline' size={24} color='#F9C513' />
											<Text className='text-text-primary font-medium ml-3 text-base'>
												Profile
											</Text>
										</TouchableOpacity>

										{/* Coaches Option (members with membership only) */}
										{user?.role !== 'coach' && !isMemberWithoutMembership && (
											<TouchableOpacity
												onPress={handleCoachesPress}
												className='flex-row items-center px-4 py-3 border-b border-bg-darker'
											>
												<Ionicons name='people-outline' size={24} color='#F9C513' />
												<Text className='text-text-primary font-medium ml-3 text-base'>
													Coaches
												</Text>
											</TouchableOpacity>
										)}

										{/* Attendance Option (member: membership required) */}
										{user?.role !== 'member' || !isMemberWithoutMembership ? (
											<TouchableOpacity
												onPress={handleAttendancePress}
												className='flex-row items-center px-4 py-3 border-b border-bg-darker'
											>
												<Ionicons name='calendar-outline' size={24} color='#F9C513' />
												<Text className='text-text-primary font-medium ml-3 text-base'>
													Attendance
												</Text>
											</TouchableOpacity>
										) : null}

										{/* Session Logs / Sessions Option (member: membership required) */}
										{user?.role !== 'member' || !isMemberWithoutMembership ? (
											<TouchableOpacity
												onPress={handleSessionLogsPress}
												className='flex-row items-center px-4 py-3 border-b border-bg-darker'
											>
												<Ionicons name='time-outline' size={24} color='#F9C513' />
												<Text className='text-text-primary font-medium ml-3 text-base'>
													{user?.role === 'coach' ? 'Sessions' : 'Session Logs'}
												</Text>
											</TouchableOpacity>
										) : null}

										{/* Equipment Option */}
										<TouchableOpacity
											onPress={handleEquipmentPress}
											className='flex-row items-center px-4 py-3 border-b border-bg-darker'
										>
											<Ionicons name='barbell-outline' size={24} color='#F9C513' />
											<Text className='text-text-primary font-medium ml-3 text-base'>
												Equipment
											</Text>
										</TouchableOpacity>

										{/* Help Center (members only) */}
										{user?.role !== 'coach' && (
											<TouchableOpacity
												onPress={handleHelpPress}
												className='flex-row items-center px-4 py-3 border-b border-bg-darker'
											>
												<Ionicons
													name='help-circle-outline'
													size={24}
													color='#F9C513'
												/>
												<Text className='text-text-primary font-medium ml-3 text-base'>
													Help Center
												</Text>
											</TouchableOpacity>
										)}
									</View>

									{/* Logout Option */}
									<View className='border-t border-bg-darker px-4 py-4 mb-6 items-center'>
										<TouchableOpacity
											onPress={handleLogout}
											activeOpacity={0.8}
											className='flex-row items-center justify-center px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/40'
										>
											<Ionicons
												name='log-out-outline'
												size={22}
												color='#FF3B30'
											/>
											<Text className='text-red-500 font-semibold ml-2 text-sm'>
												Logout
											</Text>
										</TouchableOpacity>
									</View>
								</View>
								</TouchableOpacity>
							</LinearGradient>
						</Animated.View>
					</TouchableOpacity>
				</Modal>
			)}

			<ConfirmModal
				visible={showLogoutConfirm}
				title="Logout"
				message="Are you sure you want to logout?"
				variant="danger"
				confirmLabel="Logout"
				cancelLabel="Cancel"
				onConfirm={confirmLogout}
				onCancel={() => setShowLogoutConfirm(false)}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	dropdown: {
		height: '100%',
		width: '70%',
		backgroundColor: '#1C1C1E',
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		elevation: 8,
		overflow: 'hidden',
	},
});

export default ProfileDropdown;

