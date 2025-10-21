# 🔒 Wallet Security & Trust

## Our Commitment to Security

We understand that connecting your wallet is a big decision. Here's how we protect you:

## 🔍 What We Can and Cannot Do

### ✅ What Our App CAN Do:
- **Read your wallet address** - To identify you and track your trading performance
- **Request your signature** - To verify you own the wallet (authentication only)
- **Read your token balances** - To check if you hold our competition token

### ❌ What Our App CANNOT Do:
- **Transfer your funds** - We NEVER request transaction approval for your assets
- **Access your private keys** - Your keys stay in your wallet (Phantom, Solflare, etc.)
- **Sign transactions on your behalf** - You must manually approve every action
- **Drain your wallet** - Impossible without your explicit approval for each transaction

## 🔐 Technical Security Measures

### 1. **Read-Only Operations**
Our wallet integration only uses **read-only** methods:
```typescript
// What we actually do:
wallet.publicKey.toString()  // ✅ Just reading your address
wallet.signMessage()          // ✅ Just signature for auth (no transaction)

// What we DON'T do:
wallet.signTransaction()      // ❌ Never used - can't move your funds
wallet.signAllTransactions()  // ❌ Never used - can't batch steal
```

### 2. **Signature-Based Authentication**
When you "connect" your wallet, we only ask for a **signature** to prove ownership:
```typescript
// The message you sign (you can read it in your wallet):
"Sign this message to authenticate with onlyPrinters.\n\nThis will NOT trigger a transaction or cost any gas.\n\nTimestamp: [current_time]"
```

**This signature:**
- ✅ Proves you own the wallet
- ✅ Costs zero gas fees
- ✅ Cannot move any funds
- ✅ Is completely safe

### 3. **No Transaction Requests**
Our app **NEVER** initiates transactions from your wallet. The only transactions are:
- Prize payments **TO** winners (from our dev wallet, not yours)
- You would see any malicious transaction in your wallet popup **before** approving

### 4. **Prize Distribution Transparency**
All prize distributions are:
- Visible on Solscan (blockchain explorer)
- From our documented dev wallet
- Verifiable by anyone
- Never touching your funds

## 🔎 How to Verify Our App is Safe

### Step 1: Check the Signature Message
When connecting, your wallet shows you the **exact message** you're signing:
- Read it carefully
- It should say "authenticate" and "will NOT trigger a transaction"
- It should NOT ask for token approval or transfer

### Step 2: Never Approve Unknown Transactions
If you see a popup asking to:
- "Approve token spend"
- "Transfer SOL/tokens"
- "Grant unlimited access"
- **REJECT IT** - Our app doesn't do this

### Step 3: Review Our Open Source Code
All our wallet integration code is public:
- GitHub: [your-repo-link]
- File: `src/contexts/WalletContext.tsx`
- You or any developer can audit it

### Step 4: Check Wallet Permissions
After connecting, check your wallet's "Connected Sites":
- Phantom: Settings → Trusted Apps
- We only have "view" permissions, never "approve" permissions

## 🏆 Industry Best Practices We Follow

### 1. **Standard Wallet Adapters**
We use official, audited libraries:
```json
{
  "@solana/wallet-adapter-react": "Official Solana wallet adapter",
  "@solana/wallet-adapter-phantom": "Official Phantom integration"
}
```

These are the **same libraries** used by:
- Magic Eden
- Jupiter
- Tensor
- Other major Solana apps

### 2. **No Custom Wallet Code**
We don't write custom wallet interaction code. We use battle-tested, community-audited libraries.

### 3. **Minimal Permissions**
We request the **absolute minimum** permissions needed:
- Read public key ✅
- Sign message for auth ✅
- That's it ✅

## 📊 What Data We Store

### In Our Database:
```javascript
{
  wallet: "shortened_address",      // e.g., "7v2x...a1ono"
  walletOriginal: "full_address",   // For prize distribution
  name: "your_chosen_username",
  avatar: "your_avatar_url"
}
```

### What We DON'T Store:
- ❌ Private keys
- ❌ Seed phrases
- ❌ Transaction signing authority
- ❌ Any sensitive data

## 🚨 Red Flags to Watch For (General Web3 Safety)

### 🚩 Malicious Apps Might:
1. **Ask for your seed phrase** - NEVER share this with ANY app
2. **Request unlimited token approval** - Always check spending limits
3. **Rush you to "claim" something** - Pressure tactics are scams
4. **Have suspicious URLs** - Always verify the domain
5. **Request access to sign transactions automatically** - Never approve this

### ✅ Our App:
1. **Never asks for seed phrase** - We don't need it
2. **Never requests token approvals** - We only read balances
3. **No urgency tactics** - Trade at your own pace
4. **Clear domain** - [your-domain.com]
5. **Manual approval only** - You control everything

## 🔗 Additional Resources

### Learn More About Wallet Security:
- [Solana Wallet Security Guide](https://docs.solana.com/wallet-guide/wallet-security)
- [Phantom Security Best Practices](https://phantom.app/learn/security)
- [How Wallet Adapters Work](https://github.com/solana-labs/wallet-adapter)

### Audit Our Code:
- GitHub Repository: [link](https://github.com/onlyprinters/op)
- Wallet Integration: `src/contexts/WalletContextProvider.tsx`
- API Endpoints: `src/app/api/`


## 💡 Pro Tips for Web3 Users

1. **Use a "Trading Wallet"**
   - Keep a separate wallet for competitions/trading
   - Store majority of funds in a cold wallet

2. **Always Read Wallet Popups**
   - Don't click "Approve" blindly
   - Understand what you're signing

3. **Check Transaction Details**
   - Verify recipient addresses
   - Check token amounts
   - Look for unusual permissions

4. **Enable Wallet Security Features**
   - Use hardware wallets for large amounts
   - Enable biometric locks
   - Set up transaction notifications

## 📞 Report Security Concerns

If you notice anything suspicious:
- Email: security@[onlyprinters.fun]
- Twitter DM: [@onlyprinters_]

We take security seriously and respond within 24 hours.

---

## Summary: Why You Can Trust Us

✅ **Read-only wallet integration** - Can't touch your funds
✅ **Signature-based auth only** - No transaction permissions
✅ **Open source code** - Anyone can audit
✅ **Standard libraries** - Same as major platforms
✅ **Transparent operations** - All on-chain, verifiable
✅ **No seed phrase requests** - Never needed, never asked
✅ **Community vetted** - Other traders verify our legitimacy

**Remember:** Your wallet stays in YOUR control. We only read your address and verify you own it. Nothing more.

---

*Last Updated: October 2025*
*Questions? Contact us anytime.*
