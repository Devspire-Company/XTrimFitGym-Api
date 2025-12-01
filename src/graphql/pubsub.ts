import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

// Event names
export const EVENTS = {
	REVENUE_SUMMARY_UPDATED: 'REVENUE_SUMMARY_UPDATED',
	USERS_UPDATED: 'USERS_UPDATED',
	MEMBERSHIPS_UPDATED: 'MEMBERSHIPS_UPDATED',
	_EMPTY: '_EMPTY', // Placeholder event for base Subscription type
} as const;

