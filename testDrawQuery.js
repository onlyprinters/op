/**
 * Test script to check draw query for top 3 traders
 * Run with: node testDrawQuery.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGO_URI = process.env.MONGO;

// Season ID (YYYY-MM-DD format in UTC)
function getCurrentSeasonId() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// DailyTrader Schema (simplified)
const DailyTraderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wallet: String,
  seasonId: String,
  tokenBalance: Number,
  isActive: Boolean,
  soldPrint: Boolean,
  realizedUsdPnl: Number,
  realizedSolPnl: Number,
  totalTrades: Number,
  lastTokenCheck: Date,
}, { timestamps: true });

const DailyTrader = mongoose.models.DailyTrader || mongoose.model('DailyTrader', DailyTraderSchema);

// User Schema (simplified)
const UserSchema = new mongoose.Schema({
  wallet: String,
  walletOriginal: String,
  name: String,
  avatar: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function testDrawQuery() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      dbName: 'OP',
    });
    console.log('✅ Connected to MongoDB (database: OP)\n');

    let seasonId = getCurrentSeasonId();
    console.log(`📅 Current Season ID: ${seasonId}\n`);

    // First, check what's in the database
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DATABASE CHECK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const totalTraders = await DailyTrader.countDocuments({});
    console.log(`Total DailyTrader documents in DB: ${totalTraders}`);
    
    if (totalTraders > 0) {
      const allSeasons = await DailyTrader.distinct('seasonId');
      console.log(`Seasons found: ${allSeasons.join(', ')}`);
      
      const activeCount = await DailyTrader.countDocuments({ isActive: true });
      const inactiveCount = await DailyTrader.countDocuments({ isActive: false });
      console.log(`Active traders (all seasons): ${activeCount}`);
      console.log(`Inactive traders (all seasons): ${inactiveCount}`);
      
      const currentSeasonCount = await DailyTrader.countDocuments({ seasonId });
      console.log(`Traders in current season (${seasonId}): ${currentSeasonCount}`);
      
      if (currentSeasonCount === 0 && allSeasons.length > 0) {
        console.log('\n⚠️  No traders in current season. Showing latest season instead...');
        const latestSeason = allSeasons.sort().reverse()[0];
        console.log(`Latest season: ${latestSeason}\n`);
        // Update seasonId to latest for queries below
        seasonId = latestSeason;
      }
    } else {
      console.log('⚠️  No DailyTrader documents found in database!\n');
      await mongoose.connection.close();
      console.log('🔌 Disconnected from MongoDB');
      return;
    }
    console.log('');

    // Query 1: ALL active traders (including soldPrint=true)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Query 1: ALL ACTIVE TRADERS (no soldPrint filter)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const allTraders = await DailyTrader.find({
      seasonId,
      isActive: true,
    })
      .populate('userId', 'name avatar wallet walletOriginal')
      .sort({ realizedUsdPnl: -1 })
      .limit(10)
      .lean();

    console.log(`Found ${allTraders.length} traders:\n`);
    allTraders.forEach((trader, index) => {
      const user = trader.userId;
      console.log(`  #${index + 1}: ${user?.name || 'Unknown'}`);
      console.log(`      Wallet: ${user?.walletOriginal?.substring(0, 8)}...`);
      console.log(`      PNL: $${trader.realizedUsdPnl?.toFixed(2) || 0}`);
      console.log(`      soldPrint: ${trader.soldPrint === true ? '🚫 TRUE (DQ)' : '✅ FALSE'}`);
      console.log('');
    });

    // Query 2: Using $ne: true
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Query 2: EXCLUDING soldPrint=true (using $ne)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const tradersNe = await DailyTrader.find({
      seasonId,
      isActive: true,
      soldPrint: { $ne: true },
    })
      .populate('userId', 'name avatar wallet walletOriginal')
      .sort({ realizedUsdPnl: -1 })
      .limit(3)
      .lean();

    console.log(`Found ${tradersNe.length} traders:\n`);
    tradersNe.forEach((trader, index) => {
      const user = trader.userId;
      console.log(`  #${index + 1}: ${user?.name || 'Unknown'}`);
      console.log(`      Wallet: ${user?.walletOriginal?.substring(0, 8)}...`);
      console.log(`      PNL: $${trader.realizedUsdPnl?.toFixed(2) || 0}`);
      console.log(`      soldPrint: ${trader.soldPrint === true ? '🚫 TRUE (DQ)' : '✅ FALSE'}`);
      console.log('');
    });

    // Query 3: Using $or with explicit conditions
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Query 3: EXCLUDING soldPrint=true (using $or)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const tradersOr = await DailyTrader.find({
      seasonId,
      isActive: true,
      $or: [
        { soldPrint: false },
        { soldPrint: { $exists: false } },
        { soldPrint: null }
      ]
    })
      .populate('userId', 'name avatar wallet walletOriginal')
      .sort({ realizedUsdPnl: -1 })
      .limit(3)
      .lean();

    console.log(`Found ${tradersOr.length} traders:\n`);
    tradersOr.forEach((trader, index) => {
      const user = trader.userId;
      console.log(`  #${index + 1}: ${user?.name || 'Unknown'}`);
      console.log(`      Wallet: ${user?.walletOriginal?.substring(0, 8)}...`);
      console.log(`      PNL: $${trader.realizedUsdPnl?.toFixed(2) || 0}`);
      console.log(`      soldPrint: ${trader.soldPrint === true ? '🚫 TRUE (DQ)' : '✅ FALSE'}`);
      console.log('');
    });

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total active traders: ${allTraders.length}`);
    console.log(`Valid traders ($ne query): ${tradersNe.length}`);
    console.log(`Valid traders ($or query): ${tradersOr.length}`);
    console.log('');

    // Check if any DQ traders are in top 3
    const top3 = allTraders.slice(0, 3);
    const dqInTop3 = top3.filter(t => t.soldPrint === true);
    if (dqInTop3.length > 0) {
      console.log('⚠️  WARNING: Disqualified traders found in top 3:');
      dqInTop3.forEach(trader => {
        const user = trader.userId;
        console.log(`   - ${user?.name} (${user?.walletOriginal?.substring(0, 8)}...) - PNL: $${trader.realizedUsdPnl?.toFixed(2)}`);
      });
    } else {
      console.log('✅ No disqualified traders in top 3');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDrawQuery();
