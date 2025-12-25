import React, { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import { getMagazineUrl } from '@/lib/magazineService';
import { Loader2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Setup pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageProps {
  number: number;
  width?: number;
}

const PDFPage = React.forwardRef<HTMLDivElement, PageProps>(({ number, width }, ref) => {
  return (
    <div ref={ref} className="bg-white shadow-lg overflow-hidden h-full">
      <Page 
        pageNumber={number} 
        width={width || 400} 
        renderTextLayer={false} 
        renderAnnotationLayer={false}
        className="h-full object-contain"
      />
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400">
        {number}
      </div>
    </div>
  );
});

PDFPage.displayName = 'PDFPage';

const Magazine = () => {
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const bookRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Responsive dimensions
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    // Fetch URL
    const fetchedUrl = getMagazineUrl();
    setUrl(fetchedUrl);

    // Responsive handler
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setWidth(window.innerWidth - 40);
        setHeight((window.innerWidth - 40) * 1.414); // A4 ratio
      } else {
        setWidth(450);
        setHeight(636);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoading(false);
    toast({
        title: "Magazine Unavailable",
        description: "The current month's magazine hasn't been uploaded yet.",
        variant: "destructive"
    });
  }

  const nextPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-peaceful pt-24 pb-12 overflow-hidden flex flex-col items-center">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold text-spiritual-blue mb-2 flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-spiritual-gold" />
          Monthly Magazine
        </h1>
        <p className="text-muted-foreground italic">Spiritual nourishment for your soul</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-64">
           <Loader2 className="h-12 w-12 animate-spin text-spiritual-blue mb-4" />
           <p className="text-muted-foreground">Loading Magazine...</p>
        </div>
      )}

      {url && (
        <div className="flex flex-col items-center w-full max-w-5xl px-4">
            <div className="relative group w-full flex justify-center">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    className="shadow-2xl rounded-sm"
                >
                    {/* @ts-ignore: HTMLFlipBook types can be tricky */}
                    <HTMLFlipBook 
                        width={width}
                        height={height}
                        size="fixed"
                        minWidth={300}
                        maxWidth={1000}
                        minHeight={400}
                        maxHeight={1533}
                        maxShadowOpacity={0.5}
                        showCover={true}
                        mobileScrollSupport={true}
                        className="demo-book focus:outline-none"
                        ref={bookRef}
                        onFlip={(e) => setPageNumber(e.data)}
                    >
                         {/* Generate pages dynamically */}
                         {Array.from(new Array(numPages), (el, index) => (
                             // @ts-ignore
                            <PDFPage key={`page_${index + 1}`} number={index + 1} width={width} />
                        ))}
                    </HTMLFlipBook>
                </Document>
            </div>

            {/* Page Navigation Area */}
            <div className="flex items-center gap-6 mt-10">
                <button 
                    onClick={prevPage}
                    disabled={pageNumber <= 1}
                    className="p-3 bg-white/90 rounded-full shadow-lg hover:bg-white text-spiritual-blue transition-all border border-spiritual-blue/10 disabled:opacity-30"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                
                <div className="text-center text-spiritual-blue font-semibold bg-white/50 px-6 py-2 rounded-full backdrop-blur-sm border border-spiritual-blue/10 shadow-sm min-w-[150px]">
                    Page {pageNumber} of {numPages}
                </div>

                <button 
                    onClick={nextPage}
                    disabled={pageNumber >= numPages}
                    className="p-3 bg-white/90 rounded-full shadow-lg hover:bg-white text-spiritual-blue transition-all border border-spiritual-blue/10 disabled:opacity-30"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>
        </div>
      )}
      
      {!url && !loading && (
           <div className="text-center p-12 bg-white/50 backdrop-blur rounded-xl shadow-card border border-border">
               <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-xl font-medium text-foreground">No Magazine Found</h3>
               <p className="text-muted-foreground mt-2">Check back later for this month's issue.</p>
           </div>
      )}
    </div>
  );
};

export default Magazine;
