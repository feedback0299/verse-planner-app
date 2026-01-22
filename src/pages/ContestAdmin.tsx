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
import AdminAuthWrapper from '@/components/AdminAuthWrapper';

const ContestAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
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

  const loginLogic = async (email: string, pass: string) => {
    if (email === 'admin' && pass === 'admin') {
      return { 
        success: true, 
        session: { user: { email: 'admin', name: 'Church Admin' } },
        message: "Welcome Admin"
      };
    }
    return { success: false };
  };

  // Calendar Logic for Feb, Mar, Apr 2026
  const months = [
    new Date(2026, 1, 1), // Feb
    new Date(2026, 2, 1), // Mar
    new Date(2026, 3, 1), // Apr
  ];

  const getDayInfo = (date: Date) => {
    // Calculate Contest Day
    const contestStart = new Date(2026, 1, 1);
    const diffTime = date.getTime() - contestStart.getTime();
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (dayNum < 1 || dayNum > 70) return null;

    const kidsPortion = readings.find(r => r.day === dayNum && r.category === 'kids_teens');
    const adultPortion = readings.find(r => r.day === dayNum && r.category === 'adult');

    const timing = isSunday(date) 
      ? "Sun: After 14:00 (After 3rd Service)" 
      : "Mon-Sat: 12:00 - 14:00";

    return { dayNum, kidsPortion, adultPortion, timing };
  };

  // Weekday labels
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AdminAuthWrapper
      title="70-Day Contest Manager"
      subtitle="Excel Upload & Portion Scheduling"
      sessionKey="admin_session"
      loginLogic={loginLogic}
    >
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

        {/* Calendar Section */}
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <CalendarIcon className="text-spiritual-blue w-8 h-8" />
              Contest Timeline
              <span className="text-lg font-medium text-slate-400 ml-2">Feb - Apr 2026</span>
            </h2>
          </div>

          <div className="space-y-16">
            {months.map((monthDate) => {
              const start = startOfMonth(monthDate);
              const end = endOfMonth(monthDate);
              const days = eachDayOfInterval({ start, end });
              const emptyDays = getDay(start);
              
              return (
                <div key={monthDate.toString()} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold text-spiritual-blue min-w-[200px]">
                      {format(monthDate, 'MMMM yyyy')}
                    </h3>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-3">
                    {/* Weekday Headers */}
                    {WEEKDAYS.map(day => (
                      <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] pb-4">
                        {day}
                      </div>
                    ))}

                    {/* Empty Padding Cells */}
                    {Array.from({ length: emptyDays }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[140px] rounded-2xl bg-slate-50/50 border border-dashed border-slate-100/50" />
                    ))}

                    {/* Actual Days */}
                    {days.map((date) => {
                      const info = getDayInfo(date);
                      const isSun = isSunday(date);

                      if (!info) return (
                        <div key={date.toString()} className="min-h-[140px] p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-center group">
                          <span className="text-slate-300 font-bold text-xl group-hover:text-slate-400 transition-colors">{format(date, 'd')}</span>
                          <span className="text-[10px] text-slate-300 font-medium uppercase tracking-tighter mt-1">N/A</span>
                        </div>
                      );

                      return (
                        <Card key={date.toString()} className={`min-h-[160px] flex flex-col overflow-hidden group hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-spiritual-blue/30 ${isSun ? 'ring-2 ring-spiritual-gold/10' : ''}`}>
                          <div className={`px-3 py-2 border-b flex justify-between items-center ${isSun ? 'bg-spiritual-gold/5' : 'bg-slate-50/50'}`}>
                            <span className={`font-black text-xl ${isSun ? 'text-spiritual-gold' : 'text-slate-900'}`}>{format(date, 'd')}</span>
                            <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSun ? 'bg-spiritual-gold text-white' : 'bg-spiritual-blue text-white'}`}>
                              DAY {info.dayNum}
                            </div>
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider">Kids & Teens</p>
                                  <div className="grid grid-cols-1 gap-1">
                                    <div className="text-[10px] bg-blue-50/50 p-1.5 rounded border border-blue-100/50">
                                      <span className="font-bold text-blue-700">Psalms:</span> {info.kidsPortion?.psalms || "—"}
                                    </div>
                                    <div className="text-[10px] bg-blue-50/50 p-1.5 rounded border border-blue-100/50">
                                      <span className="font-bold text-blue-700">Prov/NT:</span> {info.kidsPortion ? `${info.kidsPortion.proverbs}, ${info.kidsPortion.new_testament}` : "—"}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <p className="text-[8px] font-black text-spiritual-gold uppercase tracking-wider">Adults</p>
                                  <div className="grid grid-cols-1 gap-1">
                                    {info.adultPortion?.old_testament && (
                                      <div className="text-[10px] bg-orange-50/50 p-1.5 rounded border border-orange-100/50">
                                        <span className="font-bold text-spiritual-gold">OT:</span> {info.adultPortion.old_testament}
                                      </div>
                                    )}
                                    <div className="text-[10px] bg-orange-50/50 p-1.5 rounded border border-orange-100/50">
                                      <span className="font-bold text-spiritual-gold">Psalms:</span> {info.adultPortion?.psalms || "—"}
                                    </div>
                                    <div className="text-[10px] bg-orange-50/50 p-1.5 rounded border border-orange-100/50">
                                      <span className="font-bold text-spiritual-gold">Prov/NT:</span> {info.adultPortion ? `${info.adultPortion.proverbs}, ${info.adultPortion.new_testament}` : "—"}
                                    </div>
                                  </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity mt-2">
                               <div className={`w-1.5 h-1.5 rounded-full ${isSun ? 'bg-spiritual-gold' : 'bg-spiritual-blue'}`}></div>
                               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                 {isSun ? "After 14:00" : "12:00 - 14:00"}
                               </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminAuthWrapper>
  );
};

export default ContestAdmin;
