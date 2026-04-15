import ConfirmModal from '@/components/ConfirmModal';
import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import FixedView from '@/components/FixedView';
import Input from '@/components/Input';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
	GetUsersQuery,
	GetUsersQueryVariables,
} from '@/graphql/generated/types';
import { formatTimeRangeTo12Hour } from '@/utils/time-utils';
import { REMOVE_CLIENT_MUTATION } from '@/graphql/mutations';
import { GET_USERS_QUERY, GET_USER_QUERY } from '@/graphql/queries';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/userSlice';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import {
	FlatList,
	Modal,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const CoachClients = () => {
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedClient, setSelectedClient] = useState<any>(null);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [clientToRemove, setClientToRemove] = useState<any>(null);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });

	const { data: clientsData, loading, refetch: refetchClients } = useQuery<
		GetUsersQuery,
		GetUsersQueryVariables
	>(GET_USERS_QUERY, {
		variables: { role: 'member' },
		fetchPolicy: 'cache-and-network',
		pollInterval: 10000, // Poll every 10 seconds (less aggressive to prevent glitching)
		notifyOnNetworkStatusChange: false, // Disable to reduce re-renders
	});

	// Lazy query to refetch current user to ensure we have latest data
	const [refetchCurrentUser] = useLazyQuery(GET_USER_QUERY, {
		fetchPolicy: 'network-only', // Always fetch fresh data
	});

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refetchClients();
		} finally {
			setRefreshing(false);
		}
	};

	// Filter clients to only show coach's current clients
	const allClients = useMemo(() => {
		if (!clientsData?.getUsers) {
			return [];
		}
		// Get coach's client IDs from coachDetails
		const coachClientIds = user?.coachDetails?.clientsIds || [];
		if (!coachClientIds || coachClientIds.length === 0) {
			return [];
		}
		
		// Normalize coach client IDs to strings for comparison (handle null values)
		const normalizedCoachClientIds = coachClientIds
			.filter((id: any) => id != null)
			.map((id: any) => String(id));
		
		if (normalizedCoachClientIds.length === 0) {
			return [];
		}
		
		// Filter to only show clients that are in the coach's clientsIds array
		return clientsData.getUsers.filter((client: any) => {
			if (!client || !client.id) return false;
			// Normalize client ID to string and check if it's in the coach's clientsIds array
			const normalizedClientId = String(client.id);
			return normalizedCoachClientIds.includes(normalizedClientId);
		});
	}, [clientsData, user?.coachDetails?.clientsIds]);

	// Filter clients by search query
	const filteredClients = useMemo(() => {
		if (!searchQuery.trim()) return allClients;
		const query = searchQuery.toLowerCase();
		return allClients.filter(
			(client: any) =>
				client.firstName.toLowerCase().includes(query) ||
				client.lastName.toLowerCase().includes(query) ||
				client.email.toLowerCase().includes(query)
		);
	}, [allClients, searchQuery]);

	const [removeClientMutation] = useMutation(REMOVE_CLIENT_MUTATION, {
		onCompleted: async () => {
			// Refetch clients and user data
			try {
				await Promise.all([
					refetchClients(),
					user?.id
						? refetchCurrentUser({
								variables: { id: user.id },
						  }).then((result) => {
								const userData = (result.data as any)?.getUser;
								if (userData) {
									dispatch(updateUser(userData));
								}
						  })
						: Promise.resolve(),
				]);
			} catch (error) {
				console.error('Error refetching after removal:', error);
			}
			setShowProfileModal(false);
			setSelectedClient(null);
			setAlertModal({
				visible: true,
				title: 'Success',
				message: 'Client removed successfully',
				variant: 'success',
			});
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const handleClientPress = (client: any) => {
		setSelectedClient(client);
		setShowProfileModal(true);
	};

	const handleRemoveClient = (client: any) => {
		setClientToRemove(client);
	};

	const confirmRemoveClient = () => {
		if (!clientToRemove) return;
		removeClientMutation({
			variables: { clientId: clientToRemove.id },
		});
		setClientToRemove(null);
		setShowProfileModal(false);
		setSelectedClient(null);
	};

	const renderClientCard = ({ item }: { item: any }) => (
		<TouchableOpacity
			onPress={() => handleClientPress(item)}
			className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]/20'
		>
			<View className='flex-row'>
				<View className='bg-[#F9C513] rounded-full w-16 h-16 items-center justify-center mr-4 border-2 border-bg-darker/30'>
					<Text className='text-bg-darker font-bold text-xl'>
						{item.firstName.charAt(0)}
						{item.lastName.charAt(0)}
					</Text>
				</View>
				<View className='flex-1'>
					<View className='flex-row items-center justify-between mb-1'>
						<Text className='text-text-primary font-semibold text-lg'>
							{item.firstName} {item.lastName}
						</Text>
					</View>
					<View className='flex-row items-center mb-2'>
						<Ionicons name='mail' size={14} color='#8E8E93' />
						<Text
							className='text-text-secondary text-sm ml-1'
							numberOfLines={1}
						>
							{item.email}
						</Text>
					</View>
					{item.membershipDetails?.fitnessGoal &&
						item.membershipDetails.fitnessGoal.length > 0 && (
							<View className='flex-row flex-wrap mt-1'>
								{item.membershipDetails.fitnessGoal
									.slice(0, 2)
									.map((goal: string, index: number) => (
										<View
											key={index}
											className='bg-bg-darker px-2 py-1 rounded mr-2 mb-1 border border-[#F9C513]/30'
										>
											<Text className='text-text-secondary text-xs'>
												{goal}
											</Text>
										</View>
									))}
							</View>
						)}
				</View>
			</View>
		</TouchableOpacity>
	);

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<TabHeader showCoachIcon={false} />
			<ScrollView
				className='flex-1'
				contentContainerClassName='p-5'
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='#F9C513' />
				}
			>
				<View className='flex-row items-center justify-between mb-6'>
					<View>
						<Text className='text-3xl font-bold text-text-primary'>
							My Clients
						</Text>
						<Text className='text-text-secondary mt-1'>
							Manage your client relationships
						</Text>
					</View>
				</View>

				{/* Search Bar */}
				<View className='mb-6'>
					<Input
						placeholder='Search clients by name or email...'
						value={searchQuery}
						onChangeText={setSearchQuery}
						className='bg-bg-primary border border-[#F9C513]/20'
					/>
				</View>

				{/* Client Stats */}
				<View className='flex-row gap-3 mb-6'>
					<View className='flex-1 bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20'>
						<View className='flex-row items-center mb-2'>
							<Ionicons name='people' size={18} color='#F9C513' />
							<Text className='text-text-secondary text-xs ml-2'>Total</Text>
						</View>
						<Text className='text-3xl font-bold text-[#F9C513]'>
							{allClients.length}
						</Text>
					</View>
					<View className='flex-1 bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20'>
						<View className='flex-row items-center mb-2'>
							<Ionicons name='search' size={18} color='#F9C513' />
							<Text className='text-text-secondary text-xs ml-2'>Showing</Text>
						</View>
						<Text className='text-3xl font-bold text-[#F9C513]'>
							{filteredClients.length}
						</Text>
					</View>
				</View>

				{loading ? (
					<View className='bg-bg-primary rounded-xl border border-[#F9C513]/20 overflow-hidden'>
						<PremiumLoadingContent embedded message='Please wait..' />
					</View>
				) : filteredClients.length === 0 ? (
					<View className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]/20'>
						<Ionicons name='people-outline' size={48} color='#8E8E93' />
						<Text className='text-text-secondary mt-4 text-center'>
							{allClients.length === 0
								? 'No clients yet. Accept coach requests to see your clients here.'
								: 'No clients found matching your search'}
						</Text>
						{user?.coachDetails?.clientsIds && user.coachDetails.clientsIds.length > 0 && (
							<Text className='text-text-secondary text-xs mt-2 text-center'>
								You have {user.coachDetails.clientsIds.length} client ID
								{user.coachDetails.clientsIds.length !== 1 ? 's' : ''} in your profile
							</Text>
						)}
					</View>
				) : (
					<FlatList
						data={filteredClients}
						keyExtractor={(item) => item?.id || ''}
						renderItem={renderClientCard}
						scrollEnabled={false}
					/>
				)}
			</ScrollView>

			{/* Client Profile Modal */}
			<Modal
				visible={showProfileModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => {
					setShowProfileModal(false);
					setSelectedClient(null);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View className='bg-bg-primary rounded-t-3xl p-6 max-h-[90%] border-t-2 border-[#F9C513]/30'>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6 pb-4 border-b border-bg-darker/30'>
								<Text className='text-2xl font-bold text-text-primary'>
									Client Profile
								</Text>
								<TouchableOpacity
									onPress={() => {
										setShowProfileModal(false);
										setSelectedClient(null);
									}}
									className='p-2 rounded-full border border-bg-darker/30'
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{selectedClient && (
								<>
									<View className='items-center mb-6 pb-6 border-b border-bg-darker/30'>
										<View className='bg-[#F9C513] rounded-full w-24 h-24 items-center justify-center mb-4 border-2 border-bg-darker/30'>
											<Text className='text-bg-darker font-bold text-3xl'>
												{selectedClient.firstName.charAt(0)}
												{selectedClient.lastName.charAt(0)}
											</Text>
										</View>
										<Text className='text-2xl font-bold text-text-primary mb-1'>
											{selectedClient.firstName} {selectedClient.lastName}
										</Text>
										<View className='flex-row items-center mt-2'>
											<Ionicons name='mail' size={16} color='#8E8E93' />
											<Text className='text-text-secondary ml-1'>
												{selectedClient.email}
											</Text>
										</View>
									</View>

									{selectedClient.phoneNumber && (
										<View className='mb-6 pb-6 border-b border-bg-darker/30'>
											<Text className='text-text-primary font-semibold mb-2 text-lg'>
												Contact
											</Text>
											<View className='flex-row items-center'>
												<Ionicons name='call' size={16} color='#8E8E93' />
												<Text className='text-text-secondary ml-2'>
													{selectedClient.phoneNumber}
												</Text>
											</View>
										</View>
									)}

									{selectedClient.membershipDetails?.physiqueGoalType && (
										<View className='mb-6 pb-6 border-b border-bg-darker/30'>
											<Text className='text-text-primary font-semibold mb-2 text-lg'>
												Physique Goal
											</Text>
											<View className='bg-bg-darker px-3 py-2 rounded-lg border border-[#F9C513]/30'>
												<Text className='text-text-primary'>
													{selectedClient.membershipDetails.physiqueGoalType}
												</Text>
											</View>
										</View>
									)}

									{selectedClient.membershipDetails?.fitnessGoal &&
										selectedClient.membershipDetails.fitnessGoal.length > 0 && (
											<View className='mb-6 pb-6 border-b border-bg-darker/30'>
												<Text className='text-text-primary font-semibold mb-3 text-lg'>
													Fitness Goals
												</Text>
												<View className='flex-row flex-wrap'>
													{selectedClient.membershipDetails.fitnessGoal.map(
														(goal: string, index: number) => (
															<View
																key={index}
																className='bg-bg-darker px-3 py-2 rounded-lg mr-2 mb-2 border border-[#F9C513]/30'
															>
																<Text className='text-text-primary'>
																	{goal}
																</Text>
															</View>
														)
													)}
												</View>
											</View>
										)}

									{selectedClient.membershipDetails?.workOutTime &&
										selectedClient.membershipDetails.workOutTime.length > 0 && (
											<View className='mb-6 pb-6 border-b border-bg-darker/30'>
												<Text className='text-text-primary font-semibold mb-2 text-lg'>
													Preferred Workout Time
												</Text>
												<View className='bg-bg-darker px-3 py-2 rounded-lg border border-[#F9C513]/30'>
													<Text className='text-text-primary'>
														{formatTimeRangeTo12Hour(
															selectedClient.membershipDetails.workOutTime[0] as string
														)}
													</Text>
												</View>
											</View>
										)}

									<View className='mt-4 gap-3'>
										<TouchableOpacity
											onPress={() => handleRemoveClient(selectedClient)}
											className='bg-red-500/20 rounded-xl p-4 items-center border-2 border-red-500/40'
										>
											<View className='flex-row items-center'>
												<Ionicons
													name='person-remove-outline'
													size={20}
													color='#FF3B30'
												/>
												<Text className='text-red-500 font-semibold text-lg ml-2'>
													Remove Client
												</Text>
											</View>
										</TouchableOpacity>
									</View>
								</>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			<ConfirmModal
				visible={!!clientToRemove}
				title="Remove Client"
				message={
					clientToRemove
						? `Are you sure you want to remove ${clientToRemove.firstName} ${clientToRemove.lastName} from your clients? They will be notified.`
						: ''
				}
				variant="danger"
				confirmLabel="Remove"
				cancelLabel="Cancel"
				onConfirm={confirmRemoveClient}
				onCancel={() => setClientToRemove(null)}
			/>
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

export default CoachClients;
