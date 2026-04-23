import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import { MembershipCounterReminderModal } from '@/components/MembershipCounterReminderModal';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { normalizePhysiqueGoalTypeForApi } from '@/constants/onboarding-options';
import type { GetMembershipsQuery } from '@/graphql/generated/types';
import {
	CREATE_SUBSCRIPTION_REQUEST_MUTATION,
	SYNC_MY_WALK_IN_PROFILE_MUTATION,
	UPDATE_USER_MUTATION,
} from '@/graphql/mutations';
import {
	GET_MEMBERSHIPS_QUERY,
	GET_MY_SUBSCRIPTION_REQUESTS_QUERY,
} from '@/graphql/queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { storage } from '@/utils/storage';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

type MembershipRow = NonNullable<
	NonNullable<GetMembershipsQuery['getMemberships']>[number]
>;
type UpdateUserMutation = any;
type UpdateUserMutationVariables = any;

const toIsoIfValid = (date?: Date): string | undefined => {
	if (!date || Number.isNaN(date.getTime())) return undefined;
	try {
		return date.toISOString();
	} catch {
		return undefined;
	}
};

const Third = () => {
	const router = useRouter();
	const { data: onboardingData, updateData, clearData } = useOnboarding();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.user);
	const apolloClient = useApolloClient();
	const [view, setView] = useState<'intro' | 'plans'>('intro');
	const [selectedMembership, setSelectedMembership] =
		useState<MembershipRow | null>(null);
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [showCounter, setShowCounter] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
	}>({ visible: false, title: '', message: '' });
	const alertConfirmRef = useRef<(() => void) | null>(null);
	const pendingIntentRef = useRef<'skip' | 'avail_counter' | null>(null);

	const {
		data: membershipsData,
		loading: membershipsLoading,
		refetch: refetchMemberships,
	} = useQuery<GetMembershipsQuery>(GET_MEMBERSHIPS_QUERY, {
		variables: { status: 'ACTIVE' },
		fetchPolicy: 'cache-and-network',
	});

	const { data: requestsData, refetch: refetchRequests } = useQuery(
		GET_MY_SUBSCRIPTION_REQUESTS_QUERY,
		{ fetchPolicy: 'cache-and-network' }
	);

	const [createSubscriptionRequest, { loading: requesting }] = useMutation(
		CREATE_SUBSCRIPTION_REQUEST_MUTATION,
		{
			onCompleted: (data) => {
				setShowRequestModal(false);
				setSelectedMembership(null);
				const id = data?.createSubscriptionRequest?.membershipId ?? undefined;
				if (id) {
					updateData({
						requestedMembershipId: id,
					});
				}
				void refetchRequests();
				setShowCounter(true);
			},
			onError: (error) => {
				setAlertModal({
					visible: true,
					title: 'Error',
					message: error.message,
				});
			},
		}
	);

	const [finalizeOnboarding, { loading: finalizing }] = useMutation<
		UpdateUserMutation,
		UpdateUserMutationVariables
	>(UPDATE_USER_MUTATION, {
		onCompleted: (res) => {
			if (!res?.updateUser) {
				pendingIntentRef.current = null;
				showAlert(
					'Error',
					'We could not load your updated profile. Please try again.'
				);
				return;
			}
			let updated;
			try {
				updated = convertGraphQLUser(res.updateUser);
			} catch {
				pendingIntentRef.current = null;
				showAlert(
					'Error',
					'Received an invalid profile response from the server. Please try again.'
				);
				return;
			}
			dispatch(setUser(updated));
			const intent = pendingIntentRef.current;
			const welcome =
				intent === 'skip'
					? 'limited'
					: intent === 'avail_counter'
						? 'counter'
						: 'active';
			void storage.setItem('onboarding_welcome', welcome);
			if (updated?.role === 'member' && !memberHasActiveGymMembership(updated)) {
				void apolloClient
					.mutate({ mutation: SYNC_MY_WALK_IN_PROFILE_MUTATION })
					.catch(() => {
						/* non-fatal; MemberWalkInBanner will retry */
					});
			}
			clearData();
			pendingIntentRef.current = null;
			router.navigate('/(member)/dashboard');
		},
		onError: (error) => {
			pendingIntentRef.current = null;
			showAlert('Error', error.message);
		},
	});

	const memberships = useMemo(() => {
		const raw = membershipsData?.getMemberships ?? [];
		return [...raw].sort((a, b) => {
			const aPopular = a.name?.toUpperCase().includes('PROMO') ? 1 : 0;
			const bPopular = b.name?.toUpperCase().includes('PROMO') ? 1 : 0;
			return bPopular - aPopular;
		});
	}, [membershipsData?.getMemberships]);

	const subscriptionRequests =
		requestsData?.getMySubscriptionRequests ?? [];

	const hasCompletedTerms = !!onboardingData.termsWaiverCompletedPreMembership;

	useEffect(() => {
		if (!hasCompletedTerms) {
			router.replace('/(auth)/(onboarding)/fourth');
		}
	}, [hasCompletedTerms, router]);

	const showAlert = (title: string, message: string, onConfirm?: () => void) => {
		alertConfirmRef.current = onConfirm ?? null;
		setAlertModal({
			visible: true,
			title,
			message,
		});
	};

	const closeAlertModal = () => {
		const cb = alertConfirmRef.current;
		alertConfirmRef.current = null;
		setAlertModal((p) => ({ ...p, visible: false }));
		cb?.();
	};

	const finishOnboarding = (intent: 'skip' | 'avail_counter') => {
		if (!user?.id) {
			showAlert('Error', 'User not found. Please sign in again.');
			return;
		}
		if (!hasCompletedTerms) {
			showAlert(
				'Complete terms first',
				'Please complete Terms & Conditions before choosing membership options.',
				() => router.push('/(auth)/(onboarding)/fourth')
			);
			return;
		}
		pendingIntentRef.current = intent;
		updateData({ membershipIntent: intent });
		void finalizeOnboarding({
			variables: {
				id: user.id,
				input: {
					phoneNumber: onboardingData.phoneNumber,
					dateOfBirth: toIsoIfValid(onboardingData.dateOfBirth),
					gender: onboardingData.gender,
					agreedToTermsAndConditions: onboardingData.agreedToTermsAndConditions,
					membershipDetails: {
						physiqueGoalType: normalizePhysiqueGoalTypeForApi(
							onboardingData.physiqueGoalType
						),
						fitnessGoal: onboardingData.fitnessGoal || [],
						workOutTime: onboardingData.workOutTime || [],
						hasEnteredDetails: true,
					},
				},
			},
		});
	};

	const getPendingRequest = (membershipId: string) =>
		subscriptionRequests.find(
			(req: { membershipId?: string; status?: string }) =>
				req.membershipId === membershipId && req.status === 'PENDING'
		);

	const getRejectedRequest = (membershipId: string) =>
		subscriptionRequests.find(
			(req: { membershipId?: string; status?: string }) =>
				req.membershipId === membershipId && req.status === 'REJECTED'
		);

	const goTermsSkip = () => {
		finishOnboarding('skip');
	};

	const handleCounterGotIt = () => {
		setShowCounter(false);
		finishOnboarding('avail_counter');
	};

	const openRequestModal = (m: MembershipRow) => {
		setSelectedMembership(m);
		setShowRequestModal(true);
	};

	const confirmRequest = () => {
		if (!selectedMembership) return;

		createSubscriptionRequest({
			variables: {
				input: { membershipId: selectedMembership.id },
			},
		});
	};

	const renderPlanActions = (membership: MembershipRow) => {
		const pendingRequest = getPendingRequest(membership.id);
		const rejectedRequest = getRejectedRequest(membership.id);

		if (pendingRequest) {
			return (
				<View className='mt-2'>
					<View className='bg-[#F9C513]/20 border border-[#F9C513]/30 rounded-xl p-3 mb-2'>
						<View className='flex-row items-center justify-center mb-1'>
							<Ionicons name='time-outline' size={16} color='#F9C513' />
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

		if (rejectedRequest) {
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
						onPress={() => openRequestModal(membership)}
						className='mt-2'
					>
						Submit New Request
					</GradientButton>
				</View>
			);
		}

		return (
			<GradientButton
				onPress={() => openRequestModal(membership)}
				className='mt-2'
			>
				Request Subscription
			</GradientButton>
		);
	};

	const introContent = (
		<ScrollView
			contentContainerClassName='flex-grow px-5 py-8'
			keyboardShouldPersistTaps='handled'
			showsVerticalScrollIndicator={false}
		>
			<Text className='text-text-secondary text-sm mb-4'>Step 4 of 4</Text>
			<Text className='text-3xl font-bold mb-2 text-text-primary'>
				Membership
			</Text>
			<Text className='text-base text-text-secondary mb-10'>
				{hasCompletedTerms
					? 'Choose how you want to continue. You can always subscribe later from the app.'
					: 'Before choosing a membership option, complete Terms & Conditions first.'}
			</Text>

			<View className='gap-4 mt-6'>
				{!hasCompletedTerms ? (
					<GradientButton
						onPress={() => router.push('/(auth)/(onboarding)/fourth')}
						disabled={finalizing}
					>
						Continue to Terms
					</GradientButton>
				) : (
					<>
						<GradientButton onPress={() => setView('plans')} disabled={finalizing}>
							Avail membership
						</GradientButton>

						<GradientButton
							variant='secondary'
							onPress={goTermsSkip}
							disabled={finalizing}
							loading={finalizing}
						>
							Proceed without membership
						</GradientButton>
					</>
				)}

				<Text className='text-text-secondary text-sm text-center leading-5 px-1'>
					{hasCompletedTerms
						? 'Free workouts stay available. Other features stay locked until you subscribe.'
						: 'All users must accept Terms & Conditions before selecting a membership option.'}
				</Text>

				<View className='mt-6'>
					<GradientButton
						variant='secondary'
						onPress={() => router.back()}
						className='w-full'
					>
						Back
					</GradientButton>
				</View>
			</View>
		</ScrollView>
	);

	const plansContent =
		membershipsLoading && memberships.length === 0 ? (
			<View className='flex-1'>
				<PremiumLoadingContent message='Please wait..' />
			</View>
		) : (
			<ScrollView
				contentContainerClassName='flex-grow px-5 py-8 pb-12'
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}
			>
				<TouchableOpacity
					onPress={() => {
						void refetchMemberships();
						setView('intro');
					}}
					className='flex-row items-center mb-6 active:opacity-70'
					hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
				>
					<Ionicons name='chevron-back' size={22} color='#F9C513' />
					<Text className='text-[#F9C513] font-semibold ml-1'>
						Membership options
					</Text>
				</TouchableOpacity>

				<Text className='text-text-secondary text-sm mb-2'>Step 4 of 4</Text>
				<Text className='text-3xl font-bold text-text-primary mb-2'>
					Available plans
				</Text>
				<Text className='text-text-secondary mb-6'>
					Choose a membership plan to unlock all features:
				</Text>

				{memberships.length === 0 ? (
					<Text className='text-text-secondary text-center py-8'>
						No plans are available right now. Try again later or proceed without
						membership.
					</Text>
				) : (
					memberships.map((membership) => (
						<View
							key={membership.id}
							className={`bg-bg-primary rounded-xl p-5 mb-4 border ${
								membership.name?.includes('PROMO')
									? 'border-[#F9C513] border-2'
									: 'border-bg-darker'
							}`}
						>
							{membership.name?.includes('PROMO') && (
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
								₱{membership.monthlyPrice?.toLocaleString() ?? '—'}
								<Text className='text-base text-text-secondary font-normal'>
									/{membership.durationType?.toLowerCase() || 'month'}
								</Text>
							</Text>

							{membership.description ? (
								<Text className='text-text-secondary mb-3'>
									{membership.description}
								</Text>
							) : null}

							{membership.features && membership.features.length > 0 ? (
								<View className='mb-4 pt-3 border-t border-bg-darker/20'>
									{membership.features.map((feature: string, index: number) => (
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
									))}
								</View>
							) : null}

							{renderPlanActions(membership)}
						</View>
					))
				)}
			</ScrollView>
		);

	if (!hasCompletedTerms) {
		return (
			<FixedView className='flex-1 bg-bg-darker'>
				<PremiumLoadingContent message='Opening terms…' />
			</FixedView>
		);
	}

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className='flex-1'
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
			>
				{view === 'intro' || !hasCompletedTerms ? introContent : plansContent}
			</KeyboardAvoidingView>

			{/* Confirm send request — same flow as Subscription tab */}
			<Modal
				visible={showRequestModal}
				animationType='slide'
				onRequestClose={() => {
					setShowRequestModal(false);
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
									Request process
								</Text>
							</View>
							<Text className='text-text-secondary text-sm'>
								Your request will be sent to the admin for approval. After you
								confirm, we&apos;ll remind you to complete payment at the front
								desk.
							</Text>
						</View>
						{selectedMembership ? (
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
											₱{selectedMembership.monthlyPrice?.toLocaleString()}
										</Text>
									</View>
								</View>
							</View>
						) : null}
						<View className='flex-row gap-3 w-full'>
							<View className='flex-1'>
								<GradientButton
									variant='secondary'
									onPress={() => {
										setShowRequestModal(false);
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

			<MembershipCounterReminderModal
				visible={showCounter}
				onGotIt={handleCounterGotIt}
				onBack={() => setShowCounter(false)}
			/>

			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant='danger'
				confirmLabel='OK'
				onConfirm={closeAlertModal}
				onCancel={closeAlertModal}
				hideCancel
			/>
		</FixedView>
	);
};

export default Third;
