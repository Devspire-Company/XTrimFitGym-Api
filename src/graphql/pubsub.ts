import { PubSub } from 'graphql-subscriptions';

const basePubSub = new PubSub();

// Create a wrapper that provides asyncIterator method
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
		const messageQueue: T[] = [];
		const resolvers: Array<(value: IteratorResult<T>) => void> = [];
		let isDone = false;
		const subscriptions: number[] = [];

		console.log(`[PubSub] 🔄 Creating asyncIterator for triggers:`, triggerArray);

		// Subscribe to all triggers
		triggerArray.forEach((trigger) => {
			const subId = basePubSub.subscribe(trigger, (payload: any) => {
				console.log(`[PubSub] 📨 Message received on trigger "${trigger}":`, JSON.stringify(payload, null, 2));
				console.log(`[PubSub] Current state: isDone=${isDone}, resolvers=${resolvers.length}, queue=${messageQueue.length}`);
				
				if (isDone) {
					console.log(`[PubSub] ⚠️ Iterator is done, ignoring message`);
					return;
				}
				
				// Process the payload - it should be the full payload object
				const processedPayload = payload;
				console.log(`[PubSub] Processing payload:`, JSON.stringify(processedPayload, null, 2));
				
				if (resolvers.length > 0) {
					const resolve = resolvers.shift()!;
					console.log(`[PubSub] ✅ Resolving pending promise (${resolvers.length} remaining)`);
					try {
						resolve({ done: false, value: processedPayload });
						console.log(`[PubSub] ✅ Promise resolved successfully`);
					} catch (error) {
						console.error(`[PubSub] ❌ Error resolving promise:`, error);
					}
				} else {
					console.log(`[PubSub] 📦 Queuing message (no pending resolvers, queue size: ${messageQueue.length})`);
					messageQueue.push(processedPayload);
					console.log(`[PubSub] ✅ Message queued (new queue size: ${messageQueue.length})`);
				}
			});
			if (subId) {
				subscriptions.push(subId);
				console.log(`[PubSub] ✅ Subscribed to "${trigger}" with ID: ${subId} (Total subscriptions: ${subscriptions.length})`);
			} else {
				console.error(`[PubSub] ❌ Failed to subscribe to "${trigger}" - subId is falsy`);
			}
		});

		return {
			[Symbol.asyncIterator]() {
				return this;
			},
			async next(): Promise<IteratorResult<T>> {
				console.log(`[PubSub] 🔄 next() called - isDone: ${isDone}, queue: ${messageQueue.length}, resolvers: ${resolvers.length}`);
				
				if (isDone) {
					console.log(`[PubSub] ⚠️ Iterator is done, returning done`);
					return { done: true, value: undefined };
				}

				// Always check queue first - messages might arrive before next() is called
				if (messageQueue.length > 0) {
					const value = messageQueue.shift()!;
					console.log(`[PubSub] ✅ Returning queued message (${messageQueue.length} remaining in queue):`, JSON.stringify(value, null, 2));
					return { done: false, value };
				}

				// Otherwise, wait for the next message
				console.log(`[PubSub] ⏳ Waiting for next message (${resolvers.length} pending resolvers, ${messageQueue.length} queued)`);
				return new Promise<IteratorResult<T>>((resolve) => {
					// Double-check queue after adding resolver (race condition protection)
					if (messageQueue.length > 0) {
						const value = messageQueue.shift()!;
						console.log(`[PubSub] ✅ Message arrived while waiting, returning immediately`);
						resolve({ done: false, value });
					} else {
						console.log(`[PubSub] 📝 Adding resolver to queue (total: ${resolvers.length + 1})`);
						resolvers.push(resolve);
					}
				});
			},
			async return(): Promise<IteratorResult<T>> {
				if (isDone) {
					return { done: true, value: undefined };
				}
				isDone = true;
				console.log(`[PubSub] 🛑 Cleaning up asyncIterator`);
				
				// Clean up subscriptions safely
				subscriptions.forEach((subId) => {
					try {
						if (subId && typeof subId === 'number') {
							basePubSub.unsubscribe(subId);
							console.log(`[PubSub] ✅ Unsubscribed ${subId}`);
						}
					} catch (error) {
						// Ignore errors during cleanup - subscription might already be removed
						console.warn(`[PubSub] ⚠️ Error unsubscribing ${subId}:`, error);
					}
				});
				subscriptions.length = 0; // Clear the array
				
				// Resolve any pending resolvers
				resolvers.forEach((resolve) => {
					resolve({ done: true, value: undefined });
				});
				resolvers.length = 0;
				
				return { done: true, value: undefined };
			},
		};
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

