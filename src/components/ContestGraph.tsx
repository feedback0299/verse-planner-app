import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Participant {
  name: string;
  joinDate: string;
}

interface ContestGraphProps {
  startDate: string;
  participants: Participant[];
}

const ContestGraph: React.FC<ContestGraphProps> = ({ startDate, participants }) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Generate 70 days from start date
  const generateDays = () => {
    const days: Date[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 70; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const days = generateDays();

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Add empty cells for the first week if it doesn't start on Sunday
  const firstDayOfWeek = days[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null as any);
  }

  days.forEach((day, index) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7 || index === days.length - 1) {
      // Fill remaining cells in the last week
      while (currentWeek.length < 7) {
        currentWeek.push(null as any);
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Count participants per day
  const getParticipantsForDate = (date: Date | null): Participant[] => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return participants.filter(p => p.joinDate === dateStr);
  };

  // Get color intensity based on participant count
  const getCellColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-blue-200 dark:bg-blue-900';
    if (count <= 3) return 'bg-blue-400 dark:bg-blue-700';
    return 'bg-blue-600 dark:bg-blue-500';
  };

  // Get month labels
  const getMonthLabels = () => {
    const months: { name: string; offset: number }[] = [];
    let lastMonth = -1;
    
    days.forEach((day, index) => {
      const month = day.getMonth();
      if (month !== lastMonth) {
        const weekIndex = Math.floor((index + firstDayOfWeek) / 7);
        months.push({
          name: day.toLocaleDateString('en-US', { month: 'short' }),
          offset: weekIndex
        });
        lastMonth = month;
      }
    });
    
    return months;
  };

  const monthLabels = getMonthLabels();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleCellHover = (date: Date | null, event: React.MouseEvent) => {
    if (!date) {
      setHoveredCell(null);
      return;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    setHoveredCell(dateStr);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <Card className="shadow-card border-0 mb-6">
      <CardHeader>
        <CardTitle className="text-2xl text-spiritual-blue">
          70 Days Reading Competition - Participant Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Track participants joining the reading competition day by day
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            <div className="flex mb-2" style={{ marginLeft: '60px' }}>
              {monthLabels.map((month, idx) => (
                <div
                  key={idx}
                  className="text-xs text-muted-foreground font-medium"
                  style={{ 
                    marginLeft: idx === 0 ? '0' : `${(month.offset - (monthLabels[idx - 1]?.offset || 0)) * 16}px`,
                    minWidth: '40px'
                  }}
                >
                  {month.name}
                </div>
              ))}
            </div>

            {/* Graph grid */}
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-2">
                {dayLabels.map((day, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-muted-foreground h-3 flex items-center"
                    style={{ minWidth: '50px' }}
                  >
                    {idx % 2 === 1 ? day : ''}
                  </div>
                ))}
              </div>

              {/* Contribution cells */}
              <div className="flex gap-1">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {week.map((day, dayIdx) => {
                      const participantsOnDay = getParticipantsForDate(day);
                      const count = participantsOnDay.length;
                      const dateStr = day ? day.toISOString().split('T')[0] : '';
                      const isHovered = hoveredCell === dateStr;

                      return (
                        <div
                          key={dayIdx}
                          className={`
                            w-3 h-3 rounded-sm transition-all duration-200
                            ${day ? getCellColor(count) : 'bg-transparent'}
                            ${isHovered ? 'ring-2 ring-spiritual-gold scale-125' : ''}
                            ${day ? 'cursor-pointer hover:ring-2 hover:ring-spiritual-blue' : ''}
                          `}
                          onMouseEnter={(e) => handleCellHover(day, e)}
                          onMouseLeave={() => setHoveredCell(null)}
                          title={day && count > 0 ? `${count} participant${count > 1 ? 's' : ''} joined` : ''}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Tooltip */}
            {hoveredCell && (
              <div
                className="fixed z-50 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border max-w-xs"
                style={{
                  left: `${tooltipPosition.x + 10}px`,
                  top: `${tooltipPosition.y + 10}px`,
                  pointerEvents: 'none'
                }}
              >
                <div className="text-sm font-semibold mb-1">
                  {new Date(hoveredCell).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const parts = getParticipantsForDate(new Date(hoveredCell));
                    if (parts.length === 0) return 'No participants joined';
                    if (parts.length === 1) return `1 participant joined: ${parts[0].name}`;
                    return `${parts.length} participants joined`;
                  })()}
                </div>
                {getParticipantsForDate(new Date(hoveredCell)).length > 1 && (
                  <div className="mt-2 text-xs max-h-32 overflow-y-auto">
                    {getParticipantsForDate(new Date(hoveredCell)).map((p, idx) => (
                      <div key={idx} className="truncate">• {p.name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900" />
                <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-700" />
                <div className="w-3 h-3 rounded-sm bg-blue-600 dark:bg-blue-500" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContestGraph;
