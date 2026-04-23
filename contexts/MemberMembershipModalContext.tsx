import ConfirmModal from '@/components/ConfirmModal';
import { useRouter } from 'expo-router';
import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';

type MemberMembershipModalContextValue = {
	openMembershipRequired: () => void;
};

const MemberMembershipModalContext =
	createContext<MemberMembershipModalContextValue | null>(null);

export function MemberMembershipModalProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const [visible, setVisible] = useState(false);

	const openMembershipRequired = useCallback(() => {
		setVisible(true);
	}, []);

	const value = useMemo(
		() => ({ openMembershipRequired }),
		[openMembershipRequired]
	);

	const onConfirm = useCallback(() => {
		setVisible(false);
		router.push('/(member)/subscription');
	}, [router]);

	const onCancel = useCallback(() => setVisible(false), []);

	return (
		<MemberMembershipModalContext.Provider value={value}>
			{children}
			<ConfirmModal
				visible={visible}
				title='Membership required'
				message='Avail a gym membership to unlock the dashboard, schedule, progress, coaches, attendance, and session logs. You can keep using Workouts anytime.'
				variant='neutral'
				confirmLabel='View'
				cancelLabel='Not now'
				onConfirm={onConfirm}
				onCancel={onCancel}
			/>
		</MemberMembershipModalContext.Provider>
	);
}

export function useMemberMembershipModal(): MemberMembershipModalContextValue {
	const ctx = useContext(MemberMembershipModalContext);
	if (!ctx) {
		return { openMembershipRequired: () => {} };
	}
	return ctx;
}
