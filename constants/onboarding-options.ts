/**
 * Shared options for onboarding and profile (body type, fitness goals, workout time presets).
 *
 * Gym hours (reference): Mon–Thu & Sat–Sun 10:00 AM – 10:00 PM; Fri 2:00 PM – 10:00 PM.
 */

export function normalizePhysiqueGoalTypeForApi(
	value: string | undefined | null
): string {
	if (value == null || value === '') return '';
	if (value.toLowerCase() === 'general') return 'General';
	return value;
}

export const bodyTypeOptions = [
	{ label: 'Ectomorph (lean, fast metabolism, harder to gain weight)', value: 'Ectomorph' },
	{ label: 'Mesomorph (athletic build, gains muscle and loses fat easily)', value: 'Mesomorph' },
	{ label: 'Endomorph (larger frame, gains weight easily, stores fat more)', value: 'Endomorph' },
	{ label: 'Not sure', value: 'Not sure' },
];

export const fitnessGoalOptions = [
	{ label: 'Weight loss', value: 'Weight loss' },
	{ label: 'Muscle building', value: 'Muscle building' },
	{ label: 'General fitness', value: 'General fitness' },
	{ label: 'Strength training', value: 'Strength training' },
	{ label: 'Endurance', value: 'Endurance' },
	{ label: 'Flexibility', value: 'Flexibility' },
	{ label: 'Athletic Performance', value: 'Athletic Performance' },
	{ label: 'Rehabilitation', value: 'Rehabilitation' },
];

export type WorkoutTimePreset = {
	id: string;
	label: string;
	hint?: string;
	value: string;
};

/** Preset id -> "startHour-endHour" (24h whole hours) for backend */
export const workoutTimePresets: WorkoutTimePreset[] = [
	{
		id: 'early',
		label: '10:00 AM – 2:00 PM',
		hint: 'Mon–Thu & Sat–Sun. Friday: gym opens 2:00 PM.',
		value: '10-14',
	},
	{
		id: 'mid',
		label: '2:00 PM – 6:00 PM',
		value: '14-18',
	},
	{
		id: 'late',
		label: '6:00 PM – 10:00 PM',
		value: '18-22',
	},
	{
		id: 'custom',
		label: 'Custom time',
		value: '',
	},
];
