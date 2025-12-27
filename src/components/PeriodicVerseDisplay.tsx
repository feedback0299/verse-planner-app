import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPeriodicVerse } from '@/lib/commonService/periodicVerseService';
import { getBookNameFromNumber, getVerseTextByCoordinates } from '@/lib/bibleApi';
import { Quote, BookOpen, Star, Target, Loader2 } from 'lucide-react';

const PeriodicVerseDisplay = ({ type }: { type?: 'monthly' | 'annual' }) => {
  const { currentLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    monthly: { text: string; reference: string; note: string } | null;
    annual: { text: string; reference: string; note: string } | null;
  }>({ monthly: null, annual: null });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentYear = `${now.getFullYear()}`;

      const [monthlyData, annualData] = await Promise.all([
        getPeriodicVerse('monthly', currentMonth),
        getPeriodicVerse('annual', currentYear)
      ]);

      const resolve = async (verse: any) => {
        if (!verse) return null;
        const bookName = getBookNameFromNumber(verse.book_number, currentLanguage) || "";
        const parts = verse.verse_numbers.split(':');
        const cNum = parts.length > 1 ? parseInt(parts[0], 10) : 1;
        const vNum = parts.length > 1 ? parts[1] : verse.verse_numbers;
        const text = await getVerseTextByCoordinates(verse.book_number, cNum, vNum, currentLanguage);
        
        return {
          text: text || "",
          reference: `${bookName} ${verse.verse_numbers}`,
          note: verse.note1 || ""
        };
      };

      const [monthly, annual] = await Promise.all([
        resolve(monthlyData),
        resolve(annualData)
      ]);

      setData({ monthly, annual });
      setLoading(false);
    };

    fetchData();
  }, [currentLanguage]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-spiritual-gold" />
      </div>
    );
  }

  if (!data.monthly && !data.annual) return null;

  const showMonthly = !type || type === 'monthly';
  const showAnnual = !type || type === 'annual';

  return (
    <div className={`grid ${!type ? 'md:grid-cols-2' : 'grid-cols-1'} gap-8`}>
      {showAnnual && data.annual && (
        <Card className="relative overflow-hidden border-0 shadow-lg bg-spiritual-blue text-white group hover:shadow-xl transition-all duration-300 w-full max-w-3xl mx-auto">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Target className="h-24 w-24 text-white" />
          </div>
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6 text-spiritual-gold uppercase tracking-wider font-semibold text-sm">
              <Target className="h-4 w-4 text-spiritual-gold" />
              {currentLanguage === 'ta' ? 'இந்த ஆண்டின் வசனம்' : 'Verse of the Year'}
            </div>
            
            <div className="relative">
              <Quote className="absolute -top-4 -left-4 h-8 w-8 text-white/10" />
              <blockquote className="text-xl font-medium text-white leading-relaxed pl-4 mb-6 italic">
                "{data.annual.text}"
              </blockquote>
              <div className="flex items-center gap-2 text-spiritual-gold font-semibold pl-4">
                <BookOpen className="h-4 w-4" />
                {data.annual.reference}
              </div>
            </div>

            {data.annual.note && (
              <div className="mt-6 pt-6 border-t border-white/10 italic text-white/70 text-sm italic">
                {data.annual.note}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showMonthly && data.monthly && (
        <Card className="relative overflow-hidden border-0 shadow-lg bg-white group hover:shadow-xl transition-all duration-300 w-full max-w-3xl mx-auto">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Star className="h-24 w-24 text-spiritual-gold" />
          </div>
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6 text-spiritual-gold uppercase tracking-wider font-semibold text-sm">
              <Star className="h-4 w-4" />
              {currentLanguage === 'ta' ? 'இந்த மாத வசனம்' : 'Verse of the Month'}
            </div>
            
            <div className="relative">
              <Quote className="absolute -top-4 -left-4 h-8 w-8 text-spiritual-gold/10" />
              <blockquote className="text-xl font-medium text-slate-800 leading-relaxed pl-4 mb-6 italic">
                "{data.monthly.text}"
              </blockquote>
              <div className="flex items-center gap-2 text-spiritual-blue font-semibold pl-4">
                <BookOpen className="h-4 w-4" />
                {data.monthly.reference}
              </div>
            </div>

            {data.monthly.note && (
              <div className="mt-6 pt-6 border-t border-slate-100 italic text-slate-500 text-sm italic">
                {data.monthly.note}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PeriodicVerseDisplay;
