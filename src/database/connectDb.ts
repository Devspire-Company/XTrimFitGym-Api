import mongoose from 'mongoose';

const mongoUri = process.env.DB_URI;

const connectDb = async () => {
	try {
		if (!mongoUri || !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
			throw new Error(
				'DB_URI is missing or invalid. Set a valid Mongo connection string in backend .env.'
			);
		}
		await mongoose.connect(mongoUri!);
		console.log('Database connected');
	} catch (error) {
		console.error('[connectDb] Failed to connect MongoDB:', error);
		throw error;
	}
};

export default connectDb;
