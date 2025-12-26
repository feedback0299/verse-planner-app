import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Save, Loader2, Calendar, Target } from 'lucide-react';
import { searchBibleVerse, getBookNumber, getBookNameFromNumber, getVerseTextByCoordinates } from '@/lib/bibleApi';
import { getPeriodicVerse, savePeriodicVerse, PeriodicVerse } from '@/lib/periodicVerseService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { parseTamilReference, parseEnglishReference, parseKannadaReference } from '@/lib/bibleApi'; // Corrected import path or logic

const PeriodicVerseUploader = ({ type }: { type: 'monthly' | 'annual' }) => {
  const { currentLanguage, t } = useLanguage();
  const { toast } = useToast();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const [period, setPeriod] = useState(type === 'monthly' ? `${currentYear}-${currentMonth}` : `${currentYear}`);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState({
    book_name: '',
    verse_numbers: '',
    verse_text: '',
    reference: '',
    note1: '',
    note2: '',
    note3: '',
    book_number: 0
  });

  useEffect(() => {
    fetchVerse();
  }, [period]);

  const fetchVerse = async () => {
    setLoading(true);
    const data = await getPeriodicVerse(type, period);
    if (data) {
      const bookName = getBookNameFromNumber(data.book_number, currentLanguage) || '';
      
      // Resolve text dynamically if not stored (it shouldn't be based on new logic)
      let text = data.note1 || ''; // Fallback to note if no service text
      const parts = data.verse_numbers.split(':');
      const cNum = parts.length > 1 ? parseInt(parts[0], 10) : 1;
      const vNum = parts.length > 1 ? parts[1] : data.verse_numbers;
      
      const resolvedText = await getVerseTextByCoordinates(data.book_number, cNum, vNum, currentLanguage);

      setFormData({
        book_name: bookName,
        verse_numbers: data.verse_numbers,
        verse_text: resolvedText || '',
        reference: `${bookName} ${data.verse_numbers}`,
        note1: data.note1 || '',
        note2: data.note2 || '',
        note3: data.note3 || '',
        book_number: data.book_number
      });
    } else {
      setFormData({
        book_name: '',
        verse_numbers: '',
        verse_text: '',
        reference: '',
        note1: '',
        note2: '',
        note3: '',
        book_number: 0
      });
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!formData.book_name || !formData.verse_numbers) {
      toast({ title: "Missing Info", description: "Enter book and verse", variant: "destructive" });
      return;
    }

    setSearching(true);
    const reference = `${formData.book_name} ${formData.verse_numbers}`;
    try {
      const verseData = await searchBibleVerse(reference, currentLanguage);
      if (verseData) {
        let bNum = getBookNumber(formData.book_name, currentLanguage);
        
        // Use coordinates if available from reference parsing? 
        // bibleApi.ts should be updated to return book_number too if possible
        // For now detecting from name
        const detectedBNum = bNum || 0;

        setFormData(prev => ({
          ...prev,
          reference: verseData.reference,
          verse_text: verseData.text,
          book_number: detectedBNum
        }));
      } else {
        toast({ title: "Not Found", description: "Verse not found", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.book_number || !formData.verse_numbers) {
      toast({ title: "Missing Info", description: "Please search and confirm a verse first.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const payload: PeriodicVerse = {
      type,
      period,
      book_number: formData.book_number,
      verse_numbers: formData.verse_numbers,
      note1: formData.note1,
      note2: formData.note2,
      note3: formData.note3,
    };

    const { error } = await savePeriodicVerse(payload);
    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${type === 'monthly' ? 'Monthly' : 'Annual'} verse updated.` });
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="flex items-center gap-2 text-spiritual-blue capitalize">
          {type === 'monthly' ? <Calendar className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          {type} Verse Uploader
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select {type === 'monthly' ? 'Month' : 'Year'}</Label>
            <Input 
              type={type === 'monthly' ? "month" : "number"} 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              min={type === 'annual' ? 2024 : undefined}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={fetchVerse} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'Load Data'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Bible Book</Label>
            <Input 
              placeholder="e.g., John" 
              value={formData.book_name} 
              onChange={e => setFormData({...formData, book_name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3 space-y-2">
              <Label>Verse</Label>
              <Input 
                placeholder="e.g., 3:16" 
                value={formData.verse_numbers} 
                onChange={e => setFormData({...formData, verse_numbers: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searching} className="bg-spiritual-blue hover:bg-blue-700 w-full p-0">
                {searching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {formData.verse_text && (
          <div className="p-4 bg-spiritual-light rounded-lg border border-spiritual-blue/10 animate-fade-in">
            <p className="text-sm italic text-spiritual-blue mb-1">Preview:</p>
            <p className="text-sm font-medium leading-relaxed">"{formData.verse_text}"</p>
            <p className="text-xs text-muted-foreground mt-2">- {formData.reference}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Monthly Message / Meditation</Label>
            <Textarea 
              rows={3} 
              value={formData.note1} 
              onChange={e => setFormData({...formData, note1: e.target.value})}
              placeholder="A message for the congregation..."
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading || !formData.book_number} className="w-full bg-gradient-spiritual text-white">
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save {type} Verse
        </Button>
      </CardContent>
    </Card>
  );
};

export default PeriodicVerseUploader;
