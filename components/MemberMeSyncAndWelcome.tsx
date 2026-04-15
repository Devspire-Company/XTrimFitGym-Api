import { FacilityBiometricPendingModal } from '@/components/FacilityBiometricPendingModal';
import { PostOnboardingWelcomeModal } from '@/components/PostOnboardingWelcomeModal';
import { useAuth } from '@/contexts/AuthContext';
import { useMeQuery } from '@/graphql/generated/types';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import {
	memberHasActiveGymMembership,
	memberNeedsFacilityBiometric,
} from '@/utils/memberMembership';
import { useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

const ME_POLL_MS = 12_000;

/**
 * Polls `me` while membership or facility biometric enrollment is pending.
 * After payment (membership assigned), a non-dismissible biometric gate runs until the server marks enrollment complete.
 */
export function MemberMeSyncAndWelcome() {
	const { user } = useAuth();
	const dispatch = useDispatch();
	const router = useRouter();
	const [showApprovedWelcome, setShowApprovedWelcome] = useState(false);
	const [manualMeCheck, setManualMeCheck] = useState(false);
	const prevHasMembershipRef = useRef<boolean | null>(null);
	const prevNeedsBiometricRef = useRef<boolean | null>(null);
	const seededRef = useRef(false);

	const hasMembership = memberHasActiveGymMembership(user);
	const needsBiometric = memberNeedsFacilityBiometric(user);
	const skipMe = !user?.id || user.role !== 'member';

	const shouldPollMe =
		!skipMe && (!hasMembership || (hasMembership && needsBiometric));

	const { data, refetch } = useMeQuery({
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
			prevNeedsBiometricRef.current = null;
		}
	}, [skipMe]);

	useEffect(() => {
		if (skipMe) return;

		if (!seededRef.current) {
			prevHasMembershipRef.current = hasMembership;
			prevNeedsBiometricRef.current = needsBiometric;
			seededRef.current = true;
			return;
		}

		const prevMem = prevHasMembershipRef.current;
		const prevBio = prevNeedsBiometricRef.current;

		if (prevMem === false && hasMembership === true && !needsBiometric) {
			setShowApprovedWelcome(true);
		}
		if (prevBio === true && needsBiometric === false && hasMembership) {
			setShowApprovedWelcome(true);
		}

		prevHasMembershipRef.current = hasMembership;
		prevNeedsBiometricRef.current = needsBiometric;
	}, [skipMe, hasMembership, needsBiometric]);

	const dismissWelcome = () => {
		setShowApprovedWelcome(false);
		router.replace('/(member)/dashboard');
	};

	const onBiometricCheckAgain = async () => {
		setManualMeCheck(true);
		try {
			const res = await refetch();
			if (res.data?.me) {
				dispatch(setUser(convertGraphQLUser(res.data.me)));
			}
		} finally {
			setManualMeCheck(false);
		}
	};

	if (skipMe) return null;

	return (
		<>
			<FacilityBiometricPendingModal
				visible={hasMembership && needsBiometric}
				checking={manualMeCheck}
				onCheckAgain={onBiometricCheckAgain}
			/>
			<PostOnboardingWelcomeModal
				visible={showApprovedWelcome}
				onDismiss={dismissWelcome}
			/>
		</>
	);
}
