import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Save, X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useVerseContext, VerseEntry } from '@/contexts/VerseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  searchBibleVerse, 
  getBookNumber, 
  getBookNameFromNumber, 
  getVerseTextByCoordinates,
  parseTamilReference,
  parseEnglishReference,
  parseKannadaReference,
  parseHindiReference,
  parseTeluguReference,
  parseMalayalamReference,
  parsePunjabiReference
} from '@/lib/bibleApi';
import { useToast } from '@/hooks/use-toast';

const MonthlyPlanner = () => {
  const { verseEntries, addOrUpdateEntry, getEntry } = useVerseContext();
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [formData, setFormData] = useState<VerseEntry>({
    book_name: '',
    verse_numbers: '',
    verse_text: '',
    reference: '',
    note1: '',
    note2: '',
    note3: '',
    last_updated: ''
  });

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

  const openEditDialog = async (day: number) => {
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    const existingEntry = getEntry(dateKey);
    
    if (existingEntry) {
      setEditingDate(dateKey);
      
      // If we have coordinates but no text/name, resolve it
      if (existingEntry.book_number && existingEntry.verse_numbers && !existingEntry.verse_text) {
          setIsLoadingVerse(true);
          const bookName = getBookNameFromNumber(existingEntry.book_number, currentLanguage) || "";
          const parts = existingEntry.verse_numbers.split(':');
          const cNum = parts.length > 1 ? parseInt(parts[0], 10) : (existingEntry.chapter_number || 1);
          const vNum = parts.length > 1 ? parts[1] : existingEntry.verse_numbers;
          
          const text = await getVerseTextByCoordinates(existingEntry.book_number, cNum, vNum, currentLanguage);
          
          setFormData({
            ...existingEntry,
            book_name: bookName,
            verse_text: text || "",
            reference: `${bookName} ${existingEntry.verse_numbers}`
          });
          setIsLoadingVerse(false);
      } else {
          setFormData(existingEntry);
      }
    } else {
      setEditingDate(dateKey);
      resetFormData();
    }
    setIsDialogOpen(true);
  };

  const searchVerse = async () => {
    if (!formData.book_name || !formData.verse_numbers) {
      toast({
        title: t('messages.missingInfo'),
        description: t('messages.enterBookVerse'),
        variant: "destructive"
      });
      return;
    }

    setIsLoadingVerse(true);
    const reference = `${formData.book_name} ${formData.verse_numbers}`;
    
    try {
      const verseData = await searchBibleVerse(reference, currentLanguage);
      
      if (verseData) {
        // Try to parse coordinates from the returned reference or input
        let bookNum = getBookNumber(formData.book_name, currentLanguage);
        let chapterNum = null;
        let verses = '';

        // Parsing logic depends on format "Book Chapter:Verse"
        let parsed = null;
        if (currentLanguage === 'ta') parsed = parseTamilReference(verseData.reference);
        else if (currentLanguage === 'hi') parsed = parseHindiReference(verseData.reference);
        else if (currentLanguage === 'te') parsed = parseTeluguReference(verseData.reference);
        else if (currentLanguage === 'ka') parsed = parseKannadaReference(verseData.reference);
        else if (currentLanguage === 'ml') parsed = parseMalayalamReference(verseData.reference);
        else if (currentLanguage === 'pu') parsed = parsePunjabiReference(verseData.reference);
        else parsed = parseEnglishReference(verseData.reference);

        if (parsed) {
           bookNum = getBookNumber(parsed.book, currentLanguage);
           chapterNum = parseInt(parsed.chapter, 10);
           verses = parsed.verses;
        }

        setFormData(prev => ({
          ...prev,
          reference: verseData.reference,
          verse_text: verseData.text,
          book_number: bookNum || undefined,
          chapter_number: chapterNum || undefined,
          verse_numbers: chapterNum && verses ? `${chapterNum}:${verses}` : (verses || prev.verse_numbers)
        }));

        toast({
          title: t('messages.verseFound'),
          description: `${t('messages.verseFoundDesc')} ${verseData.reference}`,
        });
      } else {
        toast({
          title: t('messages.verseNotFound'),
          description: t('messages.verseNotFoundDesc'),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('messages.searchError'),
        description: t('messages.searchErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsLoadingVerse(false);
    }
  };

  const saveEntry = () => {
    if (editingDate) {
      if (!formData.book_name || !formData.verse_numbers) {
        toast({
          title: t('messages.missingInfo'),
          description: t('messages.enterBookVerseRequired'),
          variant: "destructive"
        });
        return;
      }

      // Ensure coordinates are present if possible
      let finalBookNum = formData.book_number;
      let finalChapterNum = formData.chapter_number;
      
      if (!finalBookNum) {
          finalBookNum = getBookNumber(formData.book_name, currentLanguage) || undefined;
      }
      
      if (!finalChapterNum && formData.verse_numbers.includes(':')) {
           finalChapterNum = parseInt(formData.verse_numbers.split(':')[0], 10);
      }

      const finalData = {
        ...formData,
        book_number: finalBookNum,
        chapter_number: finalChapterNum,
        // Ensure verse_numbers is in format "Chapter:Verse" if we have coordinates
        verse_numbers: finalChapterNum && formData.verse_numbers && !formData.verse_numbers.includes(':') 
            ? `${finalChapterNum}:${formData.verse_numbers}` 
            : formData.verse_numbers,
      };

      addOrUpdateEntry(editingDate, finalData);
      setIsDialogOpen(false);
      setEditingDate(null);
      resetFormData();
      
      toast({
        title: t('messages.entrySaved'),
        description: t('messages.entrySavedDesc'),
      });
    }
  };

  const resetFormData = () => {
    setFormData({
      book_name: '',
      verse_numbers: '',
      verse_text: '',
      reference: '',
      note1: '',
      note2: '',
      note3: '',
      last_updated: ''
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDate(null);
    resetFormData();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  // Safe access to arrays from translations
  const safeArray = (key: string, fallback: string[]) => {
    const value = t(key);
    return Array.isArray(value) ? value : fallback;
  };

  const dayNamesFull = safeArray('calendar.monthly.dayNamesFull', [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]);


  const monthNames = safeArray('calendar.daily.monthNames', [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]);

  // const currentMonthName = monthNames[currentDate.getMonth()] || 'Month';

  return (
    <div className="min-h-screen bg-gradient-peaceful p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-spiritual-blue mb-2">{t('calendar.monthly.title')}</h1>
          <p className="text-muted-foreground">{t('calendar.monthly.subtitle')}</p>
        </div>

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
              
              {/* Month name */}
              <CardTitle className="text-2xl text-spiritual-blue">
                {t('calendar.daily.monthNames')[currentDate.getMonth()]} {currentDate.getFullYear()}
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
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Day headers */}
              {dayNamesFull.map((day, index) => (
                <div key={index} className="p-3 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="h-32"></div>
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
                const entry = getEntry(dateKey);
                const isToday = isCurrentMonth && day === today.getDate();

                return (
                  <Card 
                    key={day} 
                    className={`h-32 transition-all duration-200 hover:shadow-card cursor-pointer ${
                      isToday ? 'ring-2 ring-spiritual-gold' : ''
                    }`}
                    onClick={() => openEditDialog(day)}
                  >
                    <CardContent className="p-2 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isToday ? 'text-spiritual-gold' : 'text-foreground'}`}>
                          {day}
                        </span>
                        {entry ? (
                          <Edit className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      
                      {entry && (
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-medium text-spiritual-blue mb-1 truncate">
                            {entry.reference || `${entry.book_name} ${entry.verse_numbers}`}
                          </div>
                          {entry.note1 && (
                            <div className="text-xs text-muted-foreground truncate">
                              {entry.note1}
                            </div>
                          )}
                          {entry.note2 && (
                            <div className="text-xs text-muted-foreground truncate">
                              {entry.note2}
                            </div>
                          )}
                          {entry.note3 && (
                            <div className="text-xs text-muted-foreground truncate">
                              {entry.note3}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-spiritual-blue">
                {editingDate && getEntry(editingDate) ? t('verseDialog.editTitle') : t('verseDialog.addTitle')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="book" className="text-sm font-medium">{t('verseDialog.book')}</Label>
                  <Input
                    id="book"
                    placeholder={t('verseDialog.bookPlaceholder')}
                    value={formData.book_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, book_name: e.target.value }))}
                    className="border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="verse" className="text-sm font-medium">{t('verseDialog.verse')}</Label>
                    <Input
                      id="verse"
                      placeholder={t('verseDialog.versePlaceholder')}
                      value={formData.verse_numbers}
                      onChange={(e) => setFormData(prev => ({ ...prev, verse_numbers: e.target.value }))}
                      className="border-border"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      onClick={searchVerse}
                      disabled={isLoadingVerse || !formData.book_name || !formData.verse_numbers}
                      className="bg-gradient-spiritual text-primary-foreground"
                    >
                      {isLoadingVerse ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {formData.verse_text && (
                <div>
                  <Label className="text-sm font-medium text-spiritual-blue">{t('verseDialog.verseText')}</Label>
                  <div className="p-3 bg-spiritual-light rounded-lg border border-border">
                    <p className="text-sm text-foreground leading-relaxed">
                      "{formData.verse_text}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      - {formData.reference}
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="note1" className="text-sm font-medium">{t('verseDialog.reflection')}</Label>
                <Textarea
                  id="note1"
                  placeholder={t('verseDialog.reflectionPlaceholder')}
                  value={formData.note1}
                  onChange={(e) => setFormData(prev => ({ ...prev, note1: e.target.value }))}
                  className="border-border resize-none"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="note2" className="text-sm font-medium">{t('verseDialog.prayer')}</Label>
                <Textarea
                  id="note2"
                  placeholder={t('verseDialog.prayerPlaceholder')}
                  value={formData.note2}
                  onChange={(e) => setFormData(prev => ({ ...prev, note2: e.target.value }))}
                  className="border-border resize-none"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="note3" className="text-sm font-medium">{t('verseDialog.additionalNotes')}</Label>
                <Textarea
                  id="note3"
                  placeholder={t('verseDialog.additionalNotesPlaceholder')}
                  value={formData.note3}
                  onChange={(e) => setFormData(prev => ({ ...prev, note3: e.target.value }))}
                  className="border-border resize-none"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveEntry} className="flex-1 bg-gradient-spiritual text-primary-foreground">
                  <Save className="h-4 w-4 mr-2" />
                  {t('verseDialog.save')}
                </Button>
                <Button variant="outline" onClick={closeDialog} className="border-border">
                  <X className="h-4 w-4 mr-2" />
                  {t('verseDialog.cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MonthlyPlanner;