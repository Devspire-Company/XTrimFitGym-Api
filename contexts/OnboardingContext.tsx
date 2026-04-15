import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingData {
	// Screen 1
	phoneNumber?: string;
	dateOfBirth?: Date;
	gender?: string;

	// Screen 2
	fitnessGoal?: string[];
	physiqueGoalType?: string;
	workOutTime?: string[];

	/** Step 3: in-person membership vs skip for now */
	membershipIntent?: 'avail_counter' | 'skip';
	/** Set after successful subscription request during onboarding */
	requestedMembershipId?: string;
	/** Completed terms + liability waiver before choosing membership option. */
	termsWaiverCompletedPreMembership?: boolean;

	// Screen 4
	agreedToTermsAndConditions?: boolean;
}

interface OnboardingContextType {
	data: OnboardingData;
	updateData: (data: Partial<OnboardingData>) => void;
	clearData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
	undefined
);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [data, setData] = useState<OnboardingData>({});

	const updateData = (newData: Partial<OnboardingData>) => {
		setData((prev) => ({ ...prev, ...newData }));
	};

	const clearData = () => {
		setData({});
	};

	return (
		<OnboardingContext.Provider value={{ data, updateData, clearData }}>
			{children}
		</OnboardingContext.Provider>
	);
};

export const useOnboarding = () => {
	const context = useContext(OnboardingContext);
	if (context === undefined) {
		throw new Error('useOnboarding must be used within an OnboardingProvider');
	}
	return context;
};

