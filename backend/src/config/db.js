const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    console.log(`Attempting to connect to MongoDB at ${process.env.MONGO_URI}...`);
    // Try to connect to local/atlas MongoDB first
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.log(`Local MongoDB unavailable. Starting in-memory MongoDB...`,error);
    
    try {
      // Fallback to in-memory MongoDB with MD5 check disabled
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create({
        binary: {
          checkMD5: false
        }
      });
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`In-memory MongoDB Connected: ${mongoose.connection.host}`);
    } catch (memError) {
      console.error('Failed to start in-memory MongoDB:', memError.message);
      console.error('Please install MongoDB locally or provide a MongoDB Atlas URI in backend/.env');
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
