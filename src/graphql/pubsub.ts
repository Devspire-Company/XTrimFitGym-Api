// @ts-nocheck
import { PubSub } from 'graphql-subscriptions';

const basePubSub = new PubSub();

// Wrapper: keep publish logging. Subscriptions use the library's asyncIterableIterator,
// which is correct for graphql-subscriptions v3 (async subscribe() → Promise<number>).
// This does not touch MySQL, iVMS, or HTTP queries — only in-process Pub/Sub for GraphQL subscriptions.
export const pubsub = {
	publish: (triggerName: string, payload: any) => {
		console.log(`[PubSub] 📢 Publishing to "${triggerName}":`, JSON.stringify(payload, null, 2));
		try {
			const result = basePubSub.publish(triggerName, payload);
			console.log(`[PubSub] ✅ Published successfully to "${triggerName}"`);
			return result;
		} catch (error) {
			console.error(`[PubSub] ❌ Error publishing to "${triggerName}":`, error);
			throw error;
		}
	},
	subscribe: (triggerName: string, onMessage: (...args: any[]) => void) => {
		return basePubSub.subscribe(triggerName, onMessage);
	},
	unsubscribe: (subId: number) => {
		return basePubSub.unsubscribe(subId);
	},
	asyncIterator: <T>(triggers: string | string[]): AsyncIterableIterator<T> => {
		const triggerArray = Array.isArray(triggers) ? triggers : [triggers];
		console.log(`[PubSub] asyncIterator (graphql-subscriptions v3) for:`, triggerArray);
		return basePubSub.asyncIterableIterator(triggerArray);
	},
};

// Event names
export const EVENTS = {
	REVENUE_SUMMARY_UPDATED: 'REVENUE_SUMMARY_UPDATED',
	USERS_UPDATED: 'USERS_UPDATED',
	MEMBERSHIPS_UPDATED: 'MEMBERSHIPS_UPDATED',
	ATTENDANCE_RECORD_ADDED: 'ATTENDANCE_RECORD_ADDED',
	ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED',
	_EMPTY: '_EMPTY', // Placeholder event for base Subscription type
} as const;
