import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBookNameFromNumber, getVerseTextByCoordinates, getRandomVerseCoordinates } from '@/lib/bibleApi';
import { Sparkles, BookOpen, Loader2, Clock } from 'lucide-react';

const RandomVerseDisplay = () => {
  const { currentLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState<{
    text: string;
    reference: string;
  } | null>(null);

  useEffect(() => {
    const fetchRandomVerse = async () => {
      setLoading(true);
      const now = new Date();
      // Seed based on date and hour to change every hour
      const currentHourSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours();
      
      let attempts = 0;
      let foundVerse = false;
      let selectedCoords = getRandomVerseCoordinates(currentHourSeed);

      while (attempts < 5 && !foundVerse) {
        try {
          const text = await getVerseTextByCoordinates(
            selectedCoords.bookNumber,
            selectedCoords.chapter,
            selectedCoords.verse,
            currentLanguage
          );
          
          if (text) {
            const bookName = getBookNameFromNumber(selectedCoords.bookNumber, currentLanguage);
            setVerse({
              text: text,
              reference: `${bookName} ${selectedCoords.chapter}:${selectedCoords.verse}`
            });
            foundVerse = true;
          } else {
            // Try another "random" coordinate if the first one failed (e.g. verse number too high)
            attempts++;
            selectedCoords = getRandomVerseCoordinates(currentHourSeed + attempts);
          }
        } catch (e) {
          console.error("Error fetching random verse:", e);
          attempts++;
        }
      }
      setLoading(false);
    };

    fetchRandomVerse();
  }, [currentLanguage]);

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-slate-50/50">
        <CardContent className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-spiritual-gold opacity-50" />
        </CardContent>
      </Card>
    );
  }

  if (!verse || !verse.text) return null;

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-spiritual-blue/5 to-white group hover:shadow-xl transition-all duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
         <Sparkles className="h-16 w-16 text-spiritual-blue" />
      </div>
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-spiritual-blue uppercase tracking-wider font-bold text-xs">
            <Sparkles className="h-4 w-4" />
            {currentLanguage === 'ta' ? 'உங்களுக்காக ஒரு வசனம்' : 'A Verse for You'}
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-medium">
             <Clock className="h-3 w-3" />
             {currentLanguage === 'ta' ? 'ஒவ்வொரு மணிநேரமும் மாறும்' : 'Changes Hourly'}
          </div>
        </div>
        
        <div className="relative">
          <blockquote className="text-xl font-medium text-slate-700 leading-relaxed italic mb-4">
            "{verse.text}"
          </blockquote>
          <div className="flex items-center gap-2 text-spiritual-blue font-bold">
            <BookOpen className="h-4 w-4" />
            {verse.reference}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RandomVerseDisplay;
