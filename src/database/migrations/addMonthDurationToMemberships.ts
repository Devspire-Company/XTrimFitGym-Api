import mongoose from 'mongoose';
import Membership from '../models/membership/membership-shema.js';
import connectDb from '../connectDb.js';

/**
 * Migration script to add monthDuration to existing memberships
 * This sets monthDuration based on durationType:
 * - Monthly: 1 month
 * - Quarterly: 3 months
 * - Yearly: 12 months
 */
async function addMonthDurationToMemberships() {
	try {
		console.log('🔗 Connecting to database...');
		await connectDb();

		console.log('🔄 Updating existing memberships with monthDuration...');
		
		// Get all memberships that don't have monthDuration or have null/undefined
		const memberships = await Membership.find({
			$or: [
				{ monthDuration: { $exists: false } },
				{ monthDuration: null },
				{ monthDuration: undefined },
			],
		});

		console.log(`📊 Found ${memberships.length} memberships to update`);

		let updated = 0;
		for (const membership of memberships) {
			// Set monthDuration based on durationType
			let monthDuration = 1; // default
			
			if (membership.durationType === 'Monthly') {
				monthDuration = 1;
			} else if (membership.durationType === 'Quarterly') {
				monthDuration = 3;
			} else if (membership.durationType === 'Yearly') {
				monthDuration = 12;
			}

			await Membership.findByIdAndUpdate(membership._id, {
				monthDuration,
			});

			console.log(
				`✅ Updated: ${membership.name} - ${membership.durationType} -> ${monthDuration} month(s)`
			);
			updated++;
		}

		// Also update any memberships with invalid monthDuration (less than 1)
		const invalidMemberships = await Membership.find({
			monthDuration: { $lt: 1 },
		});

		for (const membership of invalidMemberships) {
			let monthDuration = 1;
			
			if (membership.durationType === 'Monthly') {
				monthDuration = 1;
			} else if (membership.durationType === 'Quarterly') {
				monthDuration = 3;
			} else if (membership.durationType === 'Yearly') {
				monthDuration = 12;
			}

			await Membership.findByIdAndUpdate(membership._id, {
				monthDuration,
			});

			console.log(
				`✅ Fixed invalid monthDuration: ${membership.name} -> ${monthDuration} month(s)`
			);
			updated++;
		}

		console.log(`\n✅ Migration completed! Updated ${updated} membership(s)`);
		
		process.exit(0);
	} catch (error) {
		console.error('❌ Error running migration:', error);
		process.exit(1);
	}
}

// Run migration if called directly
addMonthDurationToMemberships();

export default addMonthDurationToMemberships;

