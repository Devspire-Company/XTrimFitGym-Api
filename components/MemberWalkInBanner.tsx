import { MY_MEMBER_WALK_IN_STATUS_QUERY } from '@/graphql/queries';
import { SYNC_MY_WALK_IN_PROFILE_MUTATION } from '@/graphql/mutations';
import { useAuth } from '@/contexts/AuthContext';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { Text, View } from 'react-native';

const POLL_MS = 18_000;

/**
 * For members without a gym membership: keeps the walk-in desk row in sync with the API
 * and shows when the account appears on the admin walk-in list and when staff record a time-in.
 */
export function MemberWalkInBanner() {
	const { user } = useAuth();
	const apollo = useApolloClient();
	const skip =
		!user?.id || user.role !== 'member' || memberHasActiveGymMembership(user);
	const syncedOnceRef = useRef(false);

	const { data, refetch } = useQuery(MY_MEMBER_WALK_IN_STATUS_QUERY, {
		skip,
		fetchPolicy: 'cache-and-network',
		pollInterval: skip ? 0 : POLL_MS,
		notifyOnNetworkStatusChange: true,
	});

	const runSync = useCallback(async () => {
		if (skip) return;
		try {
			await apollo.mutate({ mutation: SYNC_MY_WALK_IN_PROFILE_MUTATION });
			await refetch();
		} catch {
			/* non-fatal */
		}
	}, [apollo, refetch, skip]);

	useFocusEffect(
		useCallback(() => {
			if (skip) return;
			void runSync();
		}, [runSync, skip])
	);

	React.useEffect(() => {
		if (skip) {
			syncedOnceRef.current = false;
			return;
		}
		if (syncedOnceRef.current) return;
		syncedOnceRef.current = true;
		void runSync();
	}, [runSync, skip, user?.id]);

	if (skip) return null;

	const st = data?.myMemberWalkInStatus;
	if (!st?.registered) return null;

	const count = st.timeInCount ?? 0;
	const last = st.lastTimedInAt
		? new Date(st.lastTimedInAt).toLocaleString(undefined, {
				dateStyle: 'medium',
				timeStyle: 'short',
			})
		: null;

	return (
		<View className='mx-4 mt-2 mb-1 rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-3'>
			<View className='flex-row items-start gap-2'>
				<Ionicons name='checkmark-circle' size={22} color='#34d399' style={{ marginTop: 2 }} />
				<View className='flex-1'>
					<Text className='text-emerald-100 font-semibold text-sm mb-1'>
						Walk-in / try-out — you&apos;re on the front desk list
					</Text>
					{count > 0 ? (
						<Text className='text-text-secondary text-xs leading-5'>
							Staff recorded {count === 1 ? 'one gym visit' : `${count} gym visits`} for your
							walk-in access
							{last ? ` (last: ${last})` : ''}.
						</Text>
					) : (
						<Text className='text-text-secondary text-xs leading-5'>
							Staff can find you by name or email in Walk-in attendance. When you arrive, give
							them the same email you use in this app.
						</Text>
					)}
				</View>
			</View>
		</View>
	);
}
