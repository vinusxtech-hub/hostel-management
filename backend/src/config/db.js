const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    console.log(`Attempting to connect to MongoDB at ${process.env.MONGO_URI}...`);
    // Try to connect to local/atlas MongoDB first
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    const uri = process.env.MONGO_URI || '';
    const isAtlas = uri.includes('mongodb.net') || uri.includes('replicaSet');
    
    if (isAtlas) {
      console.error('\n========================================================================');
      console.error('DATABASE CONNECTION ERROR: Failed to connect to MongoDB Atlas!');
      console.error(error.message || error);
      console.error('========================================================================');
      
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
        console.warn('\n⚠️  WARNING: ALLOW_IN_MEMORY_FALLBACK is enabled.');
        console.warn('⚠️  Falling back to an in-memory MongoDB server.');
        console.warn('⚠️  Your data will NOT be saved to MongoDB Atlas and will be lost on exit!');
        console.warn('========================================================================\n');
      } else {
        console.error('The application is configured to use Atlas but cannot establish a connection.');
        console.error('Please check:');
        console.error('1. Is your current IP address whitelisted in your MongoDB Atlas console?');
        console.error('2. Are your database username/password correct in the .env file?');
        console.error('3. Is your internet connection active and not blocking port 27017?');
        console.error('If you want to fall back to an in-memory DB for local testing, set ALLOW_IN_MEMORY_FALLBACK=true in your .env file.');
        console.error('========================================================================\n');
        process.exit(1);
      }
    } else {
      console.log(`Local MongoDB connection failed. Starting in-memory MongoDB fallback...`);
    }

    try {
      // Fallback to in-memory MongoDB with MD5 check disabled and a lighter version (6.0.14) to avoid downloading large 8.x binaries (780MB+)
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '6.0.14',
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
