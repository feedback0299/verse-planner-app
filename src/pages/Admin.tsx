import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Plus, Trash2, UserPlus, Users, Video, ExternalLink, 
  FileSpreadsheet, ShieldCheck, Calendar, LogOut, Download as DownloadIcon, 
  Eye, AlertCircle as AlertCircleIcon, Download, Mail, Send, QrCode
} from 'lucide-react';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import MonthlyPlanner from '@/components/MonthlyPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, Link } from 'react-router-dom';
import { generateReadingPDF, getReadingPdfBlobUrl, generateAttendancePDF, getAttendancePdfBlobUrl } from '@/lib/utils/portionPdfUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  


  /* State for Participants */
  const [participants, setParticipants] = useState<any[]>([]);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [branchOption, setBranchOption] = useState('main'); // 'main' | 'branch'
  const [customBranch, setCustomBranch] = useState('');
  const [editAddress, setEditAddress] = useState('');

  /* Filter & Pagination State */
  const [filterInput, setFilterInput] = useState({ name: '', phone: '', branchType: 'all', mode: 'all' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', phone: '', branchType: 'all', mode: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* Email Broadcast State */
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState({ current: 0, total: 0 });

  /* Confirmation Dialog State */
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    onConfirm: () => void;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [broadcastReport, setBroadcastReport] = useState<{
    isOpen: boolean;
    failures: { email: string; reason: string }[];
  }>({
    isOpen: false,
    failures: [],
  });

  useEffect(() => {
    fetchParticipants();
    fetchContestReadings();
  }, []);

  const handleSearch = () => {
    setAppliedFilters(filterInput);
    setCurrentPage(1);
  };

  const handleClear = () => {
    const defaultFilters = { name: '', phone: '', branchType: 'all', mode: 'all' };
    setFilterInput(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
  };

  /* Filter Logic */
  const filteredParticipants = participants.filter(p => {
      const matchName = p.full_name?.toLowerCase().includes(appliedFilters.name.toLowerCase()) || false;
      const matchPhone = p.phone_number?.includes(appliedFilters.phone) || false;
      
      let matchBranch = true;
      if (appliedFilters.branchType === 'main') {
          matchBranch = p.church_branch === '1';
      } else if (appliedFilters.branchType === 'branch') {
          matchBranch = p.church_branch === '2';
      }

      let matchMode = true;
      if (appliedFilters.mode !== 'all') {
          matchMode = p.participation_mode === appliedFilters.mode;
      }

      return matchName && matchPhone && matchBranch && matchMode;
  });

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const paginatedParticipants = filteredParticipants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchParticipants = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      const { data: progress, error: progressError } = await supabase
          .from('contest_progress')
          .select('user_id, progress_mask');

      if (progressError) console.error("Error fetching progress", progressError);

      // Merge data
      const merged = profiles?.map(p => {
          const prog = progress?.find(pr => pr.user_id === p.id);
          const daysParticipated = prog && prog.progress_mask 
              ? prog.progress_mask.split('').filter((c: string) => c === '1').length 
              : 0;
          return { ...p, daysParticipated };
      }) || [];

      setParticipants(merged);
    } catch (err) {
      console.error("Error fetching participants:", err);
      setParticipants([]);
    }
  };

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("PDF Preview");

  const handlePreview = async (category: 'kids_teens' | 'adult', type: 'portion' | 'attendance' = 'portion') => {
    const data = contestReadings.filter(r => r.category === category);
    if (data.length > 0) {
      setPreviewPdfUrl(null);
      setPreviewTitle(type === 'portion' ? "Reading Portion Preview" : "Attendance Sheet Preview");
      setIsPreviewOpen(true);
      
      // Use setTimeout to allow the dialog to open with a loader before the heavy PDF generation starts
      setTimeout(() => {
        try {
          const url = type === 'portion' 
            ? getReadingPdfBlobUrl(data, category)
            : getAttendancePdfBlobUrl(data, category);
          setPreviewPdfUrl(url);
        } catch (err) {
          console.error("PDF Preview Error:", err);
          toast({ 
            variant: "destructive", 
            title: "Preview Failed", 
            description: "An error occurred while generating the PDF preview." 
          });
          setIsPreviewOpen(false);
        }
      }, 100);
    }
  };

  const [contestReadings, setContestReadings] = useState<any[]>([]);
  const fetchContestReadings = async () => {
    const { data, error } = await supabase
      .from('contest_readings')
      .select('*')
      .order('day', { ascending: true });
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch reading portions." });
    } else {
      setContestReadings(data || []);
    }
  };

  const handleEditParticipant = (participant: any) => {
    setEditingParticipant(participant);
    setEditAddress(participant.city_location || '');
    
    // Determine branch state from current church_branch
    if (participant.church_branch === '1') {
        setBranchOption('main');
        setCustomBranch('');
    } else {
        setBranchOption('branch');
        setCustomBranch(participant.church_branch_name || '');
    }
    setEditDialogOpen(true);
  };

  const saveParticipantChanges = async () => {
    if (!editingParticipant) return;
    
    setLoading(true);
    try {
      const newBranchCode = branchOption === 'main' ? '1' : '2';
      const newBranchName = branchOption === 'branch' ? customBranch : null;
      
      console.log("Saving changes for ID:", editingParticipant.id);
      console.log("Payload:", {
          church_branch: newBranchCode,
          church_branch_name: newBranchName,
          city_location: editAddress
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
            church_branch: newBranchCode,
            church_branch_name: newBranchName,
            city_location: editAddress
        })
        .eq('id', editingParticipant.id)
        .select();

      if (error) {
        console.error("Supabase Detailed Error:", error);
        let description = error.message;
        
        if (error.code === '42703') {
            description = "Database columns missing. Please create 'church_branch' and 'church_branch_name' (Text) in Supabase.";
        } else if (error.code === 'PGRST116') {
            description = "Record not found.";
        }
        
        toast({ 
            variant: "destructive", 
            title: "Update Failed", 
            description: description
        });
      } else if (!data || data.length === 0) {
        console.warn("Update success but 0 rows affected. This usually means Supabase RLS policies are blocking updates.");
        toast({ 
            variant: "destructive", 
            title: "Access Denied / No-Op", 
            description: "The database received the update but refused to change anything. Ensure Row Level Security (RLS) policies allow 'Update' for this record." 
        });
      } else {
        console.log("DB CONFIRMED UPDATE:", data[0]);
        toast({ title: "Updated", description: `Record for ${editingParticipant.full_name} updated successfully.` });
        setEditDialogOpen(false);
        fetchParticipants();
      }
    } catch (err: any) {
      console.error("General Error:", err);
      toast({ variant: "destructive", title: "System Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* Separated execution logic for Broadcast */
  const executeBroadcast = async () => {
    // 1. Filter: Valid Email AND Not Sent Yet
    const participantsToEmail = participants.filter(p => !!p.email && !p.welcome_email_sent);
    
    setConfirmDialog(prev => ({ ...prev, isOpen: false })); // Close dialog
    setBroadcasting(true);
    setBroadcastProgress({ current: 0, total: participantsToEmail.length });

    let successCount = 0;
    let failCount = 0;
    let invalidCount = 0;
    const alreadySentCount = participants.filter(p => !!p.email && p.welcome_email_sent).length;
    
    // Track detailed failures for report
    let currentFailures: { email: string; reason: string }[] = [];

    // Prepare headers once
    const isBypass = localStorage.getItem('admin_bypass') === 'true';
    let headers: Record<string, string> = {};
    if (isBypass) {
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__jGBBI1KtA8NOtdR5kKXjw_CMth1tkg';
        headers = { Authorization: `Bearer ${anonKey}` };
    } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            headers = { Authorization: `Bearer ${session.access_token}` };
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const BATCH_SIZE = 5;

    for (let i = 0; i < participantsToEmail.length; i += BATCH_SIZE) {
        const chunk = participantsToEmail.slice(i, i + BATCH_SIZE);
        
        // Prepare valid recipients for this batch
        const validRecipients = [];
        for (const p of chunk) {
            if (!p.email || !emailRegex.test(p.email)) {
                console.warn(`Skipping invalid email: ${p.email}`);
                invalidCount++;
                currentFailures.push({ email: p.email || "Unknown", reason: "Invalid Email Format" });
                setBroadcastProgress(prev => ({ ...prev, current: prev.current + 1 }));
            } else {
                validRecipients.push({ 
                    full_name: p.full_name || p.username || "Participant", 
                    email: p.email,
                    id: p.id
                });
            }
        }

        if (validRecipients.length > 0) {
            // 2. Add to Queue Batch
            const queueInserts = validRecipients.map(recipient => ({
                recipient_email: recipient.email,
                recipient_name: recipient.full_name,
                subject: "தேவ கிருபையினால் 70 நாட்களில் வேதாகம வாசிப்பு முயற்சி / 70-day journey of reading the Bible by God’s grace.",
                status: 'pending',
                scheduled_for: new Date().toISOString() // Send "Now"
            }));

            const { error: queueError } = await supabase
                .from('mail_queue')
                .insert(queueInserts);

            if (queueError) {
                console.error("Queue Insert Error:", queueError);
                failCount += validRecipients.length;
                currentFailures.push({ email: "Batch", reason: `Queue DB Error: ${queueError.message}` });
                setBroadcastProgress(prev => ({ ...prev, current: prev.current + validRecipients.length }));
            } else {
                successCount += validRecipients.length;
                setBroadcastProgress(prev => ({ ...prev, current: prev.current + validRecipients.length }));
            }
        }
    }
    
    // Trigger Worker to start processing immediately
    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rwafjkkdflwfcuuhqepv.supabase.co';
        await fetch(`${supabaseUrl}/functions/v1/process-email-queue`, {
            method: 'POST',
             headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}) // Just trigger
        });
        toast({ title: "Broadcast Queued", description: "Emails have been added to the queue and will be processed in the background." });
    } catch (e) {
        console.warn("Could not trigger worker automatically, it will run on schedule", e);
    }

    setBroadcasting(false);
    toast({
        title: "Broadcast Queued",
        description: `${successCount} emails added to queue. They are sending in the background. Failures: ${failCount}.`,
        variant: "default"
    });
    
    // Open Failure Report only for insert errors
    if (currentFailures.length > 0) {
        setBroadcastReport({ isOpen: true, failures: currentFailures });
    }
    
    // Refresh list 
    fetchParticipants();
  };

  const handleBroadcastWelcomeEmails = async () => {
    // 1. Filter: Valid Email AND Not Sent Yet
    const participantsToEmail = participants.filter(p => !!p.email && !p.welcome_email_sent);
    const alreadySentCount = participants.filter(p => !!p.email && p.welcome_email_sent).length;
    
    if (participantsToEmail.length === 0) {
      toast({
        title: "Nothing to Send",
        description: `All ${alreadySentCount} participants with emails have already received the welcome message.`,
      });
      return;
    }

    setConfirmDialog({
        isOpen: true,
        title: "Confirm Broadcast",
        description: (
            <div className="space-y-2">
                <p>Found <strong>{participantsToEmail.length}</strong> unsent participants.</p>
                <p className="text-sm text-slate-500">({alreadySentCount} skipped as already sent)</p>
                <p>Send welcome email to these {participantsToEmail.length} people?</p>
            </div>
        ),
        confirmLabel: "Yes, Send Broadcast",
        onConfirm: executeBroadcast
    });
  };

  const executeTestEmail = async () => {
    const testEmail = "feedback0299@gmail.com";
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setBroadcasting(true);
    
    try {
      // 0. Check Manual Bypass
      const isBypass = localStorage.getItem('admin_bypass') === 'true';
      let headers = {};
      
      if (isBypass) {
          // In bypass mode, use the Anon Key to satisfy Edge Function JWT requirement
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__jGBBI1KtA8NOtdR5kKXjw_CMth1tkg';
          headers = { Authorization: `Bearer ${anonKey}` };
      } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
              headers = { Authorization: `Bearer ${session.access_token}` };
          }
      }

      console.log("Sending Test Email...", isBypass ? "(Bypass Mode - Anon Key)" : "(Auth Mode - User Token)");

      // Construct Function URL manually to avoid Client interference
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rwafjkkdflwfcuuhqepv.supabase.co';
      const functionUrl = `${supabaseUrl}/functions/v1/send-welcome-email`;
      
      const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              ...headers // { Authorization: Bearer ... }
          },
          body: JSON.stringify({ full_name: "Test User", email: testEmail })
      });

      if (!response.ok) {
          const errorText = await response.text();
          let errorJson;
          try { errorJson = JSON.parse(errorText); } catch(e) {}
          
          throw new Error(errorJson?.message || errorJson?.error || `Function Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Email Function Success:", data);

      toast({ title: "Test Sent", description: `Email sent to ${testEmail}` });
    } catch (err: any) {
       console.error("Test Email Error:", err);
       toast({ variant: "destructive", title: "Test Failed", description: err.message });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleTestEmail = async () => {
    const testEmail = "feedback0299@gmail.com";
    setConfirmDialog({
        isOpen: true,
        title: "Send Test Email",
        description: `Are you sure you want to send a test email to ${testEmail}?`,
        confirmLabel: "Send Test",
        onConfirm: executeTestEmail
    });
  };


   return (
      <div className="px-4 py-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10">
        {/* Dashboard Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight text-spiritual-blue">Control Center</h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">Manage church events, contest schedules, and video rooms.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             {/* ... existing header buttons ... */}
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
              onClick={() => {
                localStorage.removeItem('admin_session');
                navigate('/');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
            <div className="bg-spiritual-blue/10 p-3 rounded-xl hidden md:block">
               <ShieldCheck className="w-8 h-8 text-spiritual-blue" />
            </div>
          </div>
        </div>

        {/* Quick Actions / Featured Apps */}
        <div className="space-y-4">
           {/* ... existing cards ... */}
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Plus className="text-spiritual-blue w-5 h-5" />
            Core Management
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="group cursor-pointer hover:shadow-xl transition-all border-t-4 border-t-spiritual-gold bg-white relative overflow-hidden" 
              onClick={() => navigate('/admin/contest')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-3 text-slate-900">
                  <div className="bg-spiritual-gold/10 p-2 rounded-lg group-hover:bg-spiritual-gold/20 transition-colors">
                    <FileSpreadsheet className="text-spiritual-gold w-6 h-6" />
                  </div>
                  70-Day Contest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 leading-relaxed">Upload Excel reading schedules, manage portion timings, and view contest timelines.</p>
                <div className="mt-6 flex items-center text-sm font-bold text-spiritual-gold group-hover:gap-2 transition-all">
                  Open Contest Manager <span>→</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all border-t-4 border-t-spiritual-blue bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-3 text-slate-900">
                  <div className="bg-spiritual-blue/10 p-2 rounded-lg text-spiritual-blue">
                    <Users className="w-6 h-6" />
                  </div>
                  Member Registry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 leading-relaxed">View and manage church member registrations and profiles.</p>
                <Button variant="link" className="p-0 h-auto mt-4 text-spiritual-blue font-bold">Coming Soon</Button>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-xl transition-all border-t-4 border-t-slate-800 bg-white"
              onClick={async () => {
                try {
                  toast({ title: "Generating...", description: "Fetching high-res QR code..." });
                  const imageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=2000x2000&qzone=2&data=https://preview--verse-planner-app.lovable.app/login";
                  const response = await fetch(imageUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = "athumanesar-banner-qr.png";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  toast({ title: "Downloaded", description: "High-resolution QR code saved." });
                } catch (error) {
                  console.error("QR Download Error:", error);
                  toast({ variant: "destructive", title: "Error", description: "Failed to download QR code." });
                }
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-3 text-slate-900">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-700 group-hover:bg-slate-200 transition-colors">
                    <QrCode className="w-6 h-6" />
                  </div>
                  Banner QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 leading-relaxed">Download a 2000px high-quality QR code for large banners and print materials.</p>
                <div className="mt-6 flex items-center text-sm font-bold text-slate-700 group-hover:gap-2 transition-all">
                  Download PNG <span>↓</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="participants" className="w-full">
          <div className="overflow-x-auto pb-4 no-scrollbar">
            <TabsList className="inline-flex w-auto md:grid md:w-full md:grid-cols-5 mb-2 bg-slate-100/50 p-1.5 rounded-2xl border min-w-full">
                <TabsTrigger value="participants" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-spiritual-blue text-slate-500 font-bold py-3 px-6 whitespace-nowrap">Participants</TabsTrigger>
                <TabsTrigger value="portions" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-spiritual-blue text-slate-500 font-bold py-3 px-6 whitespace-nowrap">Reading Portions</TabsTrigger>
                <TabsTrigger value="verses" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-spiritual-blue text-slate-500 font-bold py-3 px-6 whitespace-nowrap">Daily Verses</TabsTrigger>
                <TabsTrigger value="meetings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-spiritual-blue text-slate-500 font-bold py-3 px-6 whitespace-nowrap">Meetings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="participants" className="animate-in fade-in slide-in-from-bottom-2">
             <Card className="shadow-md border border-slate-200 overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 p-4 md:p-6 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl">Contest Participants</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">Manage 70-Day Journey registered users.</p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                            <Button 
                                onClick={handleBroadcastWelcomeEmails} 
                                variant="outline" 
                                size="sm" 
                                className="h-9 w-full md:w-auto border-spiritual-blue text-spiritual-blue hover:bg-blue-50"
                                disabled={broadcasting || participants.length === 0}
                            >
                                {broadcasting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending ({broadcastProgress.current}/{broadcastProgress.total})
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Broadcast Welcome Emails
                                    </>
                                )}
                            </Button>
                            <Button 
                                onClick={handleTestEmail} 
                                variant="outline" 
                                size="sm" 
                                className="h-9 w-full md:w-auto border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                                disabled={broadcasting}
                            >
                                Test Email (feedback0299)
                            </Button>
                            <Button onClick={fetchParticipants} variant="outline" size="sm" className="h-9 w-full md:w-auto">Refresh Data</Button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right w-full mt-1 px-1">
                             Note: Emails may land in Spam. Please advise users to check their Junk folder.
                        </p>
                    </div>
                    
                    {/* Search & Filters */}
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Name Search</Label>
                                <Input 
                                    placeholder="Search by name..." 
                                    value={filterInput.name}
                                    onChange={(e) => setFilterInput({...filterInput, name: e.target.value})}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</Label>
                                <Input 
                                    placeholder="Search by phone..." 
                                    value={filterInput.phone}
                                    onChange={(e) => setFilterInput({...filterInput, phone: e.target.value})}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Branch Type</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={filterInput.branchType}
                                    onChange={(e) => setFilterInput({...filterInput, branchType: e.target.value})}
                                >
                                    <option value="all">All Locations</option>
                                    <option value="main">Athumanesar Thanjavur Main</option>
                                    <option value="branch">Athumanesar Branches</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Participation Mode</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={filterInput.mode}
                                    onChange={(e) => setFilterInput({...filterInput, mode: e.target.value})}
                                >
                                    <option value="all">All Modes</option>
                                    <option value="online">Online (Home)</option>
                                    <option value="offline">Offline (Church)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 md:gap-4">
                            <span className="text-xs md:text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl text-center">
                                {filteredParticipants.length} Participants Found
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClear} className="flex-1 md:w-32">Clear All</Button>
                                <Button onClick={handleSearch} className="flex-1 md:w-32 bg-spiritual-blue hover:bg-blue-700">Search</Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Name / Contact</th>
                                    <th className="px-6 py-4 font-bold">Branch (Location)</th>
                                    <th className="px-6 py-4 font-bold text-center">Participation</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedParticipants.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No participants found matching your criteria.</td></tr>
                                ) : paginatedParticipants.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-900">{p.full_name}</div>
                                                <code className="text-[9px] bg-slate-100 text-slate-400 px-1 rounded">ID: {p.id.substring(0, 8)}...</code>
                                            </div>
                                            <div className="text-slate-500 text-xs mt-0.5">{p.phone_number}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase mt-1">Address: {p.city_location || 'N/A'}</div>
                                            <div className="text-[10px] text-spiritual-blue font-bold uppercase mt-1">{p.participation_mode} ({p.participation_mode === 'online' ? p.online_regularity : p.attendance_frequency})</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.church_branch === '1' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {p.church_branch === '1' ? 'Athumanesar Thanjavur Main' : (p.church_branch_name || 'Branch')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-spiritual-gold">{p.daysParticipated}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Days</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditParticipant(p)} className="text-spiritual-blue hover:text-spiritual-blue hover:bg-blue-50">
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 0 && (
                        <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50/50 border-t">
                            <div className="text-sm text-slate-500 font-medium mb-4 md:mb-0">
                                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredParticipants.length)}</span> of <span className="font-bold text-slate-900">{filteredParticipants.length}</span> entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    <span className="sr-only">First page</span>
                                    {'<<'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <span className="sr-only">Previous page</span>
                                    {'<'}
                                </Button>
                                
                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p >= Math.max(1, currentPage - 2) && p <= Math.min(totalPages, currentPage + 2))
                                        .map(p => (
                                            <Button
                                                key={p}
                                                variant={currentPage === p ? "default" : "outline"}
                                                size="sm"
                                                className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-spiritual-blue' : ''}`}
                                                onClick={() => setCurrentPage(p)}
                                            >
                                                {p}
                                            </Button>
                                        ))
                                    }
                                </div>

                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <span className="sr-only">Next page</span>
                                    {'>'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <span className="sr-only">Last page</span>
                                    {'>>'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
             </Card>

              {/* Edit Dialog */}
              {editingParticipant && (
                  <div className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm transition-opacity ${editDialogOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-center bg-white sticky top-0 pb-4 z-10 border-b md:border-none">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">Edit Participant</h3>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-tight mt-1">ID: {editingParticipant.id}</p>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(false)} className="h-10 w-10 border rounded-full hover:bg-slate-50"><Plus className="rotate-45 h-6 w-6 text-slate-400" /></Button>
                          </div>
                         
                         <div className="space-y-4">
                              <div className="space-y-2">
                                 <Label>Member Name</Label>
                                 <Input value={editingParticipant.full_name} disabled className="bg-slate-50 font-bold" />
                             </div>

                             <div className="space-y-2">
                                 <Label>Personal Address</Label>
                                 <Textarea 
                                    className="min-h-[80px] bg-white"
                                    value={editAddress}
                                    onChange={(e) => setEditAddress(e.target.value)}
                                    placeholder="Enter full address"
                                 />
                             </div>
                             
                             <div className="space-y-3">
                                <Label>Branch Location</Label>
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input 
                                            type="radio" 
                                            name="branch_edit"
                                            checked={branchOption === 'main'}
                                            onChange={() => setBranchOption('main')}
                                            className="w-4 h-4 text-spiritual-blue"
                                        />
                                        <span className="text-sm font-medium">Athumanesar Thanjavur Main</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input 
                                            type="radio" 
                                            name="branch_edit"
                                            checked={branchOption === 'branch'}
                                            onChange={() => setBranchOption('branch')}
                                            className="w-4 h-4 text-spiritual-blue"
                                        />
                                        <span className="text-sm font-medium">Athumanesar Branch</span>
                                    </label>
                                </div>
                             </div>

                             {branchOption === 'branch' && (
                                 <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <Label>Branch Name</Label>
                                    <Input 
                                        placeholder="Enter Branch Name" 
                                        value={customBranch}
                                        onChange={(e) => setCustomBranch(e.target.value)}
                                        className="bg-white"
                                    />
                                 </div>
                             )}
                         </div>

                         <div className="flex gap-3 pt-2">
                             <Button className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                             <Button className="flex-1 bg-spiritual-blue hover:bg-blue-700" onClick={saveParticipantChanges} disabled={loading}>
                                 {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                 Save Changes
                             </Button>
                         </div>
                     </div>
                 </div>
             )}
          </TabsContent>

          <TabsContent value="portions" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="shadow-md border border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 p-6 border-b">
                <CardTitle className="text-xl flex items-center gap-3">
                  <FileSpreadsheet className="text-spiritual-blue w-6 h-6" />
                  70-Day Contest Reading Portions
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Download the full 70-day portion schedule in PDF format.</p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-6">
                    <div className="bg-blue-50 p-4 rounded-full">
                      <Users className="text-spiritual-blue w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Adult Registry Portions</h3>
                      <p className="text-sm text-slate-500 mt-1">Full 70-day schedule including Old Testament, Psalms, Proverbs, and NT.</p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                      <Button 
                        variant="outline"
                        className="w-full border-spiritual-blue text-spiritual-blue hover:bg-blue-50 h-11 text-base font-bold rounded-xl"
                        onClick={() => handlePreview('adult')}
                        disabled={contestReadings.length === 0}
                      >
                        <Eye className="mr-2 h-5 w-5" /> Preview PDF
                      </Button>
                      <Button 
                        className="w-full bg-spiritual-blue hover:bg-blue-700 h-11 text-base font-bold rounded-xl shadow-lg shadow-blue-600/10"
                        onClick={() => generateReadingPDF(contestReadings.filter(r => r.category === 'adult'), 'adult')}
                        disabled={contestReadings.length === 0}
                      >
                        <DownloadIcon className="mr-2 h-5 w-5" /> Download PDF
                      </Button>
                      <Button 
                        variant="secondary"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 h-11 text-sm font-bold rounded-xl"
                        onClick={() => handlePreview('adult', 'attendance')}
                        disabled={contestReadings.length === 0}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Preview Attendance
                      </Button>
                      <Button 
                        variant="secondary"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 h-11 text-sm font-bold rounded-xl"
                        onClick={() => generateAttendancePDF(contestReadings.filter(r => r.category === 'adult'), 'adult')}
                        disabled={contestReadings.length === 0}
                      >
                        <DownloadIcon className="mr-2 h-4 w-4 text-spiritual-blue" /> Download Attendance Sheet
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-6">
                    <div className="bg-spiritual-gold/10 p-4 rounded-full">
                      <Users className="text-spiritual-gold w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Kids & Teens Portions</h3>
                      <p className="text-sm text-slate-500 mt-1">Tailored 70-day schedule focusing on Psalms, Proverbs, and NT.</p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                      <Button 
                        variant="outline"
                        className="w-full border-spiritual-gold text-spiritual-gold hover:bg-amber-50 h-11 text-base font-bold rounded-xl"
                        onClick={() => handlePreview('kids_teens')}
                        disabled={contestReadings.length === 0}
                      >
                        <Eye className="mr-2 h-5 w-5" /> Preview PDF
                      </Button>
                      <Button 
                        className="w-full bg-spiritual-gold hover:bg-spiritual-gold/90 h-11 text-base font-bold rounded-xl shadow-lg shadow-amber-600/10"
                        onClick={() => generateReadingPDF(contestReadings.filter(r => r.category === 'kids_teens'), 'kids_teens')}
                        disabled={contestReadings.length === 0}
                      >
                        <DownloadIcon className="mr-2 h-5 w-5" /> Download PDF
                      </Button>
                      <Button 
                        variant="secondary"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 h-11 text-sm font-bold rounded-xl"
                        onClick={() => handlePreview('kids_teens', 'attendance')}
                        disabled={contestReadings.length === 0}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Preview Attendance
                      </Button>
                      <Button 
                        variant="secondary"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 h-11 text-sm font-bold rounded-xl"
                        onClick={() => generateAttendancePDF(contestReadings.filter(r => r.category === 'kids_teens'), 'kids_teens')}
                        disabled={contestReadings.length === 0}
                      >
                        <DownloadIcon className="mr-2 h-4 w-4 text-spiritual-gold" /> Download Attendance Sheet
                      </Button>
                    </div>
                  </div>
                </div>

                {contestReadings.length === 0 && (
                  <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-700 text-sm flex items-center gap-3">
                    <AlertCircleIcon className="h-5 w-5 shrink-0" />
                    <span>No reading portions found. Please upload them in the <Link to="/admin/contest" className="font-bold underline">Contest Manager</Link> first.</span>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>



          <TabsContent value="verses">
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-spiritual-blue p-6 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-xl font-bold">Daily Verse Calendar</h3>
                  <p className="text-blue-100 text-sm">Schedule verses that appear on the homepage for everyone.</p>
                </div>
                 <FileSpreadsheet className="text-blue-300/40 w-12 h-12" />
              </div>
              <div className="p-6">
                <MonthlyPlanner />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <Card className="border-t-4 border-t-blue-600 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Video className="text-blue-500 w-8 h-8" />
                        Video Meetings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-8 border-2 border-dashed rounded-2xl bg-slate-50 flex flex-col items-center gap-6 text-center transform hover:scale-[1.01] transition-transform">
                          <div className="bg-blue-600/10 p-5 rounded-full">
                            <Plus className="w-8 h-8 text-blue-600" />
                          </div>
                          <div>
                              <h3 className="font-extrabold text-xl text-slate-900">Start a New Meeting</h3>
                              <p className="text-sm text-slate-500 mt-2 max-w-[250px]">Instantly create a secure video room and share the link.</p>
                          </div>
                          <div className="flex flex-col gap-3 w-full max-w-sm">
                              <Input placeholder="Room Name (e.g. Prayer Group)" id="new-room-name-admin" className="h-12 text-center text-lg" />
                              <Button className="h-12 bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => {
                                  const id = Math.random().toString(36).substring(2, 9);
                                  navigate(`/room/${id}`);
                              }}>
                                  Launch Meeting Room
                              </Button>
                          </div>
                      </div>

                      <div className="p-8 border rounded-2xl bg-spiritual-blue/5 flex flex-col items-center gap-6 text-center border-spiritual-blue/20">
                          <div className="bg-spiritual-blue/10 p-5 rounded-full text-spiritual-blue">
                             <ExternalLink className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-xl text-slate-900">Join Existing Room</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-[250px]">Enter a specific room ID to moderate an ongoing meeting.</p>
                          </div>
                          <div className="flex flex-col gap-3 w-full max-w-sm">
                              <Input placeholder="Enter 7-character Room ID" id="join-room-id-admin" className="h-12 text-center text-lg font-mono tracking-widest" />
                              <Button variant="outline" className="h-12 border-spiritual-blue text-spiritual-blue hover:bg-spiritual-blue/10 font-bold" onClick={() => {
                                  const id = (document.getElementById('join-room-id-admin') as HTMLInputElement).value;
                                  if (id) navigate(`/room/${id}`);
                              }}>
                                  Join Session
                              </Button>
                          </div>
                      </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global PDF Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 border-b bg-slate-50 flex flex-row items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="flex items-center gap-2 text-base md:text-lg truncate">
                  <FileSpreadsheet className="w-5 h-5 text-spiritual-blue shrink-0" />
                  <span className="truncate">{previewTitle}</span>
                </DialogTitle>
              </div>
              
              <div className="flex-1 flex justify-center">
                {previewPdfUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-spiritual-blue text-spiritual-blue bg-white shadow-sm hover:bg-blue-50 font-bold whitespace-nowrap"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewPdfUrl;
                      link.download = `${previewTitle.replace(/\s+/g, '_')}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                )}
              </div>

              <div className="flex-1 hidden sm:block">
                {/* Right spacer for centering */}
              </div>
            </DialogHeader>
            <div className="flex-1 w-full bg-slate-100 flex items-center justify-center p-4">
              {previewPdfUrl ? (
                <div className="w-full h-full flex flex-col">
                  {/* Desktop Preview */}
                  <iframe 
                    src={previewPdfUrl} 
                    className="hidden md:block w-full h-full border rounded shadow-inner bg-white"
                    title="PDF Preview"
                  />
                  {/* Mobile Preview Fallback */}
                  <div className="md:hidden flex flex-col items-center justify-center gap-6 h-full text-center px-6">
                    <div className="bg-spiritual-blue/10 p-6 rounded-full">
                      <FileSpreadsheet className="w-12 h-12 text-spiritual-blue" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">PDF Preview</h3>
                      <p className="text-slate-500 text-sm mt-2 max-w-[240px]">
                        Embedded previews are restricted on mobile. Click below to view the professional layout.
                      </p>
                    </div>
                    <Button 
                      className="bg-spiritual-blue hover:bg-blue-700 w-full max-w-[240px] gap-2 font-bold shadow-lg"
                      onClick={() => window.open(previewPdfUrl, '_blank')}
                    >
                      <ExternalLink className="w-5 h-5" />
                      View in New Tab
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-spiritual-blue h-10 w-10" />
                  <p className="text-slate-500 font-medium">Preparing Preview...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

         {/* General Confirmation Dialog */}
         <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => { if(!open) setConfirmDialog(prev => ({...prev, isOpen: false })) }}>
             <DialogContent className="sm:max-w-[425px]">
                 <DialogHeader>
                     <DialogTitle>{confirmDialog.title}</DialogTitle>
                     <DialogDescription asChild>
                        <div className="text-sm text-muted-foreground">
                            {confirmDialog.description}
                        </div>
                     </DialogDescription>
                 </DialogHeader>
                 <DialogFooter className="gap-2 sm:gap-0">
                     <Button variant="outline" onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false }))}>Cancel</Button>
                     <Button onClick={confirmDialog.onConfirm}>{confirmDialog.confirmLabel || "Confirm"}</Button>
                 </DialogFooter>
             </DialogContent>
         </Dialog>

         {/* Broadcast Failure Report */}
         <Dialog open={broadcastReport.isOpen} onOpenChange={(open) => setBroadcastReport(prev => ({ ...prev, isOpen: open }))}>
             <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                 <DialogHeader>
                     <DialogTitle className="text-red-600 flex items-center gap-2">
                         <AlertCircleIcon className="w-5 h-5" />
                         Transmission Issues Report
                     </DialogTitle>
                     <DialogDescription asChild>
                         <div className="text-muted-foreground text-sm">
                            The following {broadcastReport.failures.length} emails could not be sent. Please review them.
                         </div>
                     </DialogDescription>
                 </DialogHeader>
                 
                 <div className="flex-1 overflow-y-auto border rounded-md p-2 mt-2 bg-slate-50 space-y-1">
                     {broadcastReport.failures.map((fail, idx) => (
                         <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-white border rounded shadow-sm text-sm gap-1">
                             <span className="font-semibold text-slate-800">{fail.email}</span>
                             <span className="text-red-500 font-medium text-xs">{fail.reason}</span>
                         </div>
                     ))}
                 </div>

                 <DialogFooter>
                     <Button onClick={() => setBroadcastReport(prev => ({ ...prev, isOpen: false }))}>Close Report</Button>
                 </DialogFooter>
             </DialogContent>
         </Dialog>
      </div>
  );
};

export default Admin;
