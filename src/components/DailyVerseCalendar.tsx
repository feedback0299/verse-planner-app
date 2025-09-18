import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerseContext } from '@/contexts/VerseContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Demo Bible verses data (fallback for days without user entries)
const demoVerses = {
  '2025-01-01': { book: 'Psalms', verse: '23:1', text: 'The Lord is my shepherd; I shall not want.' },
  '2025-01-02': { book: 'John', verse: '3:16', text: 'For God so loved the world that he gave his one and only Son...' },
  '2025-01-03': { book: 'Philippians', verse: '4:13', text: 'I can do all things through Christ who strengthens me.' },
  '2025-01-04': { book: 'Romans', verse: '8:28', text: 'And we know that in all things God works for the good of those who love him...' },
  '2025-01-05': { book: 'Jeremiah', verse: '29:11', text: 'For I know the plans I have for you, declares the Lord...' },
  '2025-01-06': { book: 'Matthew', verse: '5:16', text: 'Let your light shine before others, that they may see your good deeds...' },
  '2025-01-07': { book: 'Proverbs', verse: '3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding...' },
  '2025-01-08': { book: '1 Corinthians', verse: '13:4', text: 'Love is patient, love is kind. It does not envy, it does not boast...' },
  '2025-01-09': { book: 'Isaiah', verse: '40:31', text: 'But those who hope in the Lord will renew their strength...' },
  '2025-01-10': { book: 'Ephesians', verse: '2:8-9', text: 'For it is by grace you have been saved, through faith...' },
};

const DailyVerseCalendar = () => {
  const { verseEntries } = useVerseContext();
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

  const selectDate = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const selectedDateKey = formatDateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  // First check user entries, then fallback to demo verses
  const userVerse = verseEntries[selectedDateKey];
  const selectedVerse = userVerse || demoVerses[selectedDateKey];

  return (
    <div className="min-h-screen bg-gradient-peaceful p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-spiritual-blue mb-2">{t('calendar.daily.title')}</h1>
          <p className="text-muted-foreground">{t('calendar.daily.subtitle')}</p>
        </div>

        {/* Calendar Navigation */}
        <Card className="mb-6 shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="border-border hover:bg-spiritual-light"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h2 className="text-2xl font-semibold text-spiritual-blue">
                {(t('calendar.daily.monthNames') as string[])[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="border-border hover:bg-spiritual-light"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {(t('calendar.daily.dayNames') as string[]).map((day, index) => (
                <div key={index} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="p-2 h-12"></div>
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
                const hasUserVerse = verseEntries[dateKey];
                const hasDemoVerse = demoVerses[dateKey];
                const hasVerse = hasUserVerse || hasDemoVerse;
                const isToday = isCurrentMonth && day === today.getDate();
                const isSelected = selectedDate.getDate() === day && 
                                 selectedDate.getMonth() === currentDate.getMonth() && 
                                 selectedDate.getFullYear() === currentDate.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={`p-2 h-12 rounded-lg text-sm transition-all duration-200 relative ${
                      isSelected 
                        ? 'bg-gradient-spiritual text-primary-foreground shadow-card' 
                        : isToday
                        ? 'bg-secondary text-secondary-foreground'
                        : hasVerse
                        ? 'bg-accent text-accent-foreground hover:bg-secondary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {day}
                    {hasVerse && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-spiritual-gold rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Verse */}
        {selectedVerse ? (
          <Card className="shadow-spiritual border-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-spiritual-gold" />
                <span className="text-sm font-medium text-spiritual-gold">
                  {selectedVerse.book} {selectedVerse.verse}
                </span>
              </div>
              <blockquote className="text-lg text-foreground leading-relaxed border-l-4 border-spiritual-gold pl-6">
                "{selectedVerse.text}"
              </blockquote>
              <div className="mt-4 text-right">
                <span className="text-sm text-muted-foreground">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card border-0">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('calendar.daily.noVerse')} {selectedDate.toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DailyVerseCalendar;