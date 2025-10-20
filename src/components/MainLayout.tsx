'use client';

import Sidebar from './Sidebar';
import TraderLeaderboard from './TraderLeaderboard';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <>
      <div className="container mx-auto px-4 py-8 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - 1/5 on desktop, full width on mobile */}
          <div className="w-full lg:w-1/5">
            <Sidebar />
          </div>

          {/* Main Content - 4/5 on desktop, full width on mobile */}
          <div className="w-full lg:w-4/5">
            <TraderLeaderboard />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}