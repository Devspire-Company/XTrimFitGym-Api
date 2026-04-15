/** Static Help Center content. role: 'member' | 'coach' | null = show to all. */
export type HelpRole = 'member' | 'coach' | null;

export interface HelpItem {
	question: string;
	answer: string;
}

export interface HelpSection {
	sectionTitle: string;
	role: HelpRole;
	items: HelpItem[];
}

export const HELP_SECTIONS: HelpSection[] = [
	{
		sectionTitle: 'Getting started',
		role: null,
		items: [
			{
				question: 'What is the difference between walk-in and member?',
				answer:
					'Walk-in: limited access, no membership. Member: full access, subscription, sessions, progress, and coach assignment.',
			},
			{
				question: 'How do I become a member?',
				answer:
					'Get a membership from Plans (as a guest) or Subscription in the app. Complete onboarding if prompted.',
			},
			{
				question: "I'm a walk-in. How do I log in?",
				answer:
					'Use "Continue as walk-in" on the login screen, then Log in or Sign up with your details.',
			},
		],
	},
	{
		sectionTitle: 'Account and profile',
		role: null,
		items: [
			{
				question: 'How do I update my name or phone?',
				answer: 'Go to Profile, edit your details, then save.',
			},
			{
				question: 'How do I change my password?',
				answer: 'Go to Profile and use the Change password section.',
			},
			{
				question: "What if I don't have an attendance ID?",
				answer:
					'Your account may not be fully set up. Contact support (see Contact support below).',
			},
		],
	},
	{
		sectionTitle: 'Schedule and sessions',
		role: 'member',
		items: [
			{
				question: 'How do I see my sessions?',
				answer: 'The Schedule tab shows your upcoming and past sessions.',
			},
			{
				question: 'What are session logs?',
				answer:
					'Records of completed sessions (e.g. weight, progress images, notes). Open Session Logs from the menu.',
			},
		],
	},
	{
		sectionTitle: 'Schedule and clients',
		role: 'coach',
		items: [
			{
				question: 'How do I create or edit a session?',
				answer: 'Go to Schedule, then create a new session or tap an existing one to edit.',
			},
			{
				question: 'Where do I see my clients?',
				answer: 'Open the Clients tab from the bottom bar or the sidebar.',
			},
		],
	},
	{
		sectionTitle: 'Subscription and membership',
		role: null,
		items: [
			{
				question: 'Where do I see my plan or renewal?',
				answer: 'Open Subscription from the bottom tab or the sidebar.',
			},
			{
				question: 'How do I cancel or change my plan?',
				answer: 'Use the options on the Subscription screen or contact the gym.',
			},
		],
	},
];

export const HELP_CONTACT_LINE =
	'For account issues, billing, or attendance ID, contact the gym.';
export const HELP_CONTACT_PLACEHOLDER = 'Contact the gym front desk or admin.';
