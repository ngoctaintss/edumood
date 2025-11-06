import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📋 Found collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Drop all collections
    console.log('\n🗑️  Dropping all collections...');
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`  ✅ Dropped: ${collection.name}`);
    }

    console.log('\n✅ Database cleaned successfully!');
    console.log('👉 Now run: npm run seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();