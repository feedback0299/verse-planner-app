import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

interface ChurchEventsCalendarProps {
  events: Event[];
}

const ChurchEventsCalendar: React.FC<ChurchEventsCalendarProps> = ({ events }) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
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

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    // Only open dialog if there are events on this day
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setIsDialogOpen(true);
    }
  };

  const getEventsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => isSameDay(parseISO(event.date), targetDate));
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedDate(null);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      
      {/* Calendar Navigation */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="border-border hover:bg-spiritual-light"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <CardTitle className="text-2xl text-spiritual-blue">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="border-border hover:bg-spiritual-light"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-bold text-muted-foreground uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Empty cells */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px] bg-slate-50/30 rounded-lg"></div>
            ))}
            
            {/* Days */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = isCurrentMonth && day === today.getDate();
              const hasEvents = dayEvents.length > 0;

              return (
                <Card 
                  key={day} 
                  className={`
                    min-h-[80px] md:min-h-[100px] transition-all duration-200 cursor-pointer border hover:border-spiritual-blue/50 hover:shadow-md flex flex-col justify-between overflow-hidden
                    ${isToday ? 'ring-2 ring-spiritual-gold bg-white' : 'bg-white border-slate-100'}
                    ${hasEvents ? 'bg-blue-50/30' : ''}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={`p-2 font-bold text-sm ${isToday ? 'text-spiritual-gold' : 'text-slate-600'}`}>
                    {day}
                  </div>
                  
                  <div className="p-1 md:p-2 flex flex-col gap-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div key={event.id} className="text-[10px] bg-spiritual-blue/10 text-spiritual-blue px-1.5 py-0.5 rounded truncate font-medium border border-spiritual-blue/20">
                        {event.time && <span className="mr-1 opacity-75">{event.time.split(' ')[0]}</span>}
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                       <div className="text-[9px] text-center text-slate-400 font-bold">
                         +{dayEvents.length - 2} more
                       </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <CalendarIcon className="h-5 w-5 text-spiritual-blue" />
               Events on {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             {selectedDate && getEventsForDay(selectedDate.getDate()).map(event => (
               <Card key={event.id} className="border-l-4 border-l-spiritual-blue shadow-sm">
                 <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                       <h3 className="font-bold text-lg text-slate-800">{event.title}</h3>
                       <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{event.time}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <MapPin className="h-4 w-4" />
                       <span>{event.location}</span>
                    </div>
                    
                    {event.description && (
                      <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic border border-slate-100">
                        "{event.description}"
                      </div>
                    )}
                 </CardContent>
               </Card>
             ))}
             
             {selectedDate && getEventsForDay(selectedDate.getDate()).length === 0 && (
               <div className="text-center py-8 text-slate-400">
                 No events scheduled for this day.
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChurchEventsCalendar;
