import mongoose from 'mongoose';
import connectDb from '../connectDb.js';

async function run() {
	await connectDb();
	const col = mongoose.connection.collection('equipments');
	const r = await col.updateMany(
		{ $or: [{ status: { $exists: false } }, { status: null }] },
		{ $set: { status: 'AVAILABLE' } }
	);
	console.log(`Equipment status migration: matched ${r.matchedCount}, modified ${r.modifiedCount}`);
	await mongoose.disconnect();
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
