import React from 'react';
import { Calendar, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  activeView: 'daily' | 'monthly';
  onViewChange: (view: 'daily' | 'monthly') => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card shadow-spiritual rounded-full p-1 border border-border">
        <div className="flex gap-1">
          <Button
            variant={activeView === 'daily' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('daily')}
            className={`rounded-full px-4 py-2 transition-all duration-200 ${
              activeView === 'daily' 
                ? 'bg-gradient-spiritual text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-spiritual-light'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Daily Verses
          </Button>
          <Button
            variant={activeView === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('monthly')}
            className={`rounded-full px-4 py-2 transition-all duration-200 ${
              activeView === 'monthly' 
                ? 'bg-gradient-spiritual text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-spiritual-light'
            }`}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Monthly Planner
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;