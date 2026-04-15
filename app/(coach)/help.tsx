import { HelpCenterScreen } from '@/components/HelpCenterScreen';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

export default function CoachHelp() {
	const { user } = useAuth();
	return <HelpCenterScreen role={user?.role === 'coach' ? 'coach' : null} />;
}
