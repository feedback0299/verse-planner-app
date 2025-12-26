import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { searchBibleVerse, getTamilBookNames, getEnglishBookNames } from '@/lib/bibleApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const BibleSearch = () => {
  const { currentLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [query, setQuery] = useState({ book: '', verse: '' });
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{ text: string; reference: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const tamilBooks = getTamilBookNames();
  const englishBooks = getEnglishBookNames();

  const handleBookChange = (val: string) => {
    setQuery({ ...query, book: val });
    if (val.length > 0) {
      const filtered = tamilBooks.filter((book, index) => {
        const enBook = englishBooks[index] || "";
        return book.toLowerCase().startsWith(val.toLowerCase()) || 
               enBook.toLowerCase().startsWith(val.toLowerCase());
      });
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (book: string) => {
    setQuery({ ...query, book });
    setShowSuggestions(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.book || !query.verse) return;

    setSearching(true);
    try {
      const reference = `${query.book} ${query.verse}`;
      const data = await searchBibleVerse(reference, currentLanguage);
      if (data) {
        setResult({ text: data.text, reference: data.reference });
      } else {
        toast({
          title: "Not Found",
          description: "Could not find that verse. Please check the spelling.",
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        title: "Search Error",
        description: "Failed to search for verse.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-spiritual-blue flex items-center gap-2">
          <Search className="h-6 w-6" />
          {currentLanguage === 'ta' ? 'பைபிள் தேடல்' : 'Bible Search'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="book">{currentLanguage === 'ta' ? 'புத்தகம்' : 'Bible Book'}</Label>
              <Input
                id="book"
                placeholder={currentLanguage === 'ta' ? 'எ.கா., யோவான்' : 'e.g., John'}
                value={query.book}
                onChange={(e) => handleBookChange(e.target.value)}
                onFocus={() => query.book && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="border-spiritual-blue/20"
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-spiritual-blue/10 rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 hover:bg-spiritual-blue/5 cursor-pointer text-slate-700 transition-colors"
                      onClick={() => selectSuggestion(s)}
                    >
                      {s} <span className="text-xs text-slate-400 ml-2">({englishBooks[tamilBooks.indexOf(s)]})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="verse">{currentLanguage === 'ta' ? 'வசனம்' : 'Verse Reference'}</Label>
              <Input
                id="verse"
                placeholder={currentLanguage === 'ta' ? 'எ.கா., 3:16' : 'e.g., 3:16'}
                value={query.verse}
                onChange={(e) => setQuery({ ...query, verse: e.target.value })}
                 className="border-spiritual-blue/20"
              />
            </div>
          </div>
          <Button type="submit" disabled={searching} className="w-full bg-spiritual-blue hover:bg-spiritual-blue/90">
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            {currentLanguage === 'ta' ? 'தேடு' : 'Search Verse'}
          </Button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-gradient-spiritual/5 rounded-xl border border-spiritual-blue/10 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 text-spiritual-gold">
               <BookOpen className="h-5 w-5" />
               <span className="font-semibold">{result.reference}</span>
            </div>
            <p className="text-lg leading-relaxed text-slate-800 italic">
               "{result.text}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BibleSearch;
