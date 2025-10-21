import Link from 'next/link';

export const metadata = {
  title: 'Wallet Security | onlyPrinters',
  description: 'Learn how we protect your wallet and why connecting is safe',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Wallet is Safe with Us
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete transparency about how we handle wallet connections
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">👀</div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
              Read-Only
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We only read your wallet address. Cannot access funds or private keys.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">✍️</div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
              Signature Only
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Authentication via signature. Never requests transaction approval.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
              Open Source
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All code is public on GitHub. Anyone can audit our wallet integration.
            </p>
          </div>
        </div>

        {/* What We Can/Cannot Do */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            What Happens When You Connect?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* CAN DO */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✅</span>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                  What We CAN Do
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Read your address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">To identify you in the competition</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Request signature</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">To verify you own the wallet (costs $0)</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Check token balance</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">To verify competition entry requirement</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* CANNOT DO */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🚫</span>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                  What We CANNOT Do
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Transfer your funds</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Never request transaction approval</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Access private keys</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Keys stay in your wallet app</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Sign transactions</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">You must approve everything manually</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-gray-900 rounded-xl p-8 shadow-lg mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💻</span>
            <h2 className="text-2xl font-bold text-white">
              Actual Code We Use
            </h2>
          </div>
          <p className="text-gray-400 mb-4">
            This is the <span className="text-green-400 font-semibold">complete</span> code we use for wallet connection.
            Nothing hidden, nothing malicious.
          </p>
          <div className="bg-black rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              {`// What we actually do:
const publicKey = wallet.publicKey.toString();  // ✅ Read address
const signature = await wallet.signMessage(message);  // ✅ Auth only

// What we DON'T do (these lines don't exist in our code):
wallet.signTransaction();      // ❌ Never used
wallet.signAllTransactions();  // ❌ Never used
wallet.sendTransaction();      // ❌ Never used`}
            </pre>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <span>📁</span>
            <span>See full code: </span>
            <a
              href="https://github.com/onlyprinters/op/blob/main/src/contexts/WalletContextProvider.tsx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              WalletContext.tsx
            </a>
          </div>
        </div>

        {/* Industry Standards */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏆</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Industry Standard Libraries
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            We use the <span className="font-bold">exact same wallet libraries</span> as major Solana platforms:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Magic Eden</p>
              <code className="text-xs text-green-600 dark:text-green-400">@solana/wallet-adapter-react</code>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Jupiter Exchange</p>
              <code className="text-xs text-green-600 dark:text-green-400">@solana/wallet-adapter-react</code>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Tensor</p>
              <code className="text-xs text-green-600 dark:text-green-400">@solana/wallet-adapter-react</code>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">onlyPrinters (us!)</p>
              <code className="text-xs text-green-600 dark:text-green-400">@solana/wallet-adapter-react</code>
            </div>
          </div>
        </div>

        {/* How to Verify */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            How to Verify We&apos;re Safe (For Technical Users)
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Check the Signature Message</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-10">
                When connecting, your wallet shows the exact message you&apos;re signing.
                It says &quot;authenticate&quot; and &quot;will NOT trigger a transaction.&quot;
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Inspect Network Requests</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-10">
                Open DevTools → Network tab. You&apos;ll see we only send your public address to our API, never private keys.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Audit Our GitHub</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-10">
                Search our codebase for <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">signTransaction</code>.
                You won&apos;t find it—we don&apos;t use it.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</span>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Check Wallet Permissions</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-10">
                After connecting, check Phantom → Settings → Trusted Apps.
                We only have &quot;view&quot; permissions, never &quot;approve&quot; or &quot;spend.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8 border border-yellow-200 dark:border-yellow-800 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💡</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              General Web3 Safety Tips
            </h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-bold">Use a trading wallet</span> - Keep a separate wallet for competitions with smaller amounts
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-bold">Never share seed phrases</span> - No legitimate app ever needs your seed phrase
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-bold">Read wallet popups</span> - Always check what you&apos;re signing before approving
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-bold">Verify URLs</span> - Check you&apos;re on the real site (bookmark us!)
              </p>
            </li>
          </ul>
        </div>


        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Competition
          </Link>
        </div>
      </div>
    </div>
  );
}
