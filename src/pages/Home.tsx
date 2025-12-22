import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import { useLanguage } from '@/contexts/LanguageContext';
import QRCode from "react-qr-code";

const Home = () => {
    const { currentLanguage } = useLanguage();
    
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-spiritual-blue text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-spiritual-blue to-black opacity-80 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1773&q=80")' }} 
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4 drop-shadow-lg">
            {currentLanguage === 'ta' ? 'ஆத்துமநேசர் இந்தியா தேவாலயம்' : 'Athumanesar India Church'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 font-light tracking-wide mb-8">
            {currentLanguage === 'ta' ? 'தஞ்சாவூர் தலைமையகம்' : 'Thanjavur Headquarters'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
             <Link to="/calendar">
                <Button size="lg" className="bg-spiritual-gold text-spiritual-blue hover:bg-white hover:text-spiritual-blue font-semibold px-8 py-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105">
                  {currentLanguage === 'ta' ? 'நிகழ்வுகளைப் பார்க்க' : 'View Events'}
                </Button>
             </Link>
             <a href="https://www.youtube.com/results?search_query=ATHUMANESAR+INDIA" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-spiritual-blue font-semibold px-8 py-6 rounded-full shadow-lg transition-all duration-300">
                  {currentLanguage === 'ta' ? 'செய்திகளைப் பாருங்கள்' : 'Watch Sermons'}
                </Button>
             </a>
          </div>
        </div>
      </section>

      {/* Daily Verse Section */}
      <section className="bg-gradient-peaceful py-10">
          <DailyVerseCalendar />
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
