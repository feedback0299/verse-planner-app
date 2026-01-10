import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Lock, Eye, LogOut, BookOpen, Calendar, Star, Target, Video, Plus, ExternalLink } from 'lucide-react';
import { uploadMagazinePDF, getMagazineUrl } from '@/lib/commonService/magazineService';
import { Document, Page, pdfjs } from 'react-pdf';
import MonthlyPlanner from '@/components/MonthlyPlanner';
import PeriodicVerseUploader from '@/components/PeriodicVerseUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import AdminAuthWrapper from '@/components/AdminAuthWrapper';

// Setup pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MagazineAdmin = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  const { toast } = useToast();

  const loginLogic = async (email: string, pass: string) => {
    // Special Auth for Magazine Admin
    if (email === 'editor' && pass === 'publish') {
      return { 
        success: true, 
        session: { user: { email: 'editor', name: 'Magazine Editor' } },
        message: "Welcome Editor"
      };
    }
    return { success: false };
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast({ variant: "destructive", title: "Invalid File", description: "Please upload a PDF file." });
        return;
      }
      setFile(selectedFile);
      // Create local preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setPageNumber(1);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const { error } = await uploadMagazinePDF(file);
    
    if (error) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } else {
      toast({ title: "Success", description: "Magazine published successfully!" });
      setFile(null);
    }
    setUploading(false);
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <AdminAuthWrapper 
      title="Magazine Publisher" 
      subtitle="Authorized Studio Access" 
      sessionKey="magazine_admin_session"
      loginLogic={loginLogic}
    >
      <div className="p-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Studio Dashboard</h1>
                <p className="text-gray-500 font-medium">Manage church publications and literature.</p>
            </div>
        </div>

        <Tabs defaultValue="magazine" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-white border h-14 rounded-2xl p-1">
                <TabsTrigger value="magazine" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Magazine
                </TabsTrigger>
                <TabsTrigger value="planner" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Bible Planner
                </TabsTrigger>
                <TabsTrigger value="monthly_verse" className="flex items-center gap-2">
                    <Star className="h-4 w-4" /> Monthly Verse
                </TabsTrigger>
                <TabsTrigger value="annual_verse" className="flex items-center gap-2">
                    <Target className="h-4 w-4" /> Annual Verse
                </TabsTrigger>
                <TabsTrigger value="meetings" className="flex items-center gap-2">
                    <Video className="h-4 w-4" /> Meetings
                </TabsTrigger>
            </TabsList>

            <TabsContent value="magazine">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-blue-600"/>
                                Upload New Issue
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept="application/pdf"
                                    onChange={onFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                                        <FileText className="h-8 w-8" />
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        {file ? file.name : "Click to select PDF"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Only PDF files are supported. Max 50MB.
                                    </p>
                                </div>
                            </div>

                            {file && (
                                <Button 
                                    onClick={handleUpload} 
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Publish Magazine
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview Section */}
                    <Card className="lg:row-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-purple-600"/>
                                Live Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center bg-gray-100/50 min-h-[500px] rounded-lg p-4 justify-center">
                            {previewUrl ? (
                                <div className="flex flex-col items-center gap-4">
                                     <Document
                                        file={previewUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        className="shadow-xl"
                                    >
                                        <Page 
                                            pageNumber={pageNumber} 
                                            width={400} 
                                            renderTextLayer={false} 
                                            renderAnnotationLayer={false}
                                        />
                                    </Document>
                                    
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                                            disabled={pageNumber <= 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm font-medium text-gray-600">
                                            Page {pageNumber} of {numPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                                            disabled={pageNumber >= numPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p>No document selected</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="planner">
                <Card>
                    <CardContent className="pt-6">
                        <MonthlyPlanner />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="monthly_verse">
                <div className="max-w-2xl mx-auto">
                    <PeriodicVerseUploader type="monthly" />
                </div>
            </TabsContent>

            <TabsContent value="annual_verse">
                <div className="max-w-2xl mx-auto">
                    <PeriodicVerseUploader type="annual" />
                </div>
            </TabsContent>

            <TabsContent value="meetings">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-blue-600" />
                            Meeting Rooms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Label>Create New Room</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Room Name (e.g. Sunday Service)" id="new-room-name" />
                                    <Button onClick={() => {
                                        const name = (document.getElementById('new-room-name') as HTMLInputElement).value;
                                        if (name) {
                                            const id = Math.random().toString(36).substring(2, 9);
                                            navigate(`/room/${id}`);
                                        }
                                    }}>
                                        <Plus className="h-4 w-4 mr-2" /> Create
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">Rooms are available 24/7. Share the link with participants once you join.</p>
                            </div>

                            <div className="space-y-4">
                                <Label>Join Existing Room</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Enter Room ID" id="join-room-id" />
                                    <Button variant="outline" onClick={() => {
                                        const id = (document.getElementById('join-room-id') as HTMLInputElement).value;
                                        if (id) navigate(`/room/${id}`);
                                    }}>
                                        <ExternalLink className="h-4 w-4 mr-2" /> Join
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </AdminAuthWrapper>
  );
};

export default MagazineAdmin;
