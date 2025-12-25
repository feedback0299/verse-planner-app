import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Lock, Eye, LogOut } from 'lucide-react';
import { uploadMagazinePDF, getMagazineUrl } from '@/lib/magazineService';
import { Document, Page, pdfjs } from 'react-pdf';

// Setup pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MagazineAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Special Auth for Magazine Admin
    if (email === 'editor' && password === 'publish') {
      setIsAuthenticated(true);
      toast({ title: "Welcome Editor", description: "You have access to magazine publishing." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid credentials." });
    }
    setLoading(false);
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
      // Keep previewURL for confirmation or refresh it from server if needed
    }
    setUploading(false);
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-950 text-slate-50">
          <CardHeader className="text-center">
            <div className="mx-auto bg-slate-800 p-3 rounded-full w-fit mb-4">
              <Lock className="h-8 w-8 text-slate-400" />
            </div>
            <CardTitle className="text-2xl text-slate-200">Magazine Publisher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                 <Label htmlFor="email">Editor ID</Label>
                 <Input 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                    placeholder="ID" 
                 />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="password">Passkey</Label>
                 <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-slate-900 border-slate-700"
                 />
              </div>
              <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-600" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enter Studio'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Magazine Management</h1>
                <p className="text-gray-500">Upload and preview the monthly magazine.</p>
            </div>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                <LogOut className="mr-2 h-4 w-4"/> Exit
            </Button>
        </div>

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
                    {previewUrl && (
                        <p className="mt-4 text-sm text-gray-500">
                             Previewing Magazine
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default MagazineAdmin;
