# onlyPrinters Project Instructions

This is a Next.js full-stack application for printer management.

## Project Setup
- Framework: Next.js 14+ with TypeScript
- Frontend: React components with modern UI
- Backend: Next.js API routes
- Database: Ready for integration
- Styling: Tailwind CSS

## Development Guidelines
- Use TypeScript for all components and API routes
- Follow Next.js 14+ app router structure
- Implement responsive design principles
- Use proper error handling in API routes
- Follow React best practices

## Project Structure
- `/app` - Next.js app router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utility functions and configurations
- `/types` - TypeScript type definitions
- `/public` - Static assets

## Current Status
✅ Project setup completed successfully!
✅ Next.js with TypeScript and Tailwind CSS configured
✅ Solana wallet integration with Phantom
✅ MongoDB database with User and DailyTrader models
✅ Token-gated competition system (SPL Token verification)
✅ 24-hour season system (00:00 UTC midnight resets)
✅ Automated cron jobs (updates stats every 10 minutes)
✅ Leaderboard with real-time trader statistics

Ready for development! Run `npm run dev` to start the application.

## Key Features
- **Wallet Authentication**: Phantom wallet with signature verification
- **Trading Competition**: 24h seasons with real Solana trading data
- **Axiom Integration**: Fetches portfolio metrics (PNL, trades, volume)
- **Automated Updates**: Cron jobs update trader stats every 10 minutes
- **Leaderboard**: Ranks traders by realized PNL with detailed breakdowns
- **Season Statistics**: Real-time aggregated stats (active traders, volume, trades)