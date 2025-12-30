import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import TodayVerseDisplay from '@/components/TodayVerseDisplay';
import PeriodicVerseDisplay from '@/components/PeriodicVerseDisplay';
import BibleSearch from '@/components/BibleSearch';
import RandomVerseDisplay from '@/components/RandomVerseDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
import QRCode from "react-qr-code";
import { MapPin, Phone, ExternalLink } from 'lucide-react';

const Home = () => {
    const { currentLanguage, t } = useLanguage();
    
    const churchAddress = "17, Manickam Nagar, M.C. Road, Thanjavur - 613007, TN, INDIA";
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Athumanesar Ministries " + churchAddress)}`;

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
            {t('home.churchName')}
          </h1>
          <p className="text-xl md:text-2xl text-spiritual-gold font-medium tracking-wide">
            {t('home.headquarters')}
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

          {/* Random Verse Section (Hourly) */}
          <div className="max-w-3xl mx-auto w-full pt-8">
             <RandomVerseDisplay />
          </div>

          {/* Section 4: Bible Search */}
          <div id="section4" className="pt-12 border-t border-slate-200">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                    {t('home.searchTitle')}
                </h2>
                <p className="text-slate-500">
                    {t('home.searchSubtitle')}
                </p>
             </div>
             <BibleSearch />
          </div>

          <div className="flex justify-center pt-8">
             <Link to="/calendar">
                <Button variant="outline" size="lg" className="rounded-full border-spiritual-blue text-spiritual-blue hover:bg-spiritual-blue hover:text-white px-8">
                   {t('home.viewFullCalendar')}
                </Button>
             </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-spiritual-blue text-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Contact Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-spiritual-gold flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              {t('home.contactUs')}
            </h3>
            <div className="space-y-4">
              <p className="text-gray-200 leading-relaxed font-medium">
                Athumanesar Ministries,<br />
                {churchAddress}
              </p>
              
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg h-56 w-full group relative">
                <iframe 
                  src={`https://maps.google.com/maps?q=${encodeURIComponent("Athumanesar Ministries, 17, Manickam Nagar, M.C. Road, Thanjavur - 613007")}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Church Location"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                ></iframe>
                <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4 text-spiritual-blue" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4 text-spiritual-gold" />
                  +91 9994301076
                </p>
                <p className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4 text-spiritual-gold" />
                  +91 8300000293
                </p>
              </div>
              
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-spiritual-gold/20 text-spiritual-gold border border-spiritual-gold/30 rounded-full px-5 py-2 transition-all group w-full justify-center md:w-auto"
              >
                <span>{t('home.openGoogleMaps')}</span>
                <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Service Times */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-spiritual-gold">
               {t('home.serviceTimes')}
            </h3>
            <div className="space-y-4 text-gray-200">
              <div className="border-l-2 border-spiritual-gold/30 pl-4 py-1">
                <p className="font-semibold text-lg">{t('home.sundayService')}</p>
                <p className="text-gray-300">9:00 AM</p>
              </div>
              <div className="border-l-2 border-spiritual-gold/30 pl-4 py-1">
                <p className="font-semibold text-lg">{t('home.eveningPrayer')}</p>
                <p className="text-gray-300">6:00 PM</p>
              </div>
            </div>
          </div>

          {/* Connect & QR Section */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-spiritual-gold">
               {t('home.connectWithUs')}
            </h3>
            <div className="flex flex-col gap-4">
              <a 
                href="https://www.facebook.com/UCBFINDIA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-spiritual-gold/10 hover:border-spiritual-gold/30 transition-all group"
              >
                <div className="h-12 w-12 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" className="h-12 w-12">
                    <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                    <path d="M14.073 19.165v-6.993h2.34l.35-2.717h-2.69V7.72c0-.786.218-1.323 1.347-1.323h1.44V3.97a19.49 19.49 0 0 0-2.098-.107c-2.076 0-3.5 1.267-3.5 3.6v2.008h-2.34v2.717h2.34v6.993h3.15z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold">UCBF India</p>
                  <p className="text-xs text-gray-400">{t('home.followFacebook')}</p>
                </div>
              </a>

              <a 
                href="https://www.youtube.com/@ATHUMANESARINDIA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-spiritual-gold/10 hover:border-spiritual-gold/30 transition-all group"
              >
                <div className="h-12 w-12 bg-[#FF0000] rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Athumanesar India</p>
                  <p className="text-xs text-gray-400">@ATHUMANESARINDIA</p>
                </div>
              </a>
            </div>
            
            <div className="pt-4 flex flex-col items-center md:items-start gap-3">
              <div className="bg-white p-3 rounded-2xl shadow-xl hover:scale-105 transition-transform">
                  <QRCode value={window.location.origin} size={120} />
              </div>
              <p className="text-xs text-spiritual-gold/70 font-medium">{t('home.scanMobilePortal')}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-spiritual-gold font-bold tracking-widest text-lg">
              COPYRIGHTS RESERVED
            </p>
            <p className="text-gray-300 font-medium md:text-xl">
              UNITED CHRISTIAN BELIEVERS FELLOWSHIP (UCBF)
            </p>
            <p className="text-xs text-gray-500 pt-4">
              &copy; {new Date().getFullYear()} Athumanesar India Ministries. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
