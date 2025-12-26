import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVerseContext } from '@/contexts/VerseContext';
import { getBookNameFromNumber, getVerseTextByCoordinates, detectBookNumber } from '@/lib/bibleApi';
import { BookOpen, Calendar, Loader2 } from 'lucide-react';

const TodayVerseDisplay = () => {
  const { currentLanguage, t } = useLanguage();
  const { verseEntries } = useVerseContext();
  const [loading, setLoading] = useState(true);
  const [displayVerse, setDisplayVerse] = useState<{
    book: string;
    verse: string;
    text: string;
    date: Date;
  } | null>(null);

  useEffect(() => {
    const resolveTodayVerse = async () => {
      setLoading(true);
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const userVerse = verseEntries[dateKey];

      if (userVerse) {
        let bNum = userVerse.book_number;
        let cNum = userVerse.chapter_number || 1;
        let vNums = userVerse.verse_numbers || "";

        if (!bNum) bNum = detectBookNumber(userVerse.book_name) || 0;
        if (vNums.includes(':')) {
            const parts = vNums.split(':');
            cNum = parseInt(parts[0], 10);
            vNums = parts[1];
        }

        const text = await getVerseTextByCoordinates(bNum, cNum, vNums, currentLanguage);
        const bookName = getBookNameFromNumber(bNum, currentLanguage) || userVerse.book_name;

        setDisplayVerse({
          book: bookName,
          verse: userVerse.verse_numbers,
          text: text || userVerse.verse_text || "",
          date: today
        });
      }
      setLoading(false);
    };

    resolveTodayVerse();
  }, [verseEntries, currentLanguage]);

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-slate-50">
        <CardContent className="p-8 text-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>Loading today's verse...</p>
        </CardContent>
      </Card>
    );
  }

  if (!displayVerse) return null;

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-spiritual-gold/10 to-white group hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex items-center gap-2 mb-6 text-spiritual-gold uppercase tracking-wider font-bold text-sm">
          <Calendar className="h-4 w-4" />
          {currentLanguage === 'ta' ? 'இன்றைய வசனம்' : "Today's Verse"} - {displayVerse.date.toLocaleDateString(currentLanguage === 'ta' ? 'ta-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        
        <div className="relative">
          <blockquote className="text-2xl font-bold text-slate-900 leading-tight mb-6">
            "{displayVerse.text}"
          </blockquote>
          <div className="flex items-center gap-2 text-spiritual-blue font-bold text-lg">
            <BookOpen className="h-5 w-5" />
            {displayVerse.book} {displayVerse.verse}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayVerseDisplay;
