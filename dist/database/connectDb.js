import mongoose from 'mongoose';
const mongoUri = process.env.DB_URI;
const connectDb = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('Database connected');
    }
    catch (error) {
        console.log(error);
    }
};
export default connectDb;
