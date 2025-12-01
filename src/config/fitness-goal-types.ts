/**
 * Predefined fitness goal types
 * These values can be managed (added, edited, deleted) in the future
 * Currently used for:
 * - Member's fitnessGoal
 * - Coach's specialization
 * - Goal's goalType
 */
export const FITNESS_GOAL_TYPES = [
	'Weight loss',
	'Muscle building',
	'General fitness',
	'Strength training',
	'Endurance',
	'Flexibility',
	'Rehabilitation',
	'Athletic Performance',
] as const;

/**
 * Get all predefined fitness goal types
 * @returns Array of fitness goal type strings
 */
export function getFitnessGoalTypes(): string[] {
	return [...FITNESS_GOAL_TYPES];
}

/**
 * Check if a fitness goal type is valid (exists in predefined list)
 * @param goalType - The fitness goal type to validate
 * @returns true if valid, false otherwise
 */
export function isValidFitnessGoalType(goalType: string): boolean {
	return FITNESS_GOAL_TYPES.includes(goalType as any);
}

