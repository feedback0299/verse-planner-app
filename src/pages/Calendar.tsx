import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CalendarPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-spiritual-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 text-spiritual-blue">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="bible" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
               <h1 className="text-4xl font-bold mb-2">Church Calendar</h1>
               <p className="text-slate-500">Bible verses and church events in one place</p>
            </div>
            <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
              <TabsTrigger value="bible" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Bible Calendar
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Church Events
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bible" className="mt-0">
             <DailyVerseCalendar />
          </TabsContent>

          <TabsContent value="events">
            <div className="grid gap-6">
              {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border shadow-sm">
                  <p className="text-gray-500">No upcoming events scheduled at this time.</p>
                </div>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-spiritual-gold">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4 text-spiritual-blue" />
                              <span>{format(new Date(event.date), 'MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-spiritual-blue" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-spiritual-blue" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-2">{event.description}</p>
                        </div>
                        <Badge className="bg-spiritual-blue hover:bg-blue-700">Upcoming</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CalendarPage;
