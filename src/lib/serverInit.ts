/**
 * Server initialization
 * Initialize cron jobs and other server-side tasks
 */

import { initializeCronJobs } from '@/lib/cronJobs';

let isInitialized = false;
let cronJobs: ReturnType<typeof initializeCronJobs> | null = null;

/**
 * Initialize server-side tasks
 * This should be called once when the server starts
 */
export function initializeServer() {
  if (isInitialized) {
    console.log('⏭️  Server already initialized, skipping...');
    return cronJobs;
  }

  console.log('🚀 Initializing server...');
  
  try {
    // Initialize cron jobs
    cronJobs = initializeCronJobs();
    
    isInitialized = true;
    console.log('✅ Server initialized successfully');
    
    return cronJobs;
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownServer() {
  if (!isInitialized || !cronJobs) {
    return;
  }

  console.log('🛑 Shutting down server...');
  
  try {
    const { stopCronJobs } = await import('@/lib/cronJobs');
    stopCronJobs(cronJobs);
    
    isInitialized = false;
    cronJobs = null;
    
    console.log('✅ Server shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownServer);
  process.on('SIGINT', shutdownServer);
}
