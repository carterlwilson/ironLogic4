import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prompt user for input
 */
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Mask password in MongoDB URI for safe logging
 */
function maskPassword(uri: string): string {
  return uri.replace(/:([^@]+)@/, ':****@');
}

/**
 * Main sync function
 */
async function syncProdData() {
  console.log('\n🔄 MongoDB Production Data Sync Tool\n');

  // 1. Load and validate environment variables
  const prodUri = process.env.MONGODB_PROD_URI;
  const localUri = process.env.MONGODB_URI;

  if (!prodUri) {
    console.error('❌ Error: MONGODB_PROD_URI not found in environment variables');
    console.log('\nTo fix this:');
    console.log('1. Go to MongoDB Atlas → Database → Connect → Drivers');
    console.log('2. Copy the connection string');
    console.log('3. Add to packages/server/.env as: MONGODB_PROD_URI=<your-connection-string>');
    console.log('4. Replace <password> with your actual password\n');
    process.exit(1);
  }

  if (!localUri) {
    console.error('❌ Error: MONGODB_URI not found in environment variables');
    console.log('\nAdd to packages/server/.env as: MONGODB_URI=mongodb://localhost:27017/ironlogic4\n');
    process.exit(1);
  }

  // 2. Validate URIs are different
  if (prodUri === localUri) {
    console.error('❌ Error: Production and local URIs are the same!');
    console.log('   This would sync the database to itself.');
    console.log('   Please check your .env file.\n');
    process.exit(1);
  }

  // 3. Validate production URI is MongoDB Atlas
  const isAtlas = prodUri.includes('mongodb.net') || prodUri.includes('mongodb+srv');
  if (!isAtlas) {
    console.warn('⚠️  Warning: Production URI does not appear to be MongoDB Atlas');
    console.log(`   Production URI: ${maskPassword(prodUri)}`);
    const proceed = await promptUser('   Continue anyway? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('❌ Sync cancelled\n');
      process.exit(0);
    }
  }

  console.log('📡 Connecting to databases...\n');
  console.log(`   Production: ${maskPassword(prodUri)}`);
  console.log(`   Local:      ${maskPassword(localUri)}\n`);

  let prodConnection: mongoose.Connection | null = null;
  let localConnection: mongoose.Connection | null = null;
  let backupDir: string = '';

  try {
    // 4. Connect to production (read-only)
    prodConnection = await mongoose.createConnection(prodUri).asPromise();
    console.log('✓ Connected to production (MongoDB Atlas)');

    // 5. Connect to local
    localConnection = await mongoose.createConnection(localUri).asPromise();
    console.log('✓ Connected to local database\n');

    // 6. Get collection names and counts
    if (!prodConnection.db) {
      throw new Error('Production database connection failed');
    }
    if (!localConnection.db) {
      throw new Error('Local database connection failed');
    }

    const collectionsInfo = await prodConnection.db.listCollections().toArray();

    // Calculate total documents and get counts per collection
    const collectionCounts: { name: string; count: number }[] = [];
    let totalDocs = 0;

    for (const colInfo of collectionsInfo) {
      const count = await prodConnection.db.collection(colInfo.name).countDocuments();
      collectionCounts.push({ name: colInfo.name, count });
      totalDocs += count;
    }

    // 7. Show preview
    console.log('📊 Production database contains:');
    console.log(`   - ${collectionsInfo.length} collections`);
    console.log(`   - ${totalDocs.toLocaleString()} total documents\n`);

    console.log('   Collections:');
    for (const col of collectionCounts) {
      console.log(`   - ${col.name}: ${col.count.toLocaleString()} documents`);
    }
    console.log('');

    // 8. Confirm with user
    console.log('⚠️  WARNING: This will DELETE all local data and replace it with production data.');
    const answer = await promptUser('   Continue? (y/N): ');

    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Sync cancelled\n');
      await cleanup(prodConnection, localConnection);
      return;
    }

    // 9. Create backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    backupDir = path.join(__dirname, '..', 'backups', timestamp);
    fs.mkdirSync(backupDir, { recursive: true });

    console.log(`\n💾 Creating backup at ./backups/${timestamp}/`);

    // 10. Backup local data
    for (const colInfo of collectionsInfo) {
      try {
        const docs = await localConnection.db.collection(colInfo.name).find({}).toArray();
        const filePath = path.join(backupDir, `${colInfo.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
        console.log(`   ✓ ${colInfo.name} (${docs.length.toLocaleString()} documents backed up)`);
      } catch (err) {
        // Collection might not exist in local, skip
        console.log(`   - ${colInfo.name} (collection not found in local, skipping backup)`);
      }
    }

    // 11. Drop local collections
    console.log('\n🗑️  Clearing local database...');
    for (const colInfo of collectionsInfo) {
      try {
        await localConnection.db.collection(colInfo.name).drop();
        console.log(`   ✓ Dropped ${colInfo.name}`);
      } catch (err) {
        // Collection might not exist, that's fine
      }
    }

    // 12. Copy from production to local
    console.log('\n📥 Syncing from production...');
    let syncedDocs = 0;

    for (const col of collectionCounts) {
      const docs = await prodConnection.db.collection(col.name).find({}).toArray();

      if (docs.length > 0) {
        await localConnection.db.collection(col.name).insertMany(docs, { ordered: false });
        syncedDocs += docs.length;
        console.log(`   ✓ ${col.name} (${docs.length.toLocaleString()}/${col.count.toLocaleString()} documents)`);
      } else {
        console.log(`   - ${col.name} (empty collection)`);
      }
    }

    // 13. Verify counts
    console.log('\n✅ Sync complete!');
    console.log(`   Backup saved to: ./backups/${timestamp}/`);
    console.log(`   Total synced: ${syncedDocs.toLocaleString()} documents across ${collectionsInfo.length} collections\n`);

    await cleanup(prodConnection, localConnection);

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);

    if (backupDir && fs.existsSync(backupDir)) {
      console.log(`💾 Local backup preserved at: ${backupDir}`);
      console.log('   You can manually restore from this backup if needed\n');
    }

    if (prodConnection) await prodConnection.close().catch(() => {});
    if (localConnection) await localConnection.close().catch(() => {});

    process.exit(1);
  }
}

/**
 * Cleanup connections
 */
async function cleanup(prodConnection: mongoose.Connection | null, localConnection: mongoose.Connection | null) {
  if (prodConnection) {
    await prodConnection.close();
  }
  if (localConnection) {
    await localConnection.close();
  }
}

// Run the sync
syncProdData();
