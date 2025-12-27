
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerseContext } from '@/contexts/VerseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPeriodicVerse } from '@/lib/commonService/periodicVerseService';
import { Star } from 'lucide-react';
import { getBookNameFromNumber, getVerseTextByCoordinates, detectBookNumber } from '@/lib/bibleApi';

// Demo Bible verses data (fallback for days without user entries)
const demoVersesEn: Record<string, any> = {
  '2025-01-01': { book: 'Psalms', verse: '23:1', text: 'The Lord is my shepherd; I shall not want.' },
  '2025-01-02': { book: 'John', verse: '3:16', text: 'For God so loved the world that he gave his one and only Son...' },
  '2025-01-03': { book: 'Philippians', verse: '4:13', text: 'I can do all things through Christ who strengthens me.' },
  '2025-01-04': { book: 'Romans', verse: '8:28', text: 'And we know that in all things God works for the good of those who love him...' },
  '2025-01-05': { book: 'Jeremiah', verse: '29:11', text: 'For I know the plans I have for you, declares the Lord...' },
};

const demoVersesTa: Record<string, any> = {
  '2025-01-01': { book: 'சங்கீதம்', verse: '23:1', text: 'கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான் தாழ்ச்சியடையேன்.' },
  '2025-01-02': { book: 'யோவான்', verse: '3:16', text: 'தேவன், தம்முடைய ஒரேபேறான குமாரனை விசுவாசிக்கிறவன் எவனோ அவன் கெட்டுப்போகாமல்...' },
  '2025-01-03': { book: 'பிலிப்பியர்', verse: '4:13', text: 'என்னைப் பலப்படுத்துகிற கிறிஸ்துவினாலே எல்லாவற்றையுஞ்செய்ய எனக்குப் பெலனுண்டு.' },
  '2025-01-04': { book: 'ரோமர்', verse: '8:28', text: 'அன்றியும், அவருடைய தீர்மானத்தின்படி அழைக்கப்பட்டவர்களாய் தேவனிடத்தில் அன்புகூருகிறவர்களுக்கு...' },
  '2025-01-05': { book: 'எரேமியா', verse: '29:11', text: 'நீங்கள் எதிர்பார்த்திருக்கும் முடிவை உங்களுக்குக் கொடுக்கும்படிக்கு1 நான் உங்கள்பேரில் நினைத்திருக்கிற நினைவுகளை...' },
};

const demoVersesKa: Record<string, any> = {
  '2025-01-01': { book: 'ಕೀರ್ತನೆಗಳು', verse: '23:1', text: 'ಕರ್ತನು ನನ್ನ ಕುರುಬನು; ನನಗೆ ಕೊರತೆಯಾಗದು.' },
  '2025-01-02': { book: 'ಯೋಹಾನನು', verse: '3:16', text: 'ದೇವರು ಲೋಕವನ್ನು ಎಷ್ಟೋ ಪ್ರೀತಿಸಿದನು...' },
  '2025-01-03': { book: 'ಫಿಲಿಪ್ಪಿಯವರಿಗೆ', verse: '4:13', text: 'ನನ್ನನ್ನು ಬಲಪಡಿಸುವ ಕ್ರಿಸ್ತನ ಮೂಲಕ ನಾನು ಎಲ್ಲವನ್ನೂ ಮಾಡಬಲ್ಲೆನು.' },
  '2025-01-04': { book: 'ರೋಮಾಪುರದವರಿಗೆ', verse: '8:28', text: 'ದೇವರನ್ನು ಪ್ರೀತಿಸುವವರಿಗೆ ಎಲ್ಲವೂ ಒಳ್ಳೆಯದಕ್ಕಾಗಿ ಕೂಡಿಕೊಂಡು ಬರುತ್ತದೆ...' },
  '2025-01-05': { book: 'ಯೆರೆಮಿಯ', verse: '29:11', text: 'ನಿಮಗಾಗಿ ನಾನು ಇಟ್ಟುಕೊಂಡಿರುವ ಆಲೋಚನೆಗಳನ್ನು ನಾನು ಬಲ್ಲೆನು...' },
};

const monthNamesEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthNamesTa = [
  'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
];

const monthNamesKa = [
  'ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್',
  'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'
];

const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekDaysTa = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
const weekDaysTaShort = ['ஞா', 'திங்', 'செ', 'புத', 'வி', 'வெ', 'சனி'];
const weekDaysKa = ['ಭಾನು', 'ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ'];

