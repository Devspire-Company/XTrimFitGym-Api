import { PostOnboardingWelcomeModal } from '@/components/PostOnboardingWelcomeModal';
import { useAuth } from '@/contexts/AuthContext';
import { useMeQuery } from '@/graphql/generated/types';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

const ME_POLL_MS = 12_000;

/** Polls `me` so admin-side membership changes are reflected promptly in the app. */
export function MemberMeSyncAndWelcome() {
	const { user } = useAuth();
	const dispatch = useDispatch();
	const router = useRouter();
	const [showApprovedWelcome, setShowApprovedWelcome] = useState(false);
	const prevHasMembershipRef = useRef<boolean | null>(null);
	const seededRef = useRef(false);

	const hasMembership = memberHasActiveGymMembership(user);
	const skipMe = !user?.id || user.role !== 'member';

	// Keep polling for member accounts so admin-side membership changes
	// (approve/cancel/unsubscribe) are reflected in the app promptly.
	const shouldPollMe = !skipMe;

	const { data } = useMeQuery({
		skip: skipMe,
		fetchPolicy: 'cache-and-network',
		pollInterval: shouldPollMe ? ME_POLL_MS : 0,
		notifyOnNetworkStatusChange: true,
	});

	useLayoutEffect(() => {
		if (data?.me) {
			dispatch(setUser(convertGraphQLUser(data.me)));
		}
	}, [data, dispatch]);

	useEffect(() => {
		if (skipMe) {
			seededRef.current = false;
			prevHasMembershipRef.current = null;
		}
	}, [skipMe]);

	useEffect(() => {
		if (skipMe) return;

		if (!seededRef.current) {
			prevHasMembershipRef.current = hasMembership;
			seededRef.current = true;
			return;
		}

		const prevMem = prevHasMembershipRef.current;
		if (prevMem === false && hasMembership === true) {
			setShowApprovedWelcome(true);
		}

		prevHasMembershipRef.current = hasMembership;
	}, [skipMe, hasMembership]);

	const dismissWelcome = () => {
		setShowApprovedWelcome(false);
		router.navigate('/(member)/dashboard');
	};

	if (skipMe) return null;

	return (
		<>
			<PostOnboardingWelcomeModal
				visible={showApprovedWelcome}
				onDismiss={dismissWelcome}
			/>
		</>
	);
}
