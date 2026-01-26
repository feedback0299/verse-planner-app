import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/dbService/supabase';
import { Loader2, Upload, Calendar as CalendarIcon, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSunday, isSameMonth, addMonths, getDay } from 'date-fns';

import ContestGraph from '@/components/ContestGraph';
import ContestTimeline from '@/components/ContestTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ContestAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const { toast } = useToast();

  const fetchReadings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contest_readings')
      .select('*')
      .order('day', { ascending: true });
    
    if (error) console.error('Error fetching readings:', error);
    else setReadings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const allData: any[] = [];

        // Process Sheet 1: Kids & Teens
        const kidsSheetName = wb.SheetNames[0];
        const kidsSheet = wb.Sheets[kidsSheetName];
        const kidsRows: any[] = XLSX.utils.sheet_to_json(kidsSheet);
        
        kidsRows.forEach((row: any) => {
          if (row.Day || row.day || row['Day ']) {
            allData.push({
              day: parseInt(row.Day || row.day || row['Day ']),
              category: 'kids_teens',
              psalms: row['Psalms / சங்கீதம்'] || row.Psalms || row.psalms,
              proverbs: row['Proverbs / நீதிமொழிகள்'] || row.Proverbs || row.proverbs,
              new_testament: row['New Testament / புதிய ஏற்பாடு'] || row['New Testament'] || row.nt
            });
          }
        });

        // Process Sheet 2: Adults
        const adultsSheetName = wb.SheetNames[1];
        if (adultsSheetName) {
          const adultsSheet = wb.Sheets[adultsSheetName];
          const adultsRows: any[] = XLSX.utils.sheet_to_json(adultsSheet);
          
          adultsRows.forEach((row: any) => {
            if (row.Day || row.day || row['Day ']) {
              allData.push({
                day: parseInt(row.Day || row.day || row['Day ']),
                category: 'adult',
                psalms: row['Psalms / சங்கீதம்'] || row.Psalms || row.psalms,
                proverbs: row['Proverbs / நீதிமொழிகள்'] || row.Proverbs || row.proverbs,
                new_testament: row['New Testament / புதிய ஏற்பாடு'] || row['New Testament'] || row.nt,
                old_testament: row['Old Testament / பழைய ஏற்பாடு'] || row['Old Testament'] || row.ot || row['Old Testament ']
              });
            }
          });
        }

        if (allData.length === 0) {
          throw new Error("No valid data found in the spreadsheet. Please check columns.");
        }

        // Upsert data to Supabase
        const { error } = await supabase
          .from('contest_readings')
          .upsert(allData, { onConflict: 'day,category' });

        if (error) throw error;

        toast({
          title: "Upload Successful",
          description: `Imported ${allData.length} entries for both categories.`,
        });
        fetchReadings();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error.message,
        });
      } finally {
        setUploading(false);
        e.target.value = ''; // Reset input
      }
    };

    reader.readAsBinaryString(file);
  };





  // Sample data for participant graph
  const generateSampleParticipants = () => {
    const participants = [];
    const names = [
      'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 'David Brown',
      'Emily Davis', 'James Wilson', 'Mary Garcia', 'Robert Martinez', 'Patricia Rodriguez',
      'William Anderson', 'Jennifer Taylor', 'Richard Thomas', 'Linda Moore', 'Charles Jackson',
      'Barbara White', 'Joseph Harris', 'Susan Martin', 'Thomas Thompson', 'Jessica Lee',
      'Christopher Allen', 'Karen Young', 'Daniel King', 'Nancy Wright', 'Matthew Lopez',
      'Betty Hill', 'Mark Scott', 'Margaret Green', 'Donald Adams', 'Lisa Baker',
      'Paul Nelson', 'Sandra Carter', 'Andrew Mitchell', 'Ashley Roberts', 'Joshua Turner',
      'Kimberly Phillips', 'Kenneth Campbell', 'Donna Parker', 'Kevin Evans', 'Michelle Edwards',
      'Steven Collins', 'Carol Stewart', 'Brian Morris', 'Amanda Nguyen', 'George Murphy',
      'Melissa Rivera', 'Edward Cooper', 'Deborah Bailey', 'Ronald Reed', 'Stephanie Cook',
      'Timothy Morgan', 'Rebecca Bell', 'Jason Murphy', 'Laura Wood', 'Jeffrey Barnes',
      'Sharon Ross', 'Ryan Henderson', 'Cynthia Coleman', 'Jacob Jenkins', 'Kathleen Perry',
      'Gary Powell', 'Amy Long', 'Nicholas Patterson', 'Shirley Hughes', 'Eric Flores',
      'Angela Washington', 'Stephen Butler', 'Helen Simmons', 'Jonathan Foster', 'Anna Gonzales'
    ];

    const startDate = new Date(2026, 1, 1); // Feb 1, 2026 - Contest start

    // Generate participants with varying density
    for (let i = 0; i < 70; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Varying participation: more at beginning, some days with multiple, some with none
      let count = 0;
      if (i < 10) {
        // First 10 days: high activity (2-5 participants)
        count = Math.floor(Math.random() * 4) + 2;
      } else if (i < 30) {
        // Days 10-30: moderate activity (0-3 participants)
        count = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      } else if (i < 50) {
        // Days 30-50: lower activity (0-2 participants)
        count = Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : 0;
      } else {
        // Days 50-70: sporadic activity (0-1 participants)
        count = Math.random() > 0.7 ? 1 : 0;
      }

      // Add participants for this day
      for (let j = 0; j < count; j++) {
        const nameIndex = (i * 3 + j) % names.length;
        participants.push({
          name: names[nameIndex],
          joinDate: dateStr
        });
      }
    }

    return participants;
  };

  const sampleParticipants = generateSampleParticipants();
  const contestStartDate = '2026-02-01';

  // Weekday labels


  return (

      <div className="p-8 max-w-7xl mx-auto space-y-10">
        {/* Premium Import Section */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-spiritual-blue to-green-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity duration-500"></div>
          <Card className="relative border shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b bg-slate-50/30 p-6 md:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-600/10 p-3 rounded-2xl">
                      <FileSpreadsheet className="text-green-600 w-7 h-7" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Portion Scheduler</CardTitle>
                      <CardDescription className="text-slate-500 font-semibold text-sm">Bulk import reading portions using Excel or Google Sheets (CSV/XLSX).</CardDescription>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto">
                   <Input
                    type="file"
                    id="excel-upload"
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button 
                    asChild
                    size="lg"
                    className="w-full lg:w-auto h-14 px-10 bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20 text-lg font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]" 
                    disabled={uploading}
                  >
                    <label htmlFor="excel-upload" className="cursor-pointer flex items-center justify-center gap-3">
                      {uploading ? <Loader2 className="animate-spin w-6 h-6" /> : <Upload className="w-6 h-6" />}
                      {uploading ? "Processing..." : "Upload Portion Schedule"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                 <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                   <div className="bg-green-50 p-3 rounded-xl">
                     <CheckCircle2 className="text-green-500 w-5 h-5" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-800">Sheet 1: Kids & Teens</p>
                     <p className="text-xs text-slate-500 mt-1">Dedicated schedules for the younger generation.</p>
                   </div>
                 </div>
                 
                 <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                   <div className="bg-green-50 p-3 rounded-xl">
                     <CheckCircle2 className="text-green-500 w-5 h-5" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-800">Sheet 2: Adults</p>
                     <p className="text-xs text-slate-500 mt-1">Portions tailored for the adult reading group.</p>
                   </div>
                 </div>

                 <div className="p-5 rounded-2xl bg-spiritual-blue/5 border border-spiritual-blue/10 shadow-sm flex items-start gap-4">
                   <div className="bg-spiritual-blue/10 p-3 rounded-xl">
                     <AlertCircle className="text-spiritual-blue w-5 h-5" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-800">Required Columns</p>
                     <p className="text-[11px] text-slate-500 mt-1 font-mono uppercase">Day, OT, Psalms, Proverbs, NT</p>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <CalendarIcon className="text-spiritual-blue w-8 h-8" />
                Contest Overview
                <span className="text-lg font-medium text-slate-400 ml-2">Feb - Apr 2026</span>
              </h2>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="timeline" className="data-[state=active]:bg-spiritual-blue data-[state=active]:text-white">
                  Contest Timeline
                </TabsTrigger>
                <TabsTrigger value="participants" className="data-[state=active]:bg-spiritual-blue data-[state=active]:text-white">
                  Participant Progress
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0">
               <ContestTimeline readings={readings} />
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants" className="mt-0">
              <ContestGraph 
                startDate={contestStartDate}
                participants={sampleParticipants}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
};


export default ContestAdmin;
