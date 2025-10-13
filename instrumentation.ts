/**
 * Next.js Instrumentation
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * 
 * This file is used to run code at server startup
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeServer } = await import('./src/lib/serverInit');
    initializeServer();
  }
}
