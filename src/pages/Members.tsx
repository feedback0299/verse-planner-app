import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Trash2, LogOut, Users, Search, MapPin, Phone, Upload, UserPlus, Filter, 
  Edit2, ArrowLeft, CheckCircle, Hash, Loader2, RotateCcw, Archive, History, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, AlertTriangle, 
  ExternalLink, FileText, X, Check, Mail, Clock, ShieldAlert, Map as MapIcon
} from 'lucide-react';
import MembersMap from "@/components/MembersMap";
import { 
  Dialog as MuiDialog, 
  DialogActions, 
  DialogContent as MuiDialogContent,
  DialogContentText, 
  DialogTitle as MuiDialogTitle, 
  Slide, 
  Fade, 
  Button as MuiButton 
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// MUI Transitions
const TransitionSlideDown = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const TransitionSlideUp = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TransitionFade = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Fade ref={ref} {...props} />;
});

const Members = () => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'deleted' | 'map'>('list');
  const [searchParams, setSearchParams] = useState({ global: '', name: '', address: '', phone: '', pinCode: '' });
  const [tempGlobalSearch, setTempGlobalSearch] = useState('');
  const [tempFilters, setTempFilters] = useState({ name: '', address: '', phone: '', pinCode: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [newMember, setNewMember] = useState({ name: '', address: '', phone: '', email: '', pin_code: '' });
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<{row: number, content: string, reason: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'edit' | 'restore' | 'permanent' | 'add';
    memberId?: string;
    member?: any;
    onConfirm: () => void;
  }>({ open: false, type: 'delete', onConfirm: () => {} });

  const [dialogTransition, setDialogTransition] = useState<React.ComponentType<any>>(() => TransitionSlideDown);

  const openConfirmDialog = (props: any) => {
    // Set initial entrance transition
    if (props.type === 'edit' || props.type === 'delete') {
      setDialogTransition(() => TransitionSlideDown); // Enter from Top
    } else {
      setDialogTransition(() => TransitionSlideUp); // Enter from Bottom
    }
    setConfirmDialog(props);
  };
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Session is handled by wrapper, but we check for admin name which might be set by wrapper
    const storedAdmin = localStorage.getItem('member_admin_name');
    if (storedAdmin) setAdminName(storedAdmin);
    setIsAuthenticated(true); 
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMembers();
  }, [isAuthenticated]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('church_members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch members" });
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('member_admin_session');
    // We keep the name in input for convenience, but clear session
    window.location.reload(); 
  };

  const validateMember = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.name?.trim()) newErrors.name = "Full name is required";
    if (!data.phone?.trim()) newErrors.phone = "Phone number is required";
    if (!data.address?.trim()) newErrors.address = "Home address is required";
    
    if (data.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMember = async () => {
    // Validation is now done before calling this, but keeping it safe won't hurt
    if (!validateMember(newMember)) return;
    
    setLoading(true);
    const { data: existing } = await supabase
      .from('church_members')
      .select('id')
      .eq('address', newMember.address)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      toast({
        variant: "destructive",
        title: "Duplicate Address",
        description: "This address already exists in the system.",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('church_members')
      .insert([{
        ...newMember,
        created_by: adminName,
        updated_at: new Date().toISOString()
      }]);
  
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Member added successfully." });
      setNewMember({ name: '', address: '', phone: '', email: '', pin_code: '' });
      setView('list');
      fetchMembers();
    }
  };
  
  const handleEditMemberRequest = (member: any) => {
    setConfirmDialog({
      open: true,
      type: 'edit',
      member,
      onConfirm: () => {
        setEditingMember({ ...member });
        setErrors({});
        setView('edit');
        setConfirmDialog(p => ({ ...p, open: false }));
      }
    });
  };
  
  const handleUpdateMember = async () => {
    if (!editingMember || !validateMember(editingMember)) return;
    
    setLoading(true);
    const { data: existing } = await supabase
      .from('church_members')
      .select('id')
      .eq('address', editingMember.address)
      .eq('is_deleted', false)
      .neq('id', editingMember.id)
      .single();

    if (existing) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Another active member is already registered with this address.",
      });
      setLoading(false);
      return;
    }
  
    const { error } = await supabase
      .from('church_members')
      .update({
        name: editingMember.name,
        address: editingMember.address,
        phone: editingMember.phone,
        email: editingMember.email,
        pin_code: editingMember.pin_code,
        updated_at: new Date().toISOString(),
        updated_by: adminName
      })
      .eq('id', editingMember.id);
  
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } else {
      toast({ title: "Success", description: "Member updated successfully." });
      setEditingMember(null);
      setView('list');
      fetchMembers();
    }
  };

  const handleDeleteRequest = (id: string) => {
    openConfirmDialog({
      open: true,
      type: 'delete',
      memberId: id,
      onConfirm: async () => {
        setLoading(true);
        const { error } = await supabase
          .from('church_members')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString(),
            deleted_by: adminName
          })
          .eq('id', id);
          
        setLoading(false);
        if (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to archive member." });
        } else {
          toast({ title: "Archived", description: "Member moved to Deleted Registry." });
          fetchMembers();
        }
        setConfirmDialog(p => ({ ...p, open: false }));
      }
    });
  };

  const handleRestoreRequest = (id: string, member: any) => {
    openConfirmDialog({
      open: true,
      type: 'restore',
      memberId: id,
      member,
      onConfirm: async () => {
        setLoading(true);
        const { data: existing } = await supabase
          .from('church_members')
          .select('id')
          .eq('address', member.address)
          .eq('is_deleted', false)
          .single();

        if (existing) {
          toast({
            variant: "destructive",
            title: "Restore Failed",
            description: "An active member already exists with this address.",
          });
          setLoading(false);
          setConfirmDialog(p => ({ ...p, open: false }));
          return;
        }

        const { error } = await supabase
          .from('church_members')
          .update({ is_deleted: false, updated_at: new Date().toISOString() })
          .eq('id', id);
          
        setLoading(false);
        if (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to restore member." });
        } else {
          toast({ title: "Restored", description: "Member returned to active registry." });
          fetchMembers();
        }
        setConfirmDialog(p => ({ ...p, open: false }));
      }
    });
  };

  const handlePermanentDeleteRequest = (id: string) => {
    openConfirmDialog({
      open: true,
      type: 'permanent',
      memberId: id,
      onConfirm: async () => {
        setLoading(true);
        const { error } = await supabase
          .from('church_members')
          .delete()
          .eq('id', id);
          
        setLoading(false);
        if (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to delete member." });
        } else {
          toast({ title: "Deleted", description: "Member permanently removed." });
          fetchMembers();
        }
        setConfirmDialog(p => ({ ...p, open: false }));
      }
    });
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv', '.ods'];
    if (!validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast({ 
        variant: "destructive", 
        title: "Wrong File Type", 
        description: `Please upload a valid spreadsheet file (${validExtensions.join(', ')}).` 
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setBulkUploadErrors([]);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          toast({ variant: "destructive", title: "Empty File", description: "The file contains no data." });
          setIsUploading(false);
          return;
        }

        const newMembers = [];
        const foundErrors: {row: number, content: string, reason: string}[] = [];

        const normalizedJsonData = jsonData.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            newRow[key.toLowerCase().trim()] = row[key];
          });
          return newRow;
        });

        const seenAddresses = new Map();
        const seenNames = new Map();
        const activeAddresses = new Set(members.filter(m => !m.is_deleted).map(m => m.address.toLowerCase().trim()));

        normalizedJsonData.forEach((row, index) => {
          const rowNum = index + 2;
          const member: any = {
            name: row.name?.toString().trim(),
            address: row.address?.toString().trim(),
            phone: row.phone?.toString().trim(),
            email: row.email?.toString().trim(),
            pin_code: row.pin_code?.toString().trim()
          };
          
          const additional: any = {};
          Object.keys(row).forEach(key => {
            if (!['name', 'address', 'phone', 'email', 'pin_code'].includes(key)) {
              additional[key] = row[key];
            }
          });

          const rowContent = Object.values(row).join(', ');

          if (!member.name || !member.address || !member.phone) {
            foundErrors.push({ row: rowNum, content: rowContent, reason: "Missing required fields" });
            return;
          }

          const normalizedName = member.name.toLowerCase();
          const normalizedAddress = member.address.toLowerCase();

          if (seenAddresses.has(normalizedAddress)) {
            const firstRow = seenAddresses.get(normalizedAddress);
            foundErrors.push({ row: rowNum, content: rowContent, reason: `B${rowNum} and B${firstRow} are having same address` });
            return;
          }

          if (seenNames.has(normalizedName)) {
            const firstRow = seenNames.get(normalizedName);
            foundErrors.push({ row: rowNum, content: rowContent, reason: `A${rowNum} and A${firstRow} are having same name` });
            return;
          }

          if (activeAddresses.has(normalizedAddress)) {
            foundErrors.push({ row: rowNum, content: rowContent, reason: "Already exists in Active Registry" });
            return;
          }

          seenAddresses.set(normalizedAddress, rowNum);
          seenNames.set(normalizedName, rowNum);
          member.additional_data = additional;
          member.is_deleted = false;
          member.created_by = adminName;
          member.updated_at = new Date().toISOString();
          newMembers.push(member);
        });

        if (foundErrors.length > 0) {
          setBulkUploadErrors(foundErrors);
          setIsUploading(false);
          return;
        }

        if (newMembers.length > 0) {
          const { error } = await supabase.from('church_members').insert(newMembers);
          if (error) {
            toast({ variant: "destructive", title: "Database Error", description: error.message });
          } else {
            toast({ title: "Upload Complete", description: `Successfully registered ${newMembers.length} members.` });
            fetchMembers();
          }
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Process Error", description: err.message });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSearch = () => {
    setSearchParams({
      global: tempGlobalSearch,
      ...tempFilters
    });
    setCurrentPage(1);
  };

  const filteredMembers = members.filter(m => {
    const isActiveMatch = view === 'deleted' ? m.is_deleted : !m.is_deleted;
    if (!isActiveMatch) return false;

    const searchTerm = searchParams.global.toLowerCase();
    const globalMatch = !searchTerm || 
      m.name?.toLowerCase().includes(searchTerm) ||
      m.address?.toLowerCase().includes(searchTerm) ||
      m.phone?.toLowerCase().includes(searchTerm) ||
      m.pin_code?.toLowerCase().includes(searchTerm);

    const nameMatch = !searchParams.name || m.name?.toLowerCase().includes(searchParams.name.toLowerCase());
    const phoneMatch = !searchParams.phone || m.phone?.toLowerCase().includes(searchParams.phone.toLowerCase());
    const addressMatch = !searchParams.address || m.address?.toLowerCase().includes(searchParams.address.toLowerCase());
    const pinMatch = !searchParams.pinCode || m.pin_code?.toLowerCase().includes(searchParams.pinCode.toLowerCase());

    return globalMatch && nameMatch && phoneMatch && addressMatch && pinMatch;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  return (
    <div className="min-h-screen bg-slate-50 pt-24 px-4 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              {view === 'deleted' ? 'Deleted Registry' : 'Church Registry'}
            </h1>
            <p className="text-slate-500 font-medium">
              {view === 'deleted' 
                ? (searchParams.global || Object.values(searchParams).some(v => v) 
                    ? `Found ${filteredMembers.length} matching archived members` 
                    : `${filteredMembers.length} members in archive`)
                : (searchParams.global || Object.values(searchParams).some(v => v)
                    ? `Found ${filteredMembers.length} matching members`
                    : `Managing ${members.filter(m => !m.is_deleted).length} registered members`)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {view === 'list' && (
              <>
                <Button onClick={() => setView('map')} className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold h-11 rounded-xl shadow-sm text-sm" disabled={loading || isUploading}>
                  <MapIcon className="mr-2 h-4 w-4" /> Map
                </Button>
                <Button onClick={() => setView('add')} className="flex-1 md:flex-none bg-spiritual-blue hover:bg-blue-700 font-bold h-11 rounded-xl shadow text-sm" disabled={loading || isUploading}>
                  <Plus className="mr-2 h-4 w-4" /> New
                </Button>
                <Button variant="outline" onClick={() => { setView('deleted'); setCurrentPage(1); }} className="flex-1 md:flex-none border-slate-200 font-bold h-11 rounded-xl text-sm" disabled={loading || isUploading}>
                  <History className="mr-2 h-4 w-4" /> Archive
                </Button>
              </>
            )}
            {view === 'deleted' && (
              <Button variant="outline" onClick={() => { setView('list'); setCurrentPage(1); }} className="flex-1 md:flex-none border-slate-200 font-bold h-11 rounded-xl text-sm" disabled={loading || isUploading}>
                <Users className="mr-2 h-4 w-4" /> Active
              </Button>
            )}
            
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none font-bold h-11 rounded-xl text-sm" disabled={loading || isUploading}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleBulkUpload} accept=".csv,.xlsx,.xls,.ods" className="hidden" />
            <Button variant="destructive" onClick={handleLogout} className="flex-1 md:flex-none font-bold h-11 rounded-xl text-sm" disabled={loading || isUploading}>
              <LogOut className="mr-2 h-4 w-4" /> Exit
            </Button>
          </div>
        </div>

        {view === 'list' || view === 'deleted' ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder={view === 'deleted' ? "Search archive..." : "Search by name, phone, address or pin code..."} 
                      className="pl-10 h-14 bg-slate-50 border-slate-200 text-lg rounded-2xl focus:bg-white transition-all"
                      value={tempGlobalSearch}
                      onChange={e => setTempGlobalSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      disabled={loading || isUploading}
                    />
                  </div>
                  <Button onClick={handleSearch} className="h-14 bg-spiritual-blue hover:bg-blue-700 px-8 rounded-2xl font-bold transition-all shadow-md active:scale-95" disabled={loading || isUploading}>
                    Search
                  </Button>
                  {(tempGlobalSearch || Object.values(tempFilters).some(v => v)) && (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setTempGlobalSearch('');
                        setTempFilters({ name: '', address: '', phone: '', pinCode: '' });
                        setSearchParams({ global: '', name: '', address: '', phone: '', pinCode: '' });
                        setCurrentPage(1);
                      }}
                      className="h-14 text-slate-500 hover:text-red-500 font-bold"
                      disabled={loading || isUploading}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Button 
                  variant={showFilters ? "secondary" : "outline"} 
                  className="h-14 border-slate-200 rounded-2xl px-6 font-bold"
                  onClick={() => setShowFilters(!showFilters)}
                  disabled={loading || isUploading}
                >
                  <Filter className="mr-2 h-4 w-4" /> {showFilters ? "Hide Filters" : "More Filters"}
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                  {[
                    { label: 'Name', key: 'name', placeholder: 'Filter by name...' },
                    { label: 'Phone', key: 'phone', placeholder: 'Filter by phone...' },
                    { label: 'Address', key: 'address', placeholder: 'Filter by address...' },
                    { label: 'Pin Code', key: 'pinCode', placeholder: 'Filter by pin...' }
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{f.label}</Label>
                      <Input 
                        placeholder={f.placeholder}
                        className="h-11 bg-slate-50 border-slate-200 rounded-xl"
                        value={(tempFilters as any)[f.key]}
                        onChange={e => setTempFilters({...tempFilters, [f.key]: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        disabled={loading || isUploading}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-32">
                  <Users className="h-20 w-20 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 text-xl font-medium">No records found matching your search</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-bold text-slate-900 py-6 px-8 text-base">Member Name</TableHead>
                          <TableHead className="font-bold text-slate-900 py-6 px-8 text-base text-center">Contact Information</TableHead>
                          <TableHead className="font-bold text-slate-900 py-6 px-8 text-base min-w-[350px]">Residential Address</TableHead>
                          <TableHead className="font-bold text-slate-900 py-6 px-8 text-base text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMembers.map(member => (
                          <TableRow 
                            key={member.id} 
                            className="group hover:bg-pink-50 transition-all duration-300 hover:scale-[1.005] cursor-pointer border-slate-50"
                          >
                            <TableCell className="py-6 px-8">
                              <div className="font-bold text-slate-900 text-lg group-hover:text-spiritual-blue transition-colors">
                                {member.name}
                              </div>
                            </TableCell>
                            
                            <TableCell className="py-6 px-8">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                  <Phone className="h-4 w-4 text-spiritual-gold" />
                                  {member.phone}
                                </div>
                                {member.email && (
                                  <div className="text-slate-400 text-xs font-medium italic truncate max-w-[150px]">
                                    {member.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="py-6 px-8">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-pink-100">
                                  <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <span className="text-sm font-medium text-slate-600 leading-relaxed block">{member.address}</span>
                                    <div className="flex items-center gap-4 mt-2">
                                      {member.pin_code && (
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg">
                                          <Hash className="h-3 w-3" /> {member.pin_code}
                                        </span>
                                      )}
                                      <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(member.address + (member.pin_code ? ' ' + member.pin_code : ''))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-spiritual-blue hover:text-blue-700 flex items-center gap-1 group/map"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        Navigation <ExternalLink className="h-3 w-3 group-hover/map:translate-x-0.5 transition-transform" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-6 px-8 text-right">
                              <div className="flex justify-end gap-2 transition-all duration-300">
                                {view === 'deleted' ? (
                                  <>
                                    <Button 
                                      variant="outline" size="icon" className="h-10 w-10 text-green-600 hover:bg-green-50 border-green-100 rounded-xl"
                                      onClick={e => { e.stopPropagation(); handleRestoreRequest(member.id, member); }} disabled={loading || isUploading}
                                    >
                                      <RotateCcw className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                      variant="destructive" size="icon" className="h-10 w-10 rounded-xl shadow-lg"
                                      onClick={e => { e.stopPropagation(); handlePermanentDeleteRequest(member.id); }} disabled={loading || isUploading}
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      variant="outline" size="icon" className="h-10 w-10 text-spiritual-blue hover:bg-blue-50 border-blue-100 rounded-xl shadow-sm"
                                      onClick={e => { 
                                        e.stopPropagation(); 
                                        handleEditMemberRequest(member); 
                                        // Note: openConfirmDialog is called inside handleEditMemberRequest logic context if we wanted, 
                                        // but actually handleEditMemberRequest just changes view. 
                                        // The 'Save' button in view triggers the dialog. 
                                        // Wait, the user might mean the "Edit" button itself? 
                                        // Requirement 2: "for edit the dialog should be displayed..." -> This refers to SAVING changes.
                                      }} 
                                      disabled={loading || isUploading}
                                    >
                                      <Edit2 className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                      variant="destructive" size="icon" className="h-10 w-10 rounded-xl shadow-lg"
                                      onClick={e => { 
                                        e.stopPropagation(); 
                                        handleDeleteRequest(member.id);
                                      }}
                                      disabled={loading || isUploading}
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 px-8 bg-slate-50/50 border-t border-slate-100">
                      <p className="text-sm font-bold text-slate-400">
                        <span className="text-slate-900 decoration-spiritual-blue underline underline-offset-4 decoration-2">
                          {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMembers.length)}
                        </span>
                        <span className="mx-2">of</span>
                        <span className="text-slate-900">{filteredMembers.length} records</span>
                      </p>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
                        <Button 
                          variant="outline" size="sm" onClick={() => setCurrentPage(1)} 
                          disabled={currentPage === 1 || loading || isUploading} className="px-3 font-bold h-10 rounded-xl border-slate-200"
                        >
                          <ChevronsLeft className="h-4 w-4 mr-1" /> Start
                        </Button>
                        <Button 
                          variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                          disabled={currentPage === 1 || loading || isUploading} className="px-3 font-bold h-10 rounded-xl border-slate-200"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1.5 mx-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              const windowStart = Math.max(1, Math.min(currentPage - 4, totalPages - 9));
                              const windowEnd = Math.min(totalPages, windowStart + 9);
                              return page >= windowStart && page <= windowEnd;
                            })
                            .map(page => (
                            <Button
                              key={page} variant={currentPage === page ? "default" : "outline"} size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={cn("w-10 h-10 font-bold transition-all rounded-xl", 
                                currentPage === page ? "bg-spiritual-blue scale-110 shadow-xl border-none" : "hover:bg-pink-50 border-slate-200")}
                              disabled={loading || isUploading}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button 
                          variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                          disabled={currentPage === totalPages || loading || isUploading} className="px-3 font-bold h-10 rounded-xl border-slate-200"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} 
                          disabled={currentPage === totalPages || loading || isUploading} className="px-3 font-bold h-10 rounded-xl border-slate-200"
                        >
                          End <ChevronsRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : view === 'add' || view === 'edit' ? (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden">
              <div className="bg-spiritual-blue p-10 text-white relative overflow-hidden text-center">
                <div className="relative z-10">
                  <Button 
                    variant="ghost" onClick={() => setView('list')} 
                    className="absolute left-6 top-6 text-white hover:bg-white/20 rounded-xl h-10 font-bold"
                    disabled={loading || isUploading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <div className="h-8"></div>
                  <h2 className="text-4xl font-bold">{view === 'add' ? 'New Registration' : 'Edit Profile'}</h2>
                  <p className="text-blue-100 mt-2 font-medium">Please provide accurate member details for the church database.</p>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-spiritual-gold/10 rounded-full -ml-40 -mb-40 blur-3xl"></div>
              </div>
              
              <CardContent className="p-10 space-y-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label className="text-slate-600 font-bold ml-1 text-sm tracking-wide">FULL NAME *</Label>
                    <Input 
                      placeholder="Jane Doe" 
                      value={view === 'add' ? newMember.name : editingMember?.name}
                      onChange={e => view === 'add' ? setNewMember({...newMember, name: e.target.value}) : setEditingMember({...editingMember, name: e.target.value})}
                      className={cn("h-14 rounded-2xl bg-slate-50 focus:bg-white transition-all text-lg font-medium border-slate-100 focus:border-spiritual-blue px-5", errors.name && "border-red-500")}
                      disabled={loading || isUploading}
                    />
                    {errors.name && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.name}</p>}
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-slate-600 font-bold ml-1 text-sm tracking-wide">PHONE NUMBER *</Label>
                    <Input 
                      placeholder="+91 XXXXX XXXXX" 
                      value={view === 'add' ? newMember.phone : editingMember?.phone}
                      onChange={e => view === 'add' ? setNewMember({...newMember, phone: e.target.value}) : setEditingMember({...editingMember, phone: e.target.value})}
                      className={cn("h-14 rounded-2xl bg-slate-50 focus:bg-white transition-all text-lg font-medium border-slate-100 focus:border-spiritual-blue px-5", errors.phone && "border-red-500")}
                      disabled={loading || isUploading}
                    />
                    {errors.phone && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-slate-600 font-bold ml-1 text-sm tracking-wide">RESIDENTIAL ADDRESS *</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 h-6 w-6 text-slate-300 group-focus-within:text-spiritual-blue transition-colors">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <textarea 
                      placeholder="Enter full address details..." 
                      value={view === 'add' ? newMember.address : editingMember?.address}
                      onChange={e => view === 'add' ? setNewMember({...newMember, address: e.target.value}) : setEditingMember({...editingMember, address: e.target.value})}
                      className={cn(
                        "w-full min-h-[140px] pl-12 pr-6 py-4 rounded-3xl bg-slate-50 focus:bg-white transition-all border border-slate-100 focus:border-spiritual-blue focus:ring-4 focus:ring-spiritual-blue/5 outline-none text-slate-800 text-lg font-medium resize-none leading-relaxed",
                        errors.address && "border-red-500"
                      )}
                      disabled={loading || isUploading}
                    />
                  </div>
                  {errors.address && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label className="text-slate-600 font-bold ml-1 text-sm tracking-wide">EMAIL ADDRESS</Label>
                    <Input 
                      type="email" placeholder="member@email.com" 
                      value={view === 'add' ? newMember.email : editingMember?.email}
                      onChange={e => view === 'add' ? setNewMember({...newMember, email: e.target.value}) : setEditingMember({...editingMember, email: e.target.value})}
                      className={cn("h-14 rounded-2xl bg-slate-50 focus:bg-white transition-all text-lg font-medium border-slate-100 px-5", errors.email && "border-red-500")}
                      disabled={loading || isUploading}
                    />
                    {errors.email && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-slate-600 font-bold ml-1 text-sm tracking-wide">PIN CODE</Label>
                    <Input 
                      placeholder="XXXXXX" maxLength={6}
                      value={view === 'add' ? newMember.pin_code : editingMember?.pin_code}
                      onChange={e => view === 'add' ? setNewMember({...newMember, pin_code: e.target.value}) : setEditingMember({...editingMember, pin_code: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 focus:bg-white transition-all text-2xl font-black text-center tracking-[0.3em] border-slate-100 placeholder:tracking-normal placeholder:font-bold placeholder:text-base px-5"
                      disabled={loading || isUploading}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => {
                      if (view === 'add') {
                        if (validateMember(newMember)) {
                          openConfirmDialog({
                            open: true, type: 'add', member: newMember,
                            onConfirm: () => { handleAddMember(); setConfirmDialog(p => ({ ...p, open: false })); }
                          });
                        }
                      } else {
                        if (validateMember(editingMember)) {
                          openConfirmDialog({
                              open: true, type: 'edit', member: editingMember,
                              onConfirm: () => { handleUpdateMember(); setConfirmDialog(p => ({ ...p, open: false })); }
                          });
                        }
                      }
                    }} 
                    className="w-full bg-spiritual-blue hover:bg-blue-700 h-16 text-xl font-black rounded-[1.5rem] shadow-2xl hover:shadow-spiritual-blue/20 transition-all active:scale-[0.98] group"
                    disabled={loading || isUploading}
                  >
                    {loading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : 
                      view === 'add' ? <Plus className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform" /> : 
                      <CheckCircle className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform" />}
                    {view === 'add' ? 'FINALIZE REGISTRATION' : 'SAVE PROFILE UPDATES'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
         ) : view === 'map' ? (
           <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between">
               <Button 
                variant="ghost" onClick={() => setView('list')} 
                className="text-slate-500 hover:text-spiritual-blue hover:bg-blue-50/50 rounded-xl h-10 font-bold -ml-2"
                disabled={loading || isUploading}
               >
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
               </Button>
               <div className="bg-spiritual-blue/10 text-spiritual-blue px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
                 Map Mode
               </div>
             </div>
             
             <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-white border-b border-slate-100/50 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-spiritual-blue/10 rounded-2xl">
                      <MapIcon className="h-6 w-6 text-spiritual-blue" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-800">Member Locations</CardTitle>
                      <p className="text-slate-500 text-sm font-medium">Viewing {filteredMembers.length} locations</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <MembersMap members={filteredMembers} />
                </CardContent>
             </Card>
           </div>
         ) : null}
       </div>

      <MuiDialog
        open={confirmDialog.open}
        TransitionComponent={dialogTransition}
        onClose={() => {
            setConfirmDialog(p => ({ ...p, open: false }));
        }}
        aria-describedby="alert-dialog-slide-description"
        PaperProps={{
          style: { borderRadius: 28, padding: '16px', maxWidth: '500px', width: '100%' } 
        }}
      >
        <MuiDialogTitle className="text-2xl font-black bg-white text-slate-900 pb-2">
          {confirmDialog.type === 'delete' && 'Move to Trash?'}
          {confirmDialog.type === 'permanent' && 'Delete Permanently?'}
          {confirmDialog.type === 'restore' && 'Restore Member?'}
          {confirmDialog.type === 'edit' && 'Save Changes?'}
          {confirmDialog.type === 'add' && 'Register Member?'}
        </MuiDialogTitle>
        <MuiDialogContent>
          <DialogContentText id="alert-dialog-slide-description" className="text-lg text-slate-600 font-medium">
            {confirmDialog.type === 'delete' && `Are you sure you want to move ${members.find(m => m.id === confirmDialog.memberId)?.name} to the archive registry?`}
            {confirmDialog.type === 'permanent' && 'This action cannot be undone. The member data will be lost forever.'}
            {confirmDialog.type === 'restore' && `Restore ${confirmDialog.member?.name} to the active registry?`}
            {confirmDialog.type === 'edit' && 'Are you sure you want to update this member\'s profile?'}
            {confirmDialog.type === 'add' && 'Please confirm the details are correct before registering.'}
          </DialogContentText>
        </MuiDialogContent>
        <DialogActions className="p-4 pt-0">
            <MuiButton 
              onClick={() => {
                setConfirmDialog(p => ({ ...p, open: false }));
              }} 
              style={{ fontWeight: 'bold', color: '#64748b', fontSize: '1rem', textTransform: 'none', padding: '10px 20px' }}
            >
              Cancel
            </MuiButton>
            <MuiButton 
              onClick={() => {
                // Execute logic
                confirmDialog.onConfirm();
              }}
              variant="contained"
              disableElevation
              style={{ 
                borderRadius: 16, 
                fontWeight: 'bold', 
                fontSize: '1rem',
                textTransform: 'none',
                padding: '12px 32px',
                backgroundColor: (confirmDialog.type === 'delete' || confirmDialog.type === 'permanent') ? '#dc2626' : '#2563eb',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              Confirm
            </MuiButton>
        </DialogActions>
      </MuiDialog>

      {(loading || isUploading) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-md w-full mx-4 border border-white/20">
            <div className="relative mb-6">
              <Loader2 className="h-16 w-16 text-spiritual-blue animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-spiritual-gold rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">SYNCING DATABASE</h3>
            <p className="text-slate-500 text-center font-bold text-lg">Safely processing your request...</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-8 overflow-hidden">
              <div className="h-full bg-spiritual-blue animate-[loading_2s_ease-in-out_infinite] w-1/3 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={bulkUploadErrors.length > 0} onOpenChange={o => !o && setBulkUploadErrors([])}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] rounded-[3rem]">
          <DialogHeader className="p-8 bg-red-600 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Bulk Upload Failed</DialogTitle>
                <DialogDescription className="text-red-100 font-bold">
                  {bulkUploadErrors.length} critical issues detected in your file.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-8 bg-white">
            <div className="space-y-4">
              {bulkUploadErrors.map((err, idx) => (
                <div key={idx} className="p-5 rounded-3xl border border-red-50 bg-red-50/20 space-y-3 group hover:border-red-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-red-500 bg-red-100 px-3 py-1 rounded-full">ROW {err.row}</span>
                    <span className="text-sm font-black text-red-600 italic tracking-tight">{err.reason}</span>
                  </div>
                  <p className="text-sm font-mono text-slate-600 break-all bg-white p-3 rounded-2xl border border-red-50/50 shadow-sm">{err.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button onClick={() => setBulkUploadErrors([])} className="w-full bg-slate-900 hover:bg-black text-white font-black h-16 rounded-2xl text-lg shadow-xl active:scale-95 transition-all">
              DISMISS AND CORRECT DATA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
