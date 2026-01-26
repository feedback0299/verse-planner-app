import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Calendar as CalendarIcon, Trophy, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isAfter, isBefore, isToday } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface DayReading {
  day: number;
  psalms: string;
  proverbs: string;
  new_testament?: string;
  old_testament?: string;
  category?: string;
}

interface ChallengeCalendarProps {
  startDate: Date;
  progress: string;
  readings: any[];
  onCheckIn: (day: number) => void;
  isCheckingIn: boolean;
  userCategory: string;
}

const ChallengeCalendar: React.FC<ChallengeCalendarProps> = ({ 
  startDate, 
  progress, 
  readings, 
  onCheckIn, 
  isCheckingIn,
  userCategory 
}) => {
  const { t } = useLanguage();
  // Initialize to Feb 2026 as per requirements
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); 
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Helper to determine if a date is within the 70 days
  const getDayNumber = (date: Date) => {
    const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = dateUTC - startUTC;
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return dayNum;
  };

  const getDayStatus = (dayNum: number, date: Date) => {
    if (dayNum < 1 || dayNum > 70) return 'invalid';
    
    const isDone = progress[dayNum - 1] === '1';
    const isCurrent = isSameDay(date, new Date()); // Check if it's actually today physically
    
    // User requested specific logic:
    // 1. Current day = Blue (until checked?) -> "if the current day is feb 1 it should be displayed blue after ... checkbox is entered then it should be changed"
    // Interpretation: Priority is Done (Green). If not done and is Today (Blue). Else Gray?
    
    if (isDone) return 'completed';
    if (isCurrent) return 'current';
    // Logic for "if data not entered one color(gray)"
    // Typically past incomplete days are gray/red. Future days are default.
    // User said "until the feb1 the calendar should be if data not entered one color(gray)" -> ambiguous.
    // Let's assume:
    // Completed -> Green
    // Today (Incomplete) -> Blue
    // Incomplete -> Gray
    return 'incomplete';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    const dayNum = getDayNumber(date);
    if (dayNum >= 1 && dayNum <= 70) {
      setSelectedDay(dayNum);
      setIsDialogOpen(true);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedDay(null);
  };

  const getReadingsForDay = (day: number) => {
    // Filter readings by category and day
    return readings.filter(r => r.day === day && (r.category === userCategory || !r.category));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const firstDayIndex = getDay(start);

  return (
    <div className="space-y-4">
      {/* User Guidance Note */}
      <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-center text-center">
         <p className="text-red-500 font-bold text-sm md:text-base">
           NOTE: Click on today's date to view and track your Daily Reading Portion.
         </p>
      </div>

      {/* Today's Portion Widget */}
      {(() => {
        const todayNum = getDayNumber(new Date());
        const todaysReadings = todayNum >= 1 && todayNum <= 70 ? getReadingsForDay(todayNum) : [];
        if (todayNum < 1) return null; // Before contest
        if (todayNum > 70) return null; // After contest

        return (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-spiritual-blue to-blue-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <CardHeader className="pb-2 border-b border-white/10 relative z-10">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-spiritual-gold" />
                    <CardTitle className="text-xl font-bold text-white">Today's Portion</CardTitle>
                 </div>
                 <Badge className="bg-spiritual-gold text-white hover:bg-spiritual-gold border-0">
                    Day {todayNum}
                 </Badge>
               </div>
               <CardDescription className="text-blue-100 font-medium">
                  {userCategory === 'adult' ? 'Adults Schedule' : 'Kids & Teens Schedule'}
               </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 relative z-10 space-y-3">
               {todaysReadings.length > 0 ? (
                 todaysReadings.map((reading, idx) => (
                    <div key={idx} className="space-y-3">
                       {reading.old_testament && (
                          <div className="flex gap-3 items-start p-3 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                             <Badge variant="outline" className="bg-white/20 text-white border-transparent min-w-[60px] justify-center mt-0.5">OT</Badge>
                             <p className="font-medium text-white">{reading.old_testament}</p>
                          </div>
                       )}
                       <div className="flex gap-3 items-start p-3 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                          <Badge variant="outline" className="bg-white/20 text-white border-transparent min-w-[60px] justify-center mt-0.5">Psalms</Badge>
                          <p className="font-medium text-white">{reading.psalms}</p>
                       </div>
                       <div className="flex gap-3 items-start p-3 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                          <Badge variant="outline" className="bg-white/20 text-white border-transparent min-w-[60px] justify-center mt-0.5">Prov</Badge>
                          <p className="font-medium text-white">{reading.proverbs}</p>
                       </div>
                       <div className="flex gap-3 items-start p-3 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                          <Badge variant="outline" className="bg-white/20 text-white border-transparent min-w-[60px] justify-center mt-0.5">NT</Badge>
                          <p className="font-medium text-white">{reading.new_testament}</p>
                       </div>
                    </div>
                 ))
               ) : (
                 <p className="text-blue-200 italic">No specific readings assigned for today.</p>
               )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Calendar Card */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-spiritual-blue/5 border-b border-spiritual-blue/10 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
              // Limit navigation mainly to challenge duration (Feb-Apr)
              disabled={currentDate.getFullYear() === 2026 && currentDate.getMonth() <= 1} 
              className="text-spiritual-blue hover:bg-spiritual-blue/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <CardTitle className="text-xl md:text-2xl text-spiritual-blue font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
              disabled={currentDate.getFullYear() === 2026 && currentDate.getMonth() >= 3}
              className="text-spiritual-blue hover:bg-spiritual-blue/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-2 md:p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Empty cells */}
            {Array.from({ length: firstDayIndex }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[50px] md:min-h-[80px]"></div>
            ))}
            
            {/* Days */}
            {days.map((date) => {
              const dayNum = getDayNumber(date);
              const status = getDayStatus(dayNum, date);
              const isInteractable = dayNum >= 1 && dayNum <= 70;

              let bgClass = 'bg-white';
              let borderClass = 'border-slate-100';
              let textClass = 'text-slate-700';
              let statusIndicator = null;

              if (isInteractable) {
                switch (status) {
                  case 'completed':
                    bgClass = 'bg-green-50 hover:bg-green-100';
                    borderClass = 'border-green-200';
                    textClass = 'text-green-800';
                    statusIndicator = <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1"><CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500 fill-green-100" /></div>;
                    break;
                  case 'current':
                    bgClass = 'bg-blue-50 hover:bg-blue-100';
                    borderClass = 'border-blue-300 ring-2 ring-blue-100';
                    textClass = 'text-blue-800';
                    statusIndicator = <div className="absolute top-1 right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-pulse"></div>;
                    break;
                  case 'incomplete':
                  default:
                    bgClass = 'bg-slate-50 hover:bg-slate-100';
                    borderClass = 'border-slate-200';
                    textClass = 'text-slate-500';
                    break;
                }
              } else {
                 textClass = 'text-slate-300';
              }

              return (
                <div 
                  key={date.toString()}
                  onClick={() => isInteractable && handleDateClick(date)}
                  className={`
                    relative min-h-[50px] md:min-h-[80px] rounded-xl border p-1 md:p-2 flex flex-col items-start justify-between transition-all duration-200
                    ${isInteractable ? 'cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02]' : 'cursor-default opacity-50'}
                    ${bgClass} ${borderClass} ${textClass}
                  `}
                >
                  <span className="font-bold text-sm md:text-xl leading-none">
                    {format(date, 'd')}
                  </span>
                  
                  {isInteractable && (
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider opacity-60 mt-auto hidden sm:inline-block">
                      Day {dayNum}
                    </span>
                  )}
                  {isInteractable && (
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-60 mt-auto sm:hidden">
                      D{dayNum}
                    </span>
                  )}

                  {statusIndicator}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="w-[95%] max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
             <div className="flex items-center gap-3 mb-2">
                <Badge className={`
                   text-white px-3 py-1 rounded-full text-xs font-bold
                   ${progress[selectedDay! - 1] === '1' ? 'bg-green-500' : 'bg-spiritual-blue'}
                `}>
                   DAY {selectedDay}
                </Badge>
                {progress[selectedDay! - 1] === '1' && <span className="text-green-600 font-bold text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Completed</span>}
             </div>
             <DialogTitle className="text-2xl font-bold text-slate-800">
               Reading Portion
             </DialogTitle>
             <DialogDescription className="text-slate-500">
               {userCategory === 'adult' ? 'Adults Schedule' : 'Kids & Teens Schedule'}
             </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
             {selectedDay && getReadingsForDay(selectedDay).map((reading, idx) => (
                <div key={idx} className="space-y-3">
                   {reading.old_testament && (
                      <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                         <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 min-w-[60px] justify-center mt-0.5">OT</Badge>
                         <p className="font-medium text-slate-800">{reading.old_testament}</p>
                      </div>
                   )}
                   <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 min-w-[60px] justify-center mt-0.5">Psalms</Badge>
                      <p className="font-medium text-slate-800">{reading.psalms}</p>
                   </div>
                   <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 min-w-[60px] justify-center mt-0.5">Prov</Badge>
                      <p className="font-medium text-slate-800">{reading.proverbs}</p>
                   </div>
                   <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 min-w-[60px] justify-center mt-0.5">NT</Badge>
                      <p className="font-medium text-slate-800">{reading.new_testament}</p>
                   </div>
                </div>
             ))}
             
             {selectedDay && getReadingsForDay(selectedDay).length === 0 && (
                <div className="text-center py-6 text-slate-400">
                   No reading data found for this day.
                </div>
             )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
             <div className="flex items-center gap-2">
                <Checkbox 
                  id="mark-complete" 
                  checked={selectedDay ? progress[selectedDay - 1] === '1' : false}
                  onCheckedChange={() => selectedDay && onCheckIn(selectedDay)}
                  disabled={isCheckingIn || (selectedDay !== null && selectedDay > getDayNumber(new Date()))}
                  className="h-5 w-5 border-2 border-spiritual-blue data-[state=checked]:bg-spiritual-blue"
                />
                <label 
                  htmlFor="mark-complete" 
                  className={`text-sm font-medium leading-none cursor-pointer text-slate-700 ${
                    (isCheckingIn || (selectedDay !== null && selectedDay > getDayNumber(new Date()))) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Mark as Completed
                  {selectedDay !== null && selectedDay > getDayNumber(new Date()) && (
                    <span className="block text-xs text-red-400 font-normal mt-1">
                      Available on {format(addDays(startDate, selectedDay - 1), 'MMM d')}
                    </span>
                  )}
                </label>
             </div>
             
             <Button variant="outline" onClick={closeDialog}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChallengeCalendar;
