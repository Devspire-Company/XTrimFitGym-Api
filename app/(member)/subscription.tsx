import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import { MembershipCounterReminderModal } from '@/components/MembershipCounterReminderModal';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import type {
	GetCurrentMembershipQuery,
	GetMembershipsQuery,
} from '@/graphql/generated/types';
import {
	CANCEL_MEMBERSHIP_MUTATION,
	CREATE_SUBSCRIPTION_REQUEST_MUTATION,
} from '@/graphql/mutations';
import {
	GET_CURRENT_MEMBERSHIP_QUERY,
	GET_MEMBERSHIPS_QUERY,
	GET_MY_SUBSCRIPTION_REQUESTS_QUERY,
} from '@/graphql/queries';
import { minorNeedsGuardianWaiver } from '@/utils/age-waiver';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Modal,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const MemberSubscription = () => {
	const { user } = useAuth();
	const router = useRouter();
	const needsGuardianWaiverOnFile = useMemo(
		() =>
			minorNeedsGuardianWaiver(
				user?.dateOfBirth ?? null,
				user?.agreedToLiabilityWaiver
			),
		[user?.dateOfBirth, user?.agreedToLiabilityWaiver]
	);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedMembership, setSelectedMembership] = useState<any>(null);
	const [showPurchaseModal, setShowPurchaseModal] = useState(false);
	const [showRefundInfoModal, setShowRefundInfoModal] = useState(false);
	const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
	const [showCounterReminder, setShowCounterReminder] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });

	const {
		data: membershipsData,
		loading: membershipsLoading,
		refetch: refetchMemberships,
	} = useQuery<GetMembershipsQuery>(GET_MEMBERSHIPS_QUERY, {
		variables: { status: 'ACTIVE' },
		fetchPolicy: 'cache-and-network',
	});

	const {
		data: currentMembershipData,
		loading: currentLoading,
		refetch: refetchCurrent,
	} = useQuery<GetCurrentMembershipQuery>(GET_CURRENT_MEMBERSHIP_QUERY, {
		fetchPolicy: 'cache-and-network',
	});

	const {
		data: requestsData,
		loading: requestsLoading,
		refetch: refetchRequests,
	} = useQuery(GET_MY_SUBSCRIPTION_REQUESTS_QUERY, {
		fetchPolicy: 'cache-and-network',
		pollInterval: 5000,
	});

	const [createSubscriptionRequest, { loading: requesting }] = useMutation(
		CREATE_SUBSCRIPTION_REQUEST_MUTATION,
		{
			onCompleted: () => {
				setShowPurchaseModal(false);
				setSelectedMembership(null);
				refetchRequests();
				refetchCurrent();
				setShowCounterReminder(true);
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const [cancelMembership, { loading: canceling }] = useMutation(
		CANCEL_MEMBERSHIP_MUTATION,
		{
			onCompleted: () => {
				refetchCurrent();
				refetchMemberships();
				setAlertModal({
					visible: true,
					title: 'Success',
					message: 'Membership subscription canceled successfully',
					variant: 'success',
				});
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const rawMemberships = membershipsData?.getMemberships || [];
	const memberships = [...rawMemberships].sort((a: any, b: any) => {
		const aPopular = a.name?.toUpperCase().includes('PROMO') ? 1 : 0;
		const bPopular = b.name?.toUpperCase().includes('PROMO') ? 1 : 0;
		return bPopular - aPopular;
	});
	const currentSubscription = currentMembershipData?.getCurrentMembership;
	const subscriptionRequests = requestsData?.getMySubscriptionRequests || [];

	const getPendingRequest = (membershipId: string) => {
		return subscriptionRequests.find(
			(req: any) =>
				req.membershipId === membershipId &&
				req.status === 'PENDING'
		);
	};


	const calculateDaysRemaining = (expiresAt: string) => {
		const expiry = new Date(expiresAt);
		const today = new Date();
		const diffTime = expiry.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays > 0 ? diffDays : 0;
	};

	const handlePurchase = (membership: any) => {
		setSelectedMembership(membership);
		setShowPurchaseModal(true);
	};

	const confirmRequest = () => {
		if (!selectedMembership) return;

		if (
			user &&
			minorNeedsGuardianWaiver(
				user.dateOfBirth ?? null,
				user.agreedToLiabilityWaiver
			)
		) {
			setAlertModal({
				visible: true,
				title: 'Parent / guardian waiver required',
				message:
					'Members under 18 need a parent or legal guardian liability waiver on file before requesting a membership. Complete it in your Profile.',
				variant: 'danger',
			});
			return;
		}

		createSubscriptionRequest({
			variables: {
				input: {
					membershipId: selectedMembership.id,
				},
			},
		});
	};

	useEffect(() => {
		refetchMemberships();
		refetchCurrent();
		refetchRequests();
	}, [refetchMemberships, refetchCurrent, refetchRequests]);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await Promise.all([
				refetchMemberships(),
				refetchCurrent(),
				refetchRequests(),
			]);
		} finally {
			setRefreshing(false);
		}
	};

	React.useEffect(() => {
		const approvedRequest = subscriptionRequests.find(
			(req: any) => req.status === 'APPROVED' && req.approvedAt
		);
		if (approvedRequest && !currentSubscription) {
			refetchCurrent();
		}
	}, [subscriptionRequests, currentSubscription, refetchCurrent]);

	const handleCancelSubscription = () => {
		if (!currentSubscription) return;
		setShowCancelConfirmModal(true);
	};

	const confirmCancelSubscription = () => {
		if (!currentSubscription) return;
		cancelMembership({
			variables: { transactionId: currentSubscription.id },
		});
		setShowCancelConfirmModal(false);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	if (membershipsLoading || currentLoading) {
		return (
			<FixedView className='flex-1 bg-bg-darker'>
				<TabHeader showCoachIcon={false} />
				<PremiumLoadingContent message='Please wait..' />
			</FixedView>
		);
	}

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<TabHeader showCoachIcon={false} />
			<ScrollView
				className='flex-1'
				contentContainerClassName='p-5'
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor='#F9C513'
					/>
				}
			>
				<View className='flex-row justify-between items-center mb-6'>
					<View>
						<Text className='text-3xl font-bold text-text-primary'>
							Subscription
						</Text>
						<Text className='text-text-secondary mt-1'>
							Your membership status
						</Text>
					</View>
					<Ionicons name='card' size={32} color='#F9C513' />
				</View>

				{needsGuardianWaiverOnFile ? (
					<View className='mb-6 p-4 rounded-xl bg-[#F9C513]/10 border border-[#F9C513]/35'>
						<Text className='text-text-primary font-semibold mb-2'>
							Action needed: parent / guardian waiver
						</Text>
						<Text className='text-text-secondary text-sm mb-3'>
							You are under 18. A parent or legal guardian must complete the liability waiver
							in Profile before you can request a plan.
						</Text>
						<TouchableOpacity
							onPress={() => router.push('/(member)/profile')}
							className='self-start bg-[#F9C513] px-4 py-2 rounded-lg'
						>
							<Text className='text-bg-darker font-semibold'>Go to Profile</Text>
						</TouchableOpacity>
					</View>
				) : null}
				{currentSubscription ? (
					<>
						{/* Current Subscription Card */}
						<View className='bg-gradient-to-r from-[#E41E26] to-[#F9C513] rounded-xl p-6 mb-6 border-2 border-white/20'>
							<View className='flex-row items-center justify-between mb-4 pb-4 border-b border-white/20'>
								<View className='flex-1'>
									<Text className='text-white text-sm font-semibold mb-1'>
										ACTIVE MEMBERSHIP
									</Text>
									<Text className='text-white text-2xl font-bold mb-1'>
										{currentSubscription.membership?.name || 'Premium'}
									</Text>
									<Text className='text-white/80 text-sm'>
										{currentSubscription.membership?.durationType} Plan
									</Text>
								</View>
								<Ionicons name='checkmark-circle' size={48} color='white' />
							</View>
						</View>

						{/* Subscription Details */}
						<View className='bg-bg-primary rounded-xl p-5 mb-6 border border-[#F9C513]/20'>
							<View className='flex-row items-center justify-between mb-4 pb-4 border-b border-bg-darker/30'>
								<Text className='text-xl font-semibold text-text-primary'>
									Subscription Details
								</Text>
								<TouchableOpacity
									onPress={() => setShowRefundInfoModal(true)}
									className='bg-[#F9C513]/20 rounded-full p-2 border border-[#F9C513]/30'
								>
									<Ionicons
										name='information-circle-outline'
										size={24}
										color='#F9C513'
									/>
								</TouchableOpacity>
							</View>

							<View className='mb-4 pb-4 border-b border-bg-darker/20'>
								<View className='flex-row items-center mb-2'>
									<Ionicons name='calendar-outline' size={20} color='#F9C513' />
									<Text className='text-text-secondary text-sm ml-2'>
										Started
									</Text>
								</View>
								<Text className='text-text-primary font-semibold text-lg'>
									{formatDate(currentSubscription.startedAt)}
								</Text>
							</View>

							<View className='mb-4 pb-4 border-b border-bg-darker/20'>
								<View className='flex-row items-center mb-2'>
									<Ionicons name='calendar-outline' size={20} color='#F9C513' />
									<Text className='text-text-secondary text-sm ml-2'>
										Expires
									</Text>
								</View>
								<Text className='text-text-primary font-semibold text-lg'>
									{formatDate(currentSubscription.expiresAt)}
								</Text>
							</View>

							{currentSubscription.monthDuration >= 1 ? (
								<View className='mb-4 pb-4 border-b border-bg-darker/20'>
									<View className='flex-row items-center mb-2'>
										<Ionicons name='time-outline' size={20} color='#F9C513' />
										<Text className='text-text-secondary text-sm ml-2'>
											Your subscription length
										</Text>
									</View>
									<Text className='text-text-primary font-semibold text-lg'>
										{currentSubscription.monthDuration} month
										{currentSubscription.monthDuration !== 1 ? 's' : ''} (from start to
										expiry)
									</Text>
								</View>
							) : null}

							<View className='mb-4 pb-4 border-b border-bg-darker/20'>
								<Text className='text-text-secondary text-sm mb-2'>
									Days Remaining
								</Text>
								<Text className='text-[#F9C513] font-bold text-2xl'>
									{calculateDaysRemaining(currentSubscription.expiresAt)} days
								</Text>
							</View>

							<View className='mb-4 pb-4 border-b border-bg-darker/20'>
								<Text className='text-text-secondary text-sm mb-2'>
									Price Paid
								</Text>
								<Text className='text-[#F9C513] font-bold text-xl'>
									₱{currentSubscription.priceAtPurchase?.toLocaleString()}
								</Text>
							</View>

									{currentSubscription.membership?.features &&
								currentSubscription.membership.features.length > 0 && (
									<View className='mt-4 pt-4 border-t border-bg-darker/30'>
										<Text className='text-text-primary font-semibold mb-3 pb-3 border-b border-bg-darker/20'>
											Included Features:
										</Text>
										{currentSubscription.membership.features.map(
											(feature: string, index: number) => (
												<View
													key={index}
													className='flex-row items-center mb-2 pl-2 py-1 rounded border border-bg-darker/20'
												>
													<Ionicons
														name='checkmark-circle'
														size={18}
														color='#F9C513'
													/>
													<Text className='text-text-primary ml-2 flex-1'>
														{feature}
													</Text>
												</View>
											)
										)}
									</View>
								)}

							<TouchableOpacity
								onPress={handleCancelSubscription}
								disabled={canceling}
								activeOpacity={0.7}
								className='mt-4 bg-[#EF4444]/20 border border-[#EF4444]/30 rounded-xl p-4 flex-row items-center justify-center'
							>
								{canceling ? (
									<ActivityIndicator size='small' color='#EF4444' />
								) : (
									<>
										<Ionicons
											name='close-circle-outline'
											size={20}
											color='#EF4444'
										/>
										<Text className='text-[#EF4444] font-semibold ml-2'>
											Cancel Subscription
										</Text>
									</>
								)}
							</TouchableOpacity>
						</View>

						{/* Available Plans for Upgrade */}
						{memberships.length > 0 && (
							<View className='mb-6'>
								<Text className='text-xl font-semibold text-text-primary mb-4 pb-4 border-b border-[#F9C513]/20'>
									Upgrade or Switch Plans
								</Text>
								<Text className='text-text-secondary mb-4'>
									Explore other membership options:
								</Text>
								{memberships
									.filter((m: any) => {
										const currentMembershipId =
											currentSubscription.membership?.id ||
											currentSubscription.membershipId;
										return m.id !== currentMembershipId;
									})
									.map((membership: any) => (
										<View
											key={membership.id}
											className='bg-bg-primary rounded-xl p-5 mb-4 border border-[#F9C513]/20'
										>
											{membership.name.includes('PROMO') && (
												<View className='bg-[#F9C513]/20 rounded-lg px-3 py-1 mb-3 self-start flex-row items-center border border-[#F9C513]/30'>
													<Ionicons name='star' size={14} color='#F9C513' />
													<Text className='text-[#F9C513] text-xs font-bold ml-1'>
														MOST POPULAR
													</Text>
												</View>
											)}
											<Text className='text-xl font-bold text-text-primary mb-2'>
												{membership.name}
											</Text>
											<Text className='text-3xl font-bold text-[#F9C513] mb-2'>
												₱{membership.monthlyPrice.toLocaleString()}
												<Text className='text-base text-text-secondary font-normal'>
													/{membership.durationType?.toLowerCase() || 'month'}
												</Text>
											</Text>
											{membership.description && (
												<Text className='text-text-secondary mb-3'>
													{membership.description}
												</Text>
											)}
											{membership.features &&
												membership.features.length > 0 && (
													<View className='mb-4 pt-3 border-t border-bg-darker/20'>
														{membership.features
															.slice(0, 3)
															.map((feature: string, index: number) => (
																<View
																	key={index}
																	className='flex-row items-center mb-2 pl-2 py-1 rounded border border-bg-darker/20'
																>
																	<Ionicons
																		name='checkmark-circle'
																		size={16}
																		color='#34C759'
																	/>
																	<Text className='text-text-primary text-sm ml-2 flex-1'>
																		{feature}
																	</Text>
																</View>
															))}
														{membership.features.length > 3 && (
															<Text className='text-[#F9C513] text-sm font-medium ml-6 mt-2'>
																+{membership.features.length - 3} more features
															</Text>
														)}
													</View>
												)}
											{(() => {
												const pendingRequest = getPendingRequest(membership.id);

												if (
													pendingRequest &&
													pendingRequest.status === 'PENDING'
												) {
													return (
														<View className='mt-2'>
															<View className='bg-[#F9C513]/20 border border-[#F9C513]/30 rounded-xl p-3 mb-2'>
																<View className='flex-row items-center justify-center mb-1'>
																	<Ionicons
																		name='time-outline'
																		size={16}
																		color='#F9C513'
																	/>
																	<Text className='text-[#F9C513] font-semibold ml-2'>
																		Request Pending
																	</Text>
																</View>
																<Text className='text-text-secondary text-xs text-center'>
																	Waiting for admin approval
																</Text>
															</View>
														</View>
													);
												}

												if (
													pendingRequest &&
													pendingRequest.status === 'REJECTED'
												) {
													return (
														<View className='mt-2'>
															<View className='bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-2'>
																<View className='flex-row items-center justify-center mb-1'>
																	<Ionicons
																		name='close-circle-outline'
																		size={16}
																		color='#EF4444'
																	/>
																	<Text className='text-red-400 font-semibold ml-2'>
																		Request Rejected
																	</Text>
																</View>
																<Text className='text-text-secondary text-xs text-center mb-2'>
																	Your request was rejected. You can submit a new request.
																</Text>
															</View>
															<GradientButton
																onPress={() => handlePurchase(membership)}
																className='mt-2'
															>
																Submit New Request
															</GradientButton>
														</View>
													);
												}

												if (
													pendingRequest &&
													pendingRequest.status === 'REJECTED'
												) {
													return (
														<View className='mt-2'>
															<View className='bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-2'>
																<View className='flex-row items-center justify-center mb-1'>
																	<Ionicons
																		name='close-circle-outline'
																		size={16}
																		color='#EF4444'
																	/>
																	<Text className='text-red-400 font-semibold ml-2'>
																		Request Rejected
																	</Text>
																</View>
																<Text className='text-text-secondary text-xs text-center mb-2'>
																	Your request was rejected. You can try again.
																</Text>
															</View>
															<GradientButton
																onPress={() => handlePurchase(membership)}
																className='mt-2'
															>
																Try Again
															</GradientButton>
														</View>
													);
												}

												return (
													<GradientButton
														onPress={() => handlePurchase(membership)}
														className='mt-2'
													>
														Request Switch
													</GradientButton>
												);
											})()}
										</View>
									))}
							</View>
						)}
					</>
				) : (
					<>
						{/* No Subscription State */}
						<View className='bg-bg-primary rounded-xl p-6 mb-6 items-center border border-[#F9C513]/20'>
							<View className='bg-[#F9C513]/20 rounded-full p-4 mb-4 border-2 border-[#F9C513]/30'>
								<Ionicons name='card-outline' size={48} color='#F9C513' />
							</View>
							<Text className='text-2xl font-bold text-text-primary mb-2'>
								No Active Subscription
							</Text>
							<Text className='text-text-secondary text-center mb-4'>
								You don&apos;t have an active membership subscription yet.
							</Text>
							<Text className='text-text-secondary text-center'>
								Choose a plan below to get started!
							</Text>
						</View>

						{/* Available Plans */}
						<View className='mb-6'>
							<Text className='text-xl font-semibold text-text-primary mb-4 pb-4 border-b border-[#F9C513]/20'>
								Available Plans
							</Text>
							<Text className='text-text-secondary mb-4'>
								Choose a membership plan to unlock all features:
							</Text>
							{memberships.map((membership: any) => (
								<View
									key={membership.id}
									className={`bg-bg-primary rounded-xl p-5 mb-4 border ${
										membership.name.includes('PROMO')
											? 'border-[#F9C513] border-2'
											: 'border-bg-darker'
									}`}
								>
									{membership.name.includes('PROMO') && (
										<View className='bg-[#F9C513]/20 rounded-lg px-3 py-1 mb-3 self-start flex-row items-center border border-[#F9C513]/30'>
											<Ionicons name='star' size={14} color='#F9C513' />
											<Text className='text-[#F9C513] text-xs font-bold ml-1'>
												MOST POPULAR
											</Text>
										</View>
									)}
									<Text className='text-xl font-bold text-text-primary mb-2'>
										{membership.name}
									</Text>
									<Text className='text-3xl font-bold text-[#F9C513] mb-2'>
										₱{membership.monthlyPrice.toLocaleString()}
										<Text className='text-base text-text-secondary font-normal'>
											/{membership.durationType?.toLowerCase() || 'month'}
										</Text>
									</Text>

									{membership.description && (
										<Text className='text-text-secondary mb-3'>
											{membership.description}
										</Text>
									)}

									{membership.features && membership.features.length > 0 && (
										<View className='mb-4 pt-3 border-t border-bg-darker/20'>
											{membership.features.map(
												(feature: string, index: number) => (
													<View
														key={index}
														className='flex-row items-center mb-2 pl-2 py-1 rounded border border-bg-darker/20'
													>
														<Ionicons
															name='checkmark-circle'
															size={18}
															color='#34C759'
														/>
														<Text className='text-text-primary ml-2 flex-1'>
															{feature}
														</Text>
													</View>
												)
											)}
										</View>
									)}

									{(() => {
										const pendingRequest = getPendingRequest(membership.id);

										if (
											pendingRequest &&
											pendingRequest.status === 'PENDING'
										) {
											return (
												<View className='mt-2'>
													<View className='bg-[#F9C513]/20 border border-[#F9C513]/30 rounded-xl p-3 mb-2'>
														<View className='flex-row items-center justify-center mb-1'>
															<Ionicons
																name='time-outline'
																size={16}
																color='#F9C513'
															/>
															<Text className='text-[#F9C513] font-semibold ml-2'>
																Request Pending
															</Text>
														</View>
														<Text className='text-text-secondary text-xs text-center'>
															Waiting for admin approval
														</Text>
													</View>
												</View>
											);
										}

										if (
											pendingRequest &&
											pendingRequest.status === 'REJECTED'
										) {
											return (
												<View className='mt-2'>
													<View className='bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-2'>
														<View className='flex-row items-center justify-center mb-1'>
															<Ionicons
																name='close-circle-outline'
																size={16}
																color='#EF4444'
															/>
															<Text className='text-red-400 font-semibold ml-2'>
																Request Rejected
															</Text>
														</View>
														<Text className='text-text-secondary text-xs text-center mb-2'>
															Your request was rejected. You can submit a new request.
														</Text>
													</View>
													<GradientButton
														onPress={() => handlePurchase(membership)}
														className='mt-2'
													>
														Submit New Request
													</GradientButton>
												</View>
											);
										}

										if (
											pendingRequest &&
											pendingRequest.status === 'REJECTED'
										) {
											return (
												<View className='mt-2'>
													<View className='bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-2'>
														<View className='flex-row items-center justify-center mb-1'>
															<Ionicons
																name='close-circle-outline'
																size={16}
																color='#EF4444'
															/>
															<Text className='text-red-400 font-semibold ml-2'>
																Request Rejected
															</Text>
														</View>
														<Text className='text-text-secondary text-xs text-center mb-2'>
															Your request was rejected. You can try again.
														</Text>
													</View>
													<GradientButton
														onPress={() => handlePurchase(membership)}
														className='mt-2'
													>
														Try Again
													</GradientButton>
												</View>
											);
										}

										return (
											<GradientButton
												onPress={() => handlePurchase(membership)}
												className='mt-2'
											>
												Request Subscription
											</GradientButton>
										);
									})()}
								</View>
							))}
						</View>
					</>
				)}
			</ScrollView>

			<MembershipCounterReminderModal
				visible={showCounterReminder}
				onGotIt={() => setShowCounterReminder(false)}
			/>

			{/* Purchase Confirmation Modal */}
			<Modal
				visible={showPurchaseModal}
				animationType='slide'
				onRequestClose={() => {
					setShowPurchaseModal(false);
					setSelectedMembership(null);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-center px-5'>
					<View className='bg-bg-primary rounded-2xl p-6 border-2 border-[#F9C513]/30'>
						<View className='items-center mb-4 pb-4 border-b border-bg-darker/30'>
							<View className='bg-[#F9C513]/20 rounded-full p-4 border-2 border-[#F9C513]/30'>
								<Ionicons name='card' size={48} color='#F9C513' />
							</View>
						</View>
						<Text className='text-2xl font-bold text-text-primary mb-4 text-center pb-4 border-b border-bg-darker/30'>
							Request Subscription to {selectedMembership?.name}
						</Text>
						<View className='bg-[#F9C513]/20 border border-[#F9C513]/30 rounded-xl p-3 mb-4'>
							<View className='flex-row items-center mb-2'>
								<Ionicons
									name='information-circle-outline'
									size={20}
									color='#F9C513'
								/>
								<Text className='text-[#F9C513] font-semibold ml-2'>
									Request Process
								</Text>
							</View>
							<Text className='text-text-secondary text-sm'>
								Your request will be sent to the admin for approval. After you
								confirm, complete payment at the front desk so staff can activate
								your plan once approved.
							</Text>
						</View>
						{selectedMembership && (
							<View className='mb-6'>
								<View className='bg-bg-darker rounded-xl p-4 mb-4 border border-[#F9C513]/20'>
									<View className='flex-row justify-between mb-2 pb-2 border-b border-bg-primary/30'>
										<Text className='text-text-secondary'>Plan</Text>
										<Text className='text-text-primary font-semibold'>
											{selectedMembership.name}
										</Text>
									</View>
									<View className='flex-row justify-between mb-2 pb-2 border-b border-bg-primary/30'>
										<Text className='text-text-secondary'>Duration</Text>
										<Text className='text-text-primary font-semibold'>
											{selectedMembership.durationType}
										</Text>
									</View>
									<View className='flex-row justify-between mb-2'>
										<Text className='text-text-secondary'>Price</Text>
										<Text className='text-[#F9C513] font-bold text-lg'>
											₱{selectedMembership.monthlyPrice.toLocaleString()}
										</Text>
									</View>
								</View>
								{selectedMembership.features &&
									selectedMembership.features.length > 0 && (
										<View className='pt-4 border-t border-bg-darker/30'>
											<Text className='text-text-primary font-semibold mb-2 pb-2 border-b border-bg-darker/20'>
												Included Features:
											</Text>
											{selectedMembership.features
												.slice(0, 4)
												.map((feature: string, index: number) => (
													<View
														key={index}
														className='flex-row items-center mb-1 pl-2 py-1 rounded border border-bg-darker/20'
													>
														<Ionicons
															name='checkmark-circle'
															size={16}
															color='#F9C513'
														/>
														<Text className='text-text-primary text-sm ml-2 flex-1'>
															{feature}
														</Text>
													</View>
												))}
											{selectedMembership.features.length > 4 && (
												<Text className='text-[#F9C513] text-sm font-medium ml-6 mt-2'>
													+{selectedMembership.features.length - 4} more features
												</Text>
											)}
										</View>
									)}
							</View>
						)}
						<View className='flex-row gap-3 w-full'>
							<View className='flex-1'>
								<GradientButton
									variant='secondary'
									onPress={() => {
										setShowPurchaseModal(false);
										setSelectedMembership(null);
									}}
									style={{ height: 56 }}
									textClassName='text-base'
								>
									Cancel
								</GradientButton>
							</View>
							<View className='flex-1'>
								<GradientButton
									onPress={confirmRequest}
									loading={requesting}
									style={{ height: 56 }}
									textClassName='text-base'
								>
									Send Request
								</GradientButton>
							</View>
						</View>
					</View>
				</View>
			</Modal>

			{/* Cancel Subscription confirmation */}
			<ConfirmModal
				visible={showCancelConfirmModal}
				title="Cancel Subscription"
				message="Are you sure you want to cancel your subscription? This action cannot be undone."
				variant="danger"
				confirmLabel="Yes, Cancel"
				cancelLabel="No"
				onConfirm={confirmCancelSubscription}
				onCancel={() => setShowCancelConfirmModal(false)}
				loading={canceling}
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

			{/* Refund Information Modal */}
			<Modal
				visible={showRefundInfoModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => setShowRefundInfoModal(false)}
			>
				<View className='flex-1 bg-bg-darker justify-center px-5'>
					<View className='bg-bg-primary rounded-2xl p-6 border-2 border-[#F9C513]/30'>
						<View className='flex-row items-center justify-between mb-4 pb-4 border-b border-bg-darker/30'>
							<View className='flex-row items-center'>
								<View className='bg-[#F9C513]/20 rounded-full p-3 border-2 border-[#F9C513]/30 mr-3'>
									<Ionicons
										name='information-circle'
										size={32}
										color='#F9C513'
									/>
								</View>
								<Text className='text-2xl font-bold text-text-primary'>
									Refund Information
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => setShowRefundInfoModal(false)}
								className='bg-bg-darker rounded-full p-2'
							>
								<Ionicons name='close' size={24} color='#F9C513' />
							</TouchableOpacity>
						</View>

						<View className='mb-4'>
							<View className='bg-[#F9C513]/10 border border-[#F9C513]/30 rounded-xl p-4 mb-4'>
								<View className='flex-row items-start mb-3'>
									<Ionicons name='cash-outline' size={24} color='#F9C513' />
									<View className='flex-1 ml-3'>
										<Text className='text-[#F9C513] font-bold text-lg mb-2'>
											Refund Policy
										</Text>
										<Text className='text-text-secondary text-sm leading-5'>
											If you need a refund for your subscription and you haven&apos;t
											used it yet, and it hasn&apos;t been long since you paid for
											the subscription, you can go to the person in charge and
											request a refund personally.
										</Text>
									</View>
								</View>
							</View>

							<View className='bg-bg-darker/50 rounded-xl p-4 mb-4 border border-bg-darker/30'>
								<Text className='text-text-primary font-semibold mb-3 flex-row items-center'>
									<Ionicons
										name='checkmark-circle-outline'
										size={20}
										color='#34C759'
									/>
									<Text className='ml-2'>Refund Eligibility:</Text>
								</Text>
								<View className='ml-7'>
									<View className='flex-row items-start mb-2'>
										<Text className='text-text-secondary text-sm'>• </Text>
										<Text className='text-text-secondary text-sm flex-1'>
											You haven&apos;t used the subscription yet
										</Text>
									</View>
									<View className='flex-row items-start mb-2'>
										<Text className='text-text-secondary text-sm'>• </Text>
										<Text className='text-text-secondary text-sm flex-1'>
											It hasn&apos;t been long since you paid for the subscription
										</Text>
									</View>
									<View className='flex-row items-start'>
										<Text className='text-text-secondary text-sm'>• </Text>
										<Text className='text-text-secondary text-sm flex-1'>
											You must request the refund personally from the admins
										</Text>
									</View>
								</View>
							</View>

							<View className='bg-[#F9C513]/10 border border-[#F9C513]/30 rounded-xl p-4'>
								<View className='flex-row items-start'>
									<Ionicons name='people-outline' size={20} color='#F9C513' />
									<View className='flex-1 ml-3'>
										<Text className='text-[#F9C513] font-semibold mb-1'>
											How to Request a Refund
										</Text>
										<Text className='text-text-secondary text-sm leading-5'>
											Visit the gym in person and speak with the person in
											charge to request your refund. Please bring your
											subscription details and payment confirmation.
										</Text>
									</View>
								</View>
							</View>
						</View>

						<GradientButton
							onPress={() => setShowRefundInfoModal(false)}
							style={{ height: 56 }}
						>
							Got it
						</GradientButton>
					</View>
				</View>
			</Modal>
		</FixedView>
	);
};

export default MemberSubscription;
