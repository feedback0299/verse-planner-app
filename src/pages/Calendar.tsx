import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, Loader2, BookOpen, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/lib/dbService/supabase';
import { format } from 'date-fns';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import ContestTimeline from '@/components/ContestTimeline';
import ChurchEventsCalendar from '@/components/ChurchEventsCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CalendarPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [contestReadings, setContestReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsResult, readingsResult] = await Promise.all([
          supabase.from('events').select('*').order('date', { ascending: true }),
          supabase.from('contest_readings').select('*').order('day', { ascending: true })
        ]);

        if (eventsResult.error) {
           console.error('Error fetching events:', eventsResult.error);
           // Don't throw, just set empty to allow readings to load
           setEvents([]);
        } else {
           setEvents(eventsResult.data || []);
        }

        if (readingsResult.error) {
           console.error('Error fetching readings:', readingsResult.error);
           setContestReadings([]);
        } else {
           setContestReadings(readingsResult.data || []);
           // Optional: Debug log to verify data count
           console.log(`Loaded ${readingsResult.data?.length} contest readings`);
        }

      } catch (error) {
        console.error('Unexpected error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



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


          <TabsContent value="events" className="space-y-12">
            {/* Events Calendar Section */}
            {/* <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                   <CalendarIcon className="h-6 w-6 text-spiritual-blue" />
                   Monthly Planner
                 </h2>
                 <Badge variant="outline" className="text-slate-500">{events.length} Total Events</Badge>
              </div>
              
              <ChurchEventsCalendar events={events} />
            </div> */}

            {/* Bible Calendar / Contest Section */}
            <div className="space-y-6 pt-6 border-t">
              <div className="flex items-center gap-4">
                 <div className="bg-spiritual-blue/10 p-3 rounded-2xl">
                    <FileSpreadsheet className="text-spiritual-blue w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">70-Day Bible Reading Plan</h2>
                    <p className="text-slate-500 font-medium">Daily portions for Kids, Teens, and Adults</p>
                 </div>
              </div>
              
              <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm">
                 <ContestTimeline readings={contestReadings} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CalendarPage;
