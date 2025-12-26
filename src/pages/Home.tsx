import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import TodayVerseDisplay from '@/components/TodayVerseDisplay';
import PeriodicVerseDisplay from '@/components/PeriodicVerseDisplay';
import BibleSearch from '@/components/BibleSearch';
import { useLanguage } from '@/contexts/LanguageContext';
import QRCode from "react-qr-code";

const Home = () => {
    const { currentLanguage } = useLanguage();
    
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-spiritual-blue text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-spiritual-blue to-black opacity-80 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: 'url("/images/banner-1766498186.jpg")' }} 
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-4 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">
            {currentLanguage === 'ta' ? 'ஆத்துமநேசர் இந்தியா தேவாலயம்' : 'Athumanesar India Church'}
          </h1>
          <p className="text-xl md:text-2xl text-spiritual-gold font-medium tracking-wide">
            {currentLanguage === 'ta' ? 'தஞ்சாவூர் தலைமையகம்' : 'Thanjavur Headquarters'}
          </p>
        </div>
      </section>

      {/* Verses & Search Section */}
      <section className="bg-slate-50 py-16 px-4 -mt-20 relative z-30 text-spiritual-blue">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Section 1: Annual Verse */}
          <div id="section1">
             <PeriodicVerseDisplay type="annual" />
          </div>

          {/* Section 2: Monthly Verse */}
          <div id="section2">
             <PeriodicVerseDisplay type="monthly" />
          </div>

          {/* Section 3: Today's Verse */}
          <div id="section3" className="max-w-3xl mx-auto w-full">
             <TodayVerseDisplay />
          </div>

          {/* Section 4: Bible Search */}
          <div id="section4" className="pt-12 border-t border-slate-200">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                    {currentLanguage === 'ta' ? 'வேத வசனத்தைத் தேடுங்கள்' : 'Search the Word'}
                </h2>
                <p className="text-slate-500">
                    {currentLanguage === 'ta' ? 'எந்த ஒரு வசனத்தையும் உடனடியாகக் கண்டறியுங்கள்' : 'Find any verse from the Bible instantly'}
                </p>
             </div>
             <BibleSearch />
          </div>

          <div className="flex justify-center pt-8">
             <Link to="/calendar">
                <Button variant="outline" size="lg" className="rounded-full border-spiritual-blue text-spiritual-blue hover:bg-spiritual-blue hover:text-white px-8">
                   {currentLanguage === 'ta' ? 'முழு காலெண்டரைப் பார்க்க' : 'View Full Bible Calendar'}
                </Button>
             </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-spiritual-blue text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold mb-4 text-spiritual-gold">Contact Us</h3>
            <p className="text-gray-300">Thanjavur, Tamil Nadu</p>
            <p className="text-gray-300">India</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-spiritual-gold">Service Times</h3>
            <p className="text-gray-300">Sunday Service: 9:00 AM</p>
            <p className="text-gray-300">Evening Prayer: 6:00 PM</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-spiritual-gold">Connect</h3>
            <div className="flex justify-center md:justify-start space-x-4 mb-6">
              <a href="#" className="text-white hover:text-spiritual-gold transition-colors">Facebook</a>
              <a href="#" className="text-white hover:text-spiritual-gold transition-colors">YouTube</a>
            </div>
            
            {/* QR Code */}
            <div className="bg-white p-2 rounded-lg inline-block">
                <QRCode value={window.location.origin} size={100} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Scan to visit website</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Athumanesar India Church. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
