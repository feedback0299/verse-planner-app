import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface VerseEntry {
  book: string;
  verse: string;
  note1: string;
  note2: string;
  note3: string;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthlyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [verseEntries, setVerseEntries] = useState<Record<string, VerseEntry>>({});
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<VerseEntry>({
    book: '',
    verse: '',
    note1: '',
    note2: '',
    note3: ''
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

  const openEditDialog = (day: number) => {
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    const existingEntry = verseEntries[dateKey];
    
    setEditingDate(dateKey);
    setFormData(existingEntry || {
      book: '',
      verse: '',
      note1: '',
      note2: '',
      note3: ''
    });
    setIsDialogOpen(true);
  };

  const saveEntry = () => {
    if (editingDate) {
      setVerseEntries(prev => ({
        ...prev,
        [editingDate]: formData
      }));
      setIsDialogOpen(false);
      setEditingDate(null);
      setFormData({
        book: '',
        verse: '',
        note1: '',
        note2: '',
        note3: ''
      });
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDate(null);
    setFormData({
      book: '',
      verse: '',
      note1: '',
      note2: '',
      note3: ''
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="min-h-screen bg-gradient-peaceful p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-spiritual-blue mb-2">Monthly Bible Planner</h1>
          <p className="text-muted-foreground">Plan and organize your daily Bible study</p>
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
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
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
                const entry = verseEntries[dateKey];
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
                            {entry.book} {entry.verse}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-spiritual-blue">
                {editingDate && verseEntries[editingDate] ? 'Edit' : 'Add'} Bible Study Entry
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="book" className="text-sm font-medium">Bible Book</Label>
                  <Input
                    id="book"
                    placeholder="e.g., Psalms"
                    value={formData.book}
                    onChange={(e) => setFormData(prev => ({ ...prev, book: e.target.value }))}
                    className="border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="verse" className="text-sm font-medium">Verse</Label>
                  <Input
                    id="verse"
                    placeholder="e.g., 23:1"
                    value={formData.verse}
                    onChange={(e) => setFormData(prev => ({ ...prev, verse: e.target.value }))}
                    className="border-border"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="note1" className="text-sm font-medium">Note 1</Label>
                <Textarea
                  id="note1"
                  placeholder="Personal reflection or study note..."
                  value={formData.note1}
                  onChange={(e) => setFormData(prev => ({ ...prev, note1: e.target.value }))}
                  className="border-border resize-none"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="note2" className="text-sm font-medium">Note 2</Label>
                <Textarea
                  id="note2"
                  placeholder="Prayer request or application..."
                  value={formData.note2}
                  onChange={(e) => setFormData(prev => ({ ...prev, note2: e.target.value }))}
                  className="border-border resize-none"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="note3" className="text-sm font-medium">Note 3</Label>
                <Textarea
                  id="note3"
                  placeholder="Additional thoughts..."
                  value={formData.note3}
                  onChange={(e) => setFormData(prev => ({ ...prev, note3: e.target.value }))}
                  className="border-border resize-none"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveEntry} className="flex-1 bg-gradient-spiritual text-primary-foreground">
                  <Save className="h-4 w-4 mr-2" />
                  Save Entry
                </Button>
                <Button variant="outline" onClick={closeDialog} className="border-border">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
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