const DailyVerseCalendar = () => {
  const { verseEntries } = useVerseContext();
  const { currentLanguage, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // State for the currently displayed verse
  const [displayVerse, setDisplayVerse] = useState<{
    book: string;
    verse: string;
    text: string;
  } | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [monthlyVerse, setMonthlyVerse] = useState<{ text: string; reference: string } | null>(null);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

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

  const selectDate = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const selectedDateKey = formatDateKey(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  const monthNames = currentLanguage === 'ta' ? monthNamesTa : currentLanguage === 'ka' ? monthNamesKa : monthNamesEn;
  const weekDays = currentLanguage === 'ta' ? weekDaysTa : currentLanguage === 'ka' ? weekDaysKa : weekDaysEn;

  // Effect to resolve the verse text based on language and DB Coordinates
  useEffect(() => {
    const resolveVerse = async () => {
      setIsLoadingVerse(true);
      const userVerse = verseEntries[selectedDateKey];
      
      // Helper to try resolving text if we can find coordinates
      const tryResolveDynamic = async (bNum: number, cNum: number, vNums: string) => {
          try {
             const bookName = getBookNameFromNumber(bNum, currentLanguage) || userVerse?.book_name || "";
             const text = await getVerseTextByCoordinates(bNum, cNum, vNums, currentLanguage);
             if (text) {
                 setDisplayVerse({
                    book: bookName,
                    verse: `${cNum}:${vNums}`,
                    text: text
                 });
                 return true;
             }
          } catch (e) {
              console.error(e);
          }
          return false;
      };

      // 1. If we have a DB entry with coordinates
      if (userVerse && userVerse.book_number && userVerse.verse_numbers) {
          let cNum = userVerse.chapter_number || 1;
          let vNums = userVerse.verse_numbers;

          // If verse_numbers is in format "Chapter:Verse", parse it
          if (vNums.includes(':')) {
              const parts = vNums.split(':');
              cNum = parseInt(parts[0], 10);
              vNums = parts[1];
          }

          const success = await tryResolveDynamic(userVerse.book_number, cNum, vNums);
          if (!success) {
               // Fallback to stored
               setDisplayVerse({
                book: getBookNameFromNumber(userVerse.book_number, currentLanguage) || userVerse.book_name || "",
                verse: userVerse.verse_numbers,
                text: userVerse.verse_text || ""
             });
          }
      } 
      // 2. Legacy/Incomplete DB entry - Try to auto-detect coordinates from stored name
      else if (userVerse) {
          
          let detectedBookNum = detectBookNumber(userVerse.book_name);
          // Try to parse chapter/verse from verse_numbers string if strictly formatted "3:16"
          let cNum = userVerse.chapter_number;
          let vNums = userVerse.verse_numbers;
          
          if (!cNum && vNums && vNums.includes(':')) {
              const parts = vNums.split(':');
              cNum = parseInt(parts[0], 10);
              vNums = parts[1];
          }

          if (detectedBookNum && cNum && vNums) {
               const success = await tryResolveDynamic(detectedBookNum, cNum, vNums);
               if (!success) {
                    setDisplayVerse({
                        book: userVerse.book_name,
                        verse: userVerse.verse_numbers || "",
                        text: userVerse.verse_text
                    });
               }
          } else {
               // Cannot resolve, standard fallback
               setDisplayVerse({
                    book: userVerse.book_name,
                    verse: userVerse.verse_numbers || "",
                    text: userVerse.verse_text
               });
          }
      } else {
        // 3. Fallback to Demo Data
        const demoVerses = currentLanguage === 'ta' ? demoVersesTa : currentLanguage === 'ka' ? demoVersesKa : demoVersesEn;
        const demoVerse = demoVerses[selectedDateKey];
        if (demoVerse) {
          setDisplayVerse(demoVerse);
        } else {
          setDisplayVerse(null);
        }
      }
      setIsLoadingVerse(false);
    };

    resolveVerse();
  }, [selectedDateKey, verseEntries, currentLanguage]);

  // Effect to fetch the monthly verse whenever currentDate (month/year) changes
  useEffect(() => {
    const fetchMonthlyVerse = async () => {
      setIsLoadingMonthly(true);
      const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      try {
        const data = await getPeriodicVerse('monthly', period);
        if (data) {
          const bookName = getBookNameFromNumber(data.book_number, currentLanguage) || "";
          const parts = data.verse_numbers.split(':');
          const cNum = parts.length > 1 ? parseInt(parts[0], 10) : 1;
          const vNum = parts.length > 1 ? parts[1] : data.verse_numbers;
          
          const text = await getVerseTextByCoordinates(data.book_number, cNum, vNum, currentLanguage);
          
          setMonthlyVerse({
            text: text || "",
            reference: `${bookName} ${data.verse_numbers}`
          });
        } else {
          setMonthlyVerse(null);
        }
      } catch (e) {
        console.error("Error fetching monthly verse for calendar:", e);
        setMonthlyVerse(null);
      } finally {
        setIsLoadingMonthly(false);
      }
    };

    fetchMonthlyVerse();
  }, [currentDate, currentLanguage]);

  return (
    <div className="min-h-screen bg-gradient-peaceful p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-spiritual-blue mb-2">
            {t('calendar.daily.title') || (currentLanguage === 'ta' ? 'தினசரி பைபிள் வசனங்கள்' : 'Daily Bible Verses')}
          </h1>
          <p className="text-muted-foreground">
            {t('calendar.daily.subtitle') || (currentLanguage === 'ta'
              ? 'ஒவ்வொரு நாளும் கடவுளின் வார்த்தையை கண்டறியவும்'
              : "Discover God's word for each day")}
          </p>
        </div>

        {/* Monthly Verse Display (updates on month change) */}
        {isLoadingMonthly ? (
            <Card className="shadow-card border-0 mb-6 bg-slate-50/50">
               <CardContent className="p-8 text-center">
                   <Loader2 className="h-6 w-6 animate-spin mx-auto text-spiritual-gold opacity-50" />
               </CardContent>
           </Card>
        ) : monthlyVerse ? (
          <Card className="shadow-spiritual border-0 mb-6 bg-slate-50 border-l-4 border-spiritual-gold">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-spiritual-gold" />
                <span className="text-sm font-medium text-spiritual-gold uppercase tracking-wider">
                  {currentLanguage === 'ta' ? 'இந்த மாத வசனம்' : 'Verse of the Month'} - {monthNames[currentDate.getMonth()]}
                </span>
              </div>
              <blockquote className="text-xl font-medium text-slate-800 leading-relaxed italic">
                "{monthlyVerse.text}"
              </blockquote>
              <div className="flex items-center gap-2 text-spiritual-blue font-semibold mt-4">
                <BookOpen className="h-4 w-4" />
                {monthlyVerse.reference}
              </div>
            </CardContent>
          </Card>
        ) : null}

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
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
              {weekDays.map((day, index) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="inline sm:hidden">
                    {currentLanguage === 'ta' ? weekDaysTaShort[index] : day.charAt(0)}
                  </span>
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
                // Check demo data too for the indicator dot
                const demoVerses = currentLanguage === 'ta' ? demoVersesTa : currentLanguage === 'ka' ? demoVersesKa : demoVersesEn;
                const hasDemoVerse = demoVerses[dateKey];
                const hasVerse = hasUserVerse || hasDemoVerse;
                
                const isToday = isCurrentMonth && day === today.getDate();
                const isSelected =
                  selectedDate.getDate() === day &&
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
        {isLoadingVerse ? (
             <Card className="shadow-card border-0 mb-6">
                <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-spiritual-blue" />
                    <p className="mt-2 text-muted-foreground">Loading verse...</p>
                </CardContent>
            </Card>
        ) : displayVerse ? (
          <Card className="shadow-spiritual border-0 mb-6">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-spiritual-gold" />
                <span className="text-sm font-medium text-spiritual-gold">
                  {displayVerse.book} {displayVerse.verse}
                </span>
              </div>
              <blockquote className="text-lg text-foreground leading-relaxed border-l-4 border-spiritual-gold pl-6 break-words whitespace-pre-wrap">
                "{displayVerse.text}"
              </blockquote>
              <div className="mt-4 text-right">
                <span className="text-sm text-muted-foreground">
                  {selectedDate.toLocaleDateString(currentLanguage === 'ta' ? 'ta-IN' : currentLanguage === 'ka' ? 'kn-IN' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card border-0 mb-6">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('calendar.daily.noVerse') || (currentLanguage === 'ta'
                  ? 'இன்றைய வசனம் இல்லை'
                  : `No verse available for ${selectedDate.toLocaleDateString()}`)}
              </p>
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
};

export default DailyVerseCalendar;
