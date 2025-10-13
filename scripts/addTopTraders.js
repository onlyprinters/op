/**
 * Script to add top traders to the database
 * Creates User entries and DailyTrader entries for the current season
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const MONGO_URI = envVars.MONGO;

// Top traders data
const traders = [
    { wallet: "HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt", name: "FIGOAT" },
    { wallet: "HrCPnDvDgbpbFxKxer6Pw3qEcfAQQNNjb6aJNFWgTEng", name: "0xWinged" },
    { wallet: "DsqRyTUh1R37asYcVf1KdX4CNnz5DKEFmnXvgT4NfTPE", name: "Classic" },
    { wallet: "C4BWYccLsbeHgZzVupFZJGvJK2nQpn8em9WtzURH4gZW", name: "Obijai" },
    { wallet: "2BU3NAzgRA2gg2MpzwwXpA8X4CCRaLgrf6TY1FKfJPX2", name: "Issa" },
    { wallet: "4uTeAz9TmZ1J5bNkgGLvqAELvCHJwLZgo7Hxar2KAiyu", name: "Monarch" },
    { wallet: "EgzjRCbcdRiPc1bW52tcvGDnKDbQWCzQbUhDBszD2BZm", name: "Rev" },
    { wallet: "BPWsae36tY6oFz7f5MjsfTGqzi3ttM1AsAtjMvUb91tT", name: "Rizz" },
    { wallet: "HtvLcCFehifb7G4j42JDn53zD7sQRiELF5WHzJzNvWMm", name: "Polly" },
    { wallet: "7dP8DmRka5rmQti4zEEDjdAyaQyvFsPkcXMjEKJucqCu", name: "JB" },
    { wallet: "A6fVPXt9bqon1LQoJi4HQ5xkhavLKEo77N5CZef2jpmR", name: "Carti The Menace" },
    { wallet: "5AyJw1VNDgTho2chipbVmuGqTuX1fCvVkLneChQkQrw8", name: "Bolivian" },
    { wallet: "Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ", name: "Heyitsyolo" },
    { wallet: "DpNVrtA3ERfKzX4F8Pi2CVykdJJjoNxyY5QgoytAwD26", name: "Gorilla Capital" },
    { wallet: "4S8YBCt6hhi7Nr1NnKF6jF856LLN8JJFzD1a8nF5UuHA", name: "shaka" },
    { wallet: "831yhv67QpKqLBJjbmw2xoDUeeFHGUx8RnuRj9imeoEs", name: "Trey" },
    { wallet: "sAdNbe1cKNMDqDsa4npB3TfL62T14uAo2MsUQfLvzLT", name: "Ethan Prosper" },
    { wallet: "5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X", name: "bandit" },
    { wallet: "8FaNi7XawZVC17sci13dHi2NeyNTQgjZyrBxwgyMEfj1", name: "Midjet" },
    { wallet: "DYAn4XpAkN5mhiXkRB7dGq4Jadnx6XYgu8L5b3WGhbrt", name: "The Doc" },
    { wallet: "5B52w1ZW9tuwUduueP5J7HXz5AcGfruGoX6YoAudvyxG", name: "Yenni" },
];

// Avatar images pool
const avatars = [
    '/1.png', '/2.png', '/3.png', '/4.png', '/5.png',
    '/6.png', '/7.png', '/8.png', '/9.png', '/10.png'
];

// User Schema
const UserSchema = new mongoose.Schema({
    wallet: { type: String, required: true, unique: true, lowercase: true },
    walletOriginal: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// DailyTrader Schema
const DailyTraderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wallet: { type: String, required: true, lowercase: true },
    seasonId: { type: String, required: true },
    tokenBalance: { type: Number, default: 0 },
    availableBalanceSol: { type: Number, default: 0 },
    totalPnl: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    buyCount: { type: Number, default: 0 },
    sellCount: { type: Number, default: 0 },
    realizedUsdPnl: { type: Number, default: 0 },
    realizedSolPnl: { type: Number, default: 0 },
    realizedUsdBought: { type: Number, default: 0 },
    realizedUsdSold: { type: Number, default: 0 },
    usdBought: { type: Number, default: 0 },
    usdSold: { type: Number, default: 0 },
    solBought: { type: Number, default: 0 },
    solSold: { type: Number, default: 0 },
    realizedSolBought: { type: Number, default: 0 },
    realizedSolSold: { type: Number, default: 0 },
    pnlBreakdown: {
        over500Percent: { type: Number, default: 0 },
        between200And500Percent: { type: Number, default: 0 },
        between0And200Percent: { type: Number, default: 0 },
        between0AndNeg50Percent: { type: Number, default: 0 },
        underNeg50Percent: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const DailyTrader = mongoose.models.DailyTrader || mongoose.model('DailyTrader', DailyTraderSchema);

// Get current season ID (format: YYYY-MM-DD)
function getCurrentSeasonId() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function addTopTraders() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            dbName: 'OP',
        });
        console.log('✅ Connected to MongoDB\n');

        const seasonId = getCurrentSeasonId();
        console.log(`📅 Current season: ${seasonId}\n`);

        let usersAdded = 0;
        let tradersAdded = 0;
        let usersSkipped = 0;
        let tradersSkipped = 0;

        for (let i = 0; i < traders.length; i++) {
            const { wallet, name } = traders[i];
            const walletLower = wallet.toLowerCase();
            const avatar = avatars[i % avatars.length]; // Rotate through avatars

            console.log(`\n👤 Processing: ${name} (${wallet.substring(0, 8)}...)`);

            // 1. Check if user exists
            let user = await User.findOne({ wallet: walletLower });

            if (!user) {
                // Create new user
                user = await User.create({
                    wallet: walletLower,
                    walletOriginal: wallet, // Keep original case
                    name: name,
                    avatar: avatar,
                });
                console.log(`   ✅ User created with avatar: ${avatar}`);
                usersAdded++;
            } else {
                console.log(`   ⏭️  User already exists (ID: ${user._id})`);
                usersSkipped++;
            }

            // 2. Check if DailyTrader entry exists for this season
            const existingTrader = await DailyTrader.findOne({
                userId: user._id,
                seasonId: seasonId,
            });

            if (!existingTrader) {
                // Create DailyTrader entry
                await DailyTrader.create({
                    userId: user._id,
                    wallet: walletLower,
                    seasonId: seasonId,
                    isActive: true,
                });
                console.log(`   ✅ DailyTrader entry created for season ${seasonId}`);
                tradersAdded++;
            } else {
                console.log(`   ⏭️  DailyTrader entry already exists for this season`);
                tradersSkipped++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary:');
        console.log(`   Users added: ${usersAdded}`);
        console.log(`   Users skipped (already exist): ${usersSkipped}`);
        console.log(`   DailyTrader entries added: ${tradersAdded}`);
        console.log(`   DailyTrader entries skipped: ${tradersSkipped}`);
        console.log('='.repeat(60));
        console.log('\n✅ Script completed successfully!');
        console.log('💡 Stats will be updated automatically by the cron job (every 10 minutes)');
        console.log('💡 Or manually call: POST /api/daily-traders/update-stats\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the script
addTopTraders();
