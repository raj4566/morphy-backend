const mongoose = require('mongoose');

const connectDB = async (retries = 3, delay = 2000) => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        const options = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
            connectTimeoutMS: 10000,
        };

        console.log('[MongoDB] Attempting to connect...');
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB connection error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Connection closed.');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed due to app termination');
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
            }
            process.exit(0);
        });

        return conn;

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        
        // Check if it's an IP whitelist error
        if (error.message.includes('authenticate') || error.message.includes('connect') || error.message.includes('ENOTFOUND')) {
            console.error('\n🔐 POSSIBLE SOLUTIONS:');
            console.error('1. IP Whitelist Issue: Make sure 0.0.0.0/0 is added to MongoDB Atlas Network Access');
            console.error('   - Go to: MongoDB Atlas > Your Cluster > Network Access > IP Whitelist');
            console.error('   - Add IP Address: 0.0.0.0/0 (allows all IPs for development/Vercel)');
            console.error('2. Environment Variables: Verify MONGODB_URI is correctly set in Vercel');
            console.error('3. Connection String: Ensure the URI format is correct (mongodb+srv://...)');
            console.error('\n');
        }

        if (retries > 0) {
            console.log(`Retrying in ${delay / 1000} seconds... (${retries} retries left)\n`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectDB(retries - 1, delay);
        }

        console.error('❌ Failed to connect to MongoDB after all retries');
        console.error('Note: Server will continue running but database operations will fail until connection is restored.');
        return null;
    }
};

module.exports = connectDB;
