import FixedView from '@/components/FixedView';
import { useAuth } from '@/contexts/AuthContext';
import { useMeQuery } from '@/graphql/generated/types';
import { clearUser, setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import { clearAuthFlowIntent, getAuthFlowIntent } from '@/utils/auth-flow';
import { storage } from '@/utils/storage';
import { NetworkStatus } from '@apollo/client';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const SLOW_SYNC_HINT_MS = 12_000;

export default function Index() {
	const dispatch = useDispatch();
	const reduxUser = useSelector((s: { user: { user: unknown } }) => s.user.user) as
		| import('@/graphql/generated/types').User
		| null;
	const { onboardingStatus } = useAuth();
	const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();

	const [showSlowSyncHint, setShowSlowSyncHint] = useState(false);
	const [profileHydrateError, setProfileHydrateError] = useState<string | null>(null);
	const [meNullAuthFlow, setMeNullAuthFlow] = useState<'login' | 'signup' | null>(null);
	const slowHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const needMe = clerkLoaded && isSignedIn && !reduxUser;

	const restartSlowSyncHintTimer = useCallback(() => {
		setShowSlowSyncHint(false);
		if (slowHintTimer.current) {
			clearTimeout(slowHintTimer.current);
			slowHintTimer.current = null;
		}
		if (needMe && !reduxUser) {
			slowHintTimer.current = setTimeout(() => setShowSlowSyncHint(true), SLOW_SYNC_HINT_MS);
		}
	}, [needMe, reduxUser]);
	const { data, loading, error, refetch, networkStatus } = useMeQuery({
		skip: !needMe,
		fetchPolicy: 'cache-and-network',
		nextFetchPolicy: 'cache-first',
		notifyOnNetworkStatusChange: true,
	});

	const meLoading =
		loading ||
		networkStatus === NetworkStatus.refetch ||
		networkStatus === NetworkStatus.setVariables;

	useLayoutEffect(() => {
		if (!data?.me) return;
		try {
			setProfileHydrateError(null);
			setMeNullAuthFlow(null);
			void clearAuthFlowIntent();
			dispatch(setUser(convertGraphQLUser(data.me)));
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Could not parse your profile.';
			setProfileHydrateError(msg);
		}
	}, [data?.me, dispatch]);

	useEffect(() => {
		if (!needMe || reduxUser) {
			setMeNullAuthFlow(null);
			return;
		}
		if (meLoading || (data === undefined && !error)) return;
		if (error) {
			setMeNullAuthFlow(null);
			return;
		}
		if (data?.me != null) {
			setMeNullAuthFlow(null);
			return;
		}
		let cancelled = false;
		void getAuthFlowIntent().then((flow) => {
			if (!cancelled) setMeNullAuthFlow(flow);
		});
		return () => {
			cancelled = true;
		};
	}, [needMe, reduxUser, meLoading, data, error]);

	useEffect(() => {
		if (!clerkLoaded) return;
		if (!isSignedIn && reduxUser) {
			dispatch(clearUser());
			void storage.removeItem('auth_token');
			void clearAuthFlowIntent();
		}
	}, [clerkLoaded, isSignedIn, reduxUser, dispatch]);

	useEffect(() => {
		if (!needMe || reduxUser) {
			setShowSlowSyncHint(false);
			if (slowHintTimer.current) {
				clearTimeout(slowHintTimer.current);
				slowHintTimer.current = null;
			}
			return;
		}
		slowHintTimer.current = setTimeout(() => setShowSlowSyncHint(true), SLOW_SYNC_HINT_MS);
		return () => {
			if (slowHintTimer.current) {
				clearTimeout(slowHintTimer.current);
				slowHintTimer.current = null;
			}
		};
	}, [needMe, reduxUser]);

	if (!clerkLoaded) {
		return (
			<FixedView className='flex-1 bg-bg-darker'>
				<View className='flex-1 justify-center items-center'>
					<ActivityIndicator size='large' />
					<Text className='mt-2.5 text-base text-text-secondary'>Loading...</Text>
				</View>
			</FixedView>
		);
	}

	if (!isSignedIn) {
		return <Redirect href='/(auth)/login' />;
	}

	if (isSignedIn && !reduxUser) {
		if (profileHydrateError) {
			return (
				<FixedView className='flex-1 bg-bg-darker'>
					<View className='flex-1 justify-center items-center px-6'>
						<Text className='text-base text-red-400 text-center'>{profileHydrateError}</Text>
						<TouchableOpacity
							onPress={() => {
								setProfileHydrateError(null);
								restartSlowSyncHintTimer();
								void refetch();
							}}
							className='mt-6 py-3 px-6 rounded-xl bg-[#F9C513]/20 border border-[#F9C513]'
							style={{ borderWidth: 0.5 }}
						>
							<Text className='text-[#F9C513] font-semibold text-center'>Try again</Text>
						</TouchableOpacity>
					</View>
				</FixedView>
			);
		}
		if (meLoading || (needMe && data === undefined && !error)) {
			return (
				<FixedView className='flex-1 bg-bg-darker'>
					<View className='flex-1 justify-center items-center px-6'>
						<ActivityIndicator size='large' />
						<Text className='mt-2.5 text-base text-text-secondary text-center'>
							Syncing your account…
						</Text>
						{showSlowSyncHint ? (
							<Text className='mt-4 text-sm text-text-secondary text-center leading-5'>
								This can take up to a minute the first time after the API has been idle
								(e.g. on Render). Check your connection, then wait or try again below.
							</Text>
						) : null}
						{showSlowSyncHint ? (
							<TouchableOpacity
								onPress={() => {
									restartSlowSyncHintTimer();
									void refetch();
								}}
								className='mt-4 py-3 px-6 rounded-xl bg-bg-primary border border-[#F9C513]/50'
								style={{ borderWidth: 0.5 }}
							>
								<Text className='text-text-primary font-semibold text-center'>Retry sync</Text>
							</TouchableOpacity>
						) : null}
					</View>
				</FixedView>
			);
		}
		if (error) {
			return (
				<FixedView className='flex-1 bg-bg-darker'>
					<View className='flex-1 justify-center items-center px-6'>
						<Text className='text-base text-red-400 text-center'>
							{error.message || 'Could not load your profile.'}
						</Text>
						<Text className='mt-3 text-sm text-text-secondary text-center'>
							If this keeps happening, the server may be waking up or your network may be blocking
							the API.
						</Text>
						<TouchableOpacity
							onPress={() => {
								restartSlowSyncHintTimer();
								void refetch();
							}}
							className='mt-6 py-3 px-6 rounded-xl bg-[#F9C513]/20 border border-[#F9C513]'
							style={{ borderWidth: 0.5 }}
						>
							<Text className='text-[#F9C513] font-semibold text-center'>Try again</Text>
						</TouchableOpacity>
					</View>
				</FixedView>
			);
		}
		if (data?.me == null) {
			if (meNullAuthFlow === null) {
				return (
					<FixedView className='flex-1 bg-bg-darker'>
						<View className='flex-1 justify-center items-center'>
							<ActivityIndicator size='large' />
						</View>
					</FixedView>
				);
			}
			return <Redirect href='/(auth)/complete-registration' />;
		}
		return (
			<FixedView className='flex-1 bg-bg-darker'>
				<View className='flex-1 justify-center items-center'>
					<ActivityIndicator size='large' />
				</View>
			</FixedView>
		);
	}

	if (reduxUser?.role === 'coach') {
		return <Redirect href='/(coach)/dashboard' />;
	}
	if (reduxUser?.role === 'member') {
		if (onboardingStatus !== 'completed') {
			return <Redirect href='/(auth)/(onboarding)/first' />;
		}
		return <Redirect href='/(member)/dashboard' />;
	}

	return <Redirect href='/(auth)/login' />;
}
