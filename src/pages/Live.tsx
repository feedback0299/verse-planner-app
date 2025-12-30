import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Video, Radio, ExternalLink, Loader2 } from 'lucide-react';

const Live = () => {
  const { t } = useLanguage();
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const channelId = "UC0YnQoV-aY4gNnB8n0A8m8A";
  const uploadsPlaylistId = "UU0YnQoV-aY4gNnB8n0A8m8A";

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        // Use a public proxy to bypass CORS
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/channel/${channelId}/live`)}`);
        if (!response.ok) throw new Error('Failed to fetch status');
        
        const data = await response.json();
        const html = data.contents;
        
        // YouTube includes specific strings when a channel is live on its /live page
        // "isLive":true is a common indicator in the ytInitialData JSON within the HTML
        const isLiveNow = html.includes('"isLive":true') || html.includes('yt-badge-live');
        
        setIsLive(isLiveNow);
      } catch (error) {
        console.error('Error checking live status:', error);
        setIsLive(false); // Fallback to not live
      } finally {
        setIsLoading(false);
      }
    };

    checkLiveStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-spiritual-blue animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Checking live status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-spiritual-blue flex items-center justify-center gap-3">
            {isLive ? (
              <Radio className="h-8 w-8 text-red-600 animate-pulse" />
            ) : (
              <Video className="h-8 w-8 text-spiritual-gold" />
            )}
            {t('navigation.live')}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t('home.churchName')} - {isLive ? 'Watch our service live now.' : 'Watch our latest message.'}
          </p>
        </div>

        {/* Live Stream Section (Only if live) */}
        {isLive && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                Live Now
              </h2>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-200">
              <iframe
                src={`https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="YouTube Live Stream"
              ></iframe>
            </div>
          </div>
        )}

        {/* Latest Video Section */}
        <div className={`space-y-6 ${isLive ? 'pt-8 border-t border-slate-200' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <Video className="h-6 w-6 text-spiritual-blue" />
              Latest Video
            </h2>
            <a 
              href={`https://www.youtube.com/@ATHUMANESARINDIA`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-spiritual-blue hover:underline flex items-center gap-1 text-sm font-medium"
            >
              View All <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200">
            <iframe
              src={`https://www.youtube.com/embed/videoseries?list=${uploadsPlaylistId}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="YouTube Latest Videos"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Live;
