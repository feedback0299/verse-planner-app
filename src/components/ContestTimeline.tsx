import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSunday, getDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Star, Calendar as CalendarIcon, Hash } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Reading {
  day: number;
  category: string;
  psalms?: string;
  proverbs?: string;
  new_testament?: string;
  old_testament?: string;
}

interface ContestTimelineProps {
  readings: Reading[];
}

const ContestTimeline: React.FC<ContestTimelineProps> = ({ readings }) => {
  // Start date of the contest is fixed to Feb 1, 2026
  const contestStartDate = new Date(2026, 1, 1); 
  // Initial view starts at Feb 2026
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 1, 1));

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDayInfo = (date: Date) => {
    // Calculate Contest Day
    const diffTime = date.getTime() - contestStartDate.getTime();
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (dayNum < 1 || dayNum > 70) return null;

    const kidsPortion = readings.find(r => r.day === dayNum && r.category === 'kids_teens');
    const adultPortion = readings.find(r => r.day === dayNum && r.category === 'adult');

    const timing = isSunday(date) 
      ? "Sun: After 14:00 (After 3rd Service)" 
      : "Mon-Sat: 12:00 - 14:00";

    return { dayNum, kidsPortion, adultPortion, timing };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const emptyDays = getDay(start);

  const selectedDayInfo = getDayInfo(selectedDate);
  const isSelectedSun = isSunday(selectedDate);

  return (
    <div className="space-y-8">
      
      {/* Calendar Navigation & Grid */}
      <Card className="shadow-card border-slate-100/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              // Limit navigation to relevant months (Jan 2026 - May 2026 roughly)
              disabled={currentDate.getFullYear() === 2026 && currentDate.getMonth() <= 1} 
              className="border-slate-200 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-2xl font-bold text-spiritual-blue">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={currentDate.getFullYear() === 2026 && currentDate.getMonth() >= 3}
              className="border-slate-200 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Empty cells */}
            {Array.from({ length: emptyDays }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[40px] md:min-h-[60px]" />
            ))}

            {/* Days */}
            {days.map((date) => {
              const info = getDayInfo(date);
              const isSelected = isSameDay(date, selectedDate);
              const isSun = isSunday(date);
              const isContestDay = !!info;

              return (
                <div 
                  key={date.toString()}
                  onClick={() => isContestDay && setSelectedDate(date)}
                  className={`
                    min-h-[50px] md:min-h-[80px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative border
                    ${isSelected 
                      ? 'bg-spiritual-blue text-white shadow-lg scale-105 border-spiritual-blue z-10' 
                      : isContestDay
                        ? 'bg-white hover:bg-blue-50 hover:border-blue-200 border-slate-100 text-slate-700'
                        : 'bg-slate-50 text-slate-300 border-transparent cursor-default'
                    }
                    ${isSun && isContestDay && !isSelected ? 'bg-amber-50/50 border-amber-100 text-amber-900' : ''}
                  `}
                >
                  <span className={`text-sm md:text-lg font-bold ${isSelected ? 'text-white' : ''}`}>
                    {format(date, 'd')}
                  </span>
                  
                  {info && (
                    <div className={`
                      mt-1 px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-tighter
                      ${isSelected 
                        ? 'bg-white/20 text-white' 
                        : isSun 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-blue-100 text-blue-700'}
                    `}>
                      Day {info.dayNum}
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-spiritual-blue rotate-45 transform border-r border-b border-white hidden md:block"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detail View for Selected Date */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        {selectedDayInfo ? (
          <Card className={`border-0 shadow-xl overflow-hidden ${isSelectedSun ? 'shadow-amber-100/50' : 'shadow-blue-100/50'}`}>
             <div className={`h-2 w-full ${isSelectedSun ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-spiritual-blue to-purple-500'}`}></div>
             <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                       <Badge className={`${isSelectedSun ? 'bg-amber-500' : 'bg-spiritual-blue'} hover:bg-opacity-90 text-sm px-3 py-1`}>
                         DAY {selectedDayInfo.dayNum}
                       </Badge>
                       <span className="text-slate-400 font-medium flex items-center gap-1 text-sm">
                         <CalendarIcon className="h-4 w-4" />
                         {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                       </span>
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-800 mt-2">
                      Daily Reading Portion
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 font-medium text-slate-500">
                      <Star className={`h-4 w-4 ${isSelectedSun ? 'text-amber-500' : 'text-spiritual-blue'} fill-current`} />
                      {selectedDayInfo.timing}
                    </CardDescription>
                  </div>
                </div>
             </CardHeader>

             <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Kids Section */}
                  <div className="space-y-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Kids & Teens</h3>
                     </div>
                     
                     <div className="flex flex-col gap-3 pl-2">
                        <div className="flex items-start gap-4 p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
                           <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider min-w-[60px] text-center mt-0.5">Psalms</div>
                           <p className="font-medium text-slate-700 text-lg">{selectedDayInfo.kidsPortion?.psalms || "—"}</p>
                        </div>
                        <div className="flex items-start gap-4 p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
                           <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider min-w-[60px] text-center mt-0.5">Prov/NT</div>
                           <p className="font-medium text-slate-700 text-lg">
                             {selectedDayInfo.kidsPortion 
                               ? `${selectedDayInfo.kidsPortion.proverbs || ''} ${selectedDayInfo.kidsPortion.new_testament || ''}` 
                               : "—"}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Adults Section */}
                  <div className="space-y-4 bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Adults</h3>
                     </div>
                     
                     <div className="flex flex-col gap-3 pl-2">
                        {selectedDayInfo.adultPortion?.old_testament && (
                          <div className="flex items-start gap-4 p-3 bg-white rounded-2xl border border-orange-100 shadow-sm">
                             <div className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider min-w-[60px] text-center mt-0.5">OT</div>
                             <p className="font-medium text-slate-700 text-lg">{selectedDayInfo.adultPortion.old_testament}</p>
                          </div>
                        )}
                        <div className="flex items-start gap-4 p-3 bg-white rounded-2xl border border-orange-100 shadow-sm">
                           <div className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider min-w-[60px] text-center mt-0.5">Psalms</div>
                           <p className="font-medium text-slate-700 text-lg">{selectedDayInfo.adultPortion?.psalms || "—"}</p>
                        </div>
                        <div className="flex items-start gap-4 p-3 bg-white rounded-2xl border border-orange-100 shadow-sm">
                           <div className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider min-w-[60px] text-center mt-0.5">Prov/NT</div>
                           <p className="font-medium text-slate-700 text-lg">
                              {selectedDayInfo.adultPortion 
                                ? `${selectedDayInfo.adultPortion.proverbs || ''} ${selectedDayInfo.adultPortion.new_testament || ''}` 
                                : "—"}
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
             </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 px-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <CalendarIcon className="h-8 w-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-700">No Readings Scheduled</h3>
             <p className="text-slate-500 max-w-sm mx-auto mt-2">
               Select a highlighted date (Day 1 - 70) on the calendar to view the reading portions for that day.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestTimeline;
