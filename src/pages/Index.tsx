import React, { useState } from 'react';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import MonthlyPlanner from '@/components/MonthlyPlanner';
import Navigation from '@/components/Navigation';

const Index = () => {
  const [activeView, setActiveView] = useState<'daily' | 'monthly'>('daily');

  return (
    <div className="min-h-screen">
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      <div className="pt-16">
        {activeView === 'daily' ? <DailyVerseCalendar /> : <MonthlyPlanner />}
      </div>
    </div>
  );
};

export default Index;
