import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/dbService/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Users, Crown, VolumeX, LogOut, Loader2, XCircle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useWebRTC, Participant } from '@/hooks/useWebRTC';

const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [componentError, setComponentError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.RTCPeerConnection) {
      setComponentError("Your browser does not support WebRTC which is required for video calls. Please use a modern browser like Chrome or Safari.");
    }
  }, []);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isLocalVideoOff, setIsLocalVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isRetryingMedia, setIsRetryingMedia] = useState(false);

  const { participants, sendCommand, myId, signalingError } = useWebRTC(roomId || '', name, isAdmin, localStream);
  
  useEffect(() => {
    if (signalingError) setComponentError(signalingError);
  }, [signalingError]);
  
  useEffect(() => {
    checkAdminStatus();
    // Request initial stream for preview
    if (!hasJoined) {
      requestMedia();
    }
  }, [roomId]);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    try {
      const adminSession = localStorage.getItem('admin_session');
      const magazineSession = localStorage.getItem('magazine_admin_session');
      
      if (adminSession || magazineSession) {
        const session = JSON.parse(adminSession || magazineSession || '{}');
        setIsAdmin(true);
        setName(session.user?.name || 'Admin');
      }
    } catch (e) {
      console.error("Auth status check failed:", e);
    }
    setIsLoading(false);
  };

  const requestMedia = async (options = { video: true, audio: true }) => {
    setIsRetryingMedia(true);
    setMediaError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('NOT_SUPPORTED');
      }
      const stream = await navigator.mediaDevices.getUserMedia(options);
      setLocalStream(stream);
      setIsLocalVideoOff(!options.video);
      setIsLocalMuted(!options.audio);
      return true;
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      let errorMsg = "Could not access camera/microphone.";
      
      if (err.message === 'NOT_SUPPORTED') {
        errorMsg = "WebRTC is not supported in this browser/context.";
      } else if (err.name === 'NotAllowedError') {
        errorMsg = "Permissions Blocked. Please allow access in settings.";
      } else if (err.name === 'NotReadableError') {
        errorMsg = "Device Busy: Camera/Mic is used by another app.";
      } else if (err.name === 'NotFoundError') {
        errorMsg = "No media devices found.";
      }
      
      setMediaError(errorMsg);
      return false;
    } finally {
      setIsRetryingMedia(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Always allow joining, even if media failed (they can still see/hear others)
    setHasJoined(true);
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isLocalMuted);
      setIsLocalMuted(!isLocalMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = isLocalVideoOff);
      setIsLocalVideoOff(!isLocalVideoOff);
    }
  };

  const leaveRoom = () => {
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setHasJoined(false);
    navigate(isAdmin ? '/magazine-admin' : '/');
  };

  // Filter participants based on role requirements
  const visibleParticipants = (participants || []).filter(p => {
    if (!p) return false;
    if (isAdmin) return true; // Admin sees everyone
    return p.isAdmin; // Non-admin ONLY sees Admins
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="h-12 w-12 text-blue-500 animate-spin" /></div>;
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg"><Video className="text-blue-500" /></div>
              Join Meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 relative aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-white/5 shadow-inner group">
              {localStream && !isLocalVideoOff ? (
                <LocalVideoView stream={localStream} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 p-6 text-center">
                  <div className="p-4 bg-slate-700/50 rounded-full mb-4">
                    <VideoOff className="h-10 w-10 text-slate-500" />
                  </div>
                  {mediaError && (
                    <div className="space-y-3">
                      <p className="text-sm text-red-400 font-medium">{mediaError}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => requestMedia()}
                          disabled={isRetryingMedia}
                          className="bg-slate-800 border-slate-700 text-xs"
                        >
                          {isRetryingMedia ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                          Retry Full Access
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => requestMedia({ video: false, audio: true })}
                          disabled={isRetryingMedia}
                          className="bg-slate-800 border-slate-700 text-xs"
                        >
                          Join Audio Only
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ControlButton 
                  active={!isLocalMuted} 
                  icon={isLocalMuted ? <MicOff /> : <Mic />} 
                  onClick={toggleMic} 
                  size="sm"
                />
                <ControlButton 
                  active={!isLocalVideoOff} 
                  icon={isLocalVideoOff ? <VideoOff /> : <Video />} 
                  onClick={toggleVideo} 
                  size="sm"
                />
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              {!isAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Your Name</label>
                  <Input 
                    placeholder="Enter your name" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500 rounded-xl h-12"
                    required
                  />
                </div>
              )}
              {isAdmin && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center mb-4">
                   <p className="text-slate-400 text-sm">Joining as Admin</p>
                   <p className="text-white font-bold text-lg">{name}</p>
                </div>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold transition-all rounded-xl shadow-lg shadow-blue-900/20">
                Join Meeting Now
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (componentError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="p-6 bg-red-500/10 rounded-full border border-red-500/20 mb-6">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Technical Error</h1>
        <p className="text-white mb-2 font-mono text-xs p-3 bg-red-900/20 rounded-lg">{componentError}</p>
        <p className="text-slate-500 mb-8 max-w-sm text-sm">This usually happens on mobile browsers with restricted WebRTC/Supabase permissions. Please refresh or try another browser.</p>
        <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 px-8 h-12 rounded-xl font-bold">
          Reload Session
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans ${isAdmin ? 'pt-24' : ''}`}>
      <style>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
      {/* Header - Styled specifically for Admin/User needs */}
      <div className={`h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-xl z-20 ${isAdmin ? '' : 'fixed top-0 left-0 right-0'}`}>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-600/20 rounded-lg"><Video className="h-5 w-5 text-blue-400" /></div>
          <div>
            <h2 className="font-bold text-slate-100 leading-tight">Athumanesar India</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Room: {roomId}</p>
          </div>
          {isAdmin && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20 flex items-center gap-1 ml-2"><Crown className="h-3 w-3" /> ADMIN</span>}
        </div>
        <div className="flex items-center gap-6">
           {isAdmin && (
             <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-800/50 rounded-full border border-white/5">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-300">{participants.length + 1}</span>
             </div>
           )}
           <Button variant="destructive" size="sm" onClick={leaveRoom} className="rounded-full px-5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold">
             <LogOut className="h-4 w-4 mr-2" /> Leave
           </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto pb-24">
            <div className={`grid gap-6 ${isAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} auto-rows-[300px]`}>
              {/* Local Stream */}
              <ParticipantTile 
                stream={localStream} 
                name={name} 
                isAdmin={isAdmin} 
                isLocal={true} 
                isMuted={isLocalMuted} 
                isVideoOff={isLocalVideoOff}
              />

              {/* Remote Streams */}
              {visibleParticipants.map(p => (
                <ParticipantTile 
                  key={p.id}
                  participant={p}
                  isAdminControl={isAdmin}
                  onMute={() => sendCommand(p.id, 'MUTE')}
                  onKick={() => sendCommand(p.id, 'KICK')}
                  onStopVideo={() => sendCommand(p.id, 'STOP_VIDEO')}
                  connectionState={p.connectionState}
                />
              ))}
            </div>

            {!isAdmin && !visibleParticipants.some(p => p.isAdmin) && (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 space-y-4">
                 <div className="p-4 bg-slate-900 rounded-full animate-pulse">
                    <Video className="h-8 w-8" />
                 </div>
                 <p className="text-lg font-medium">Waiting for Admin to start the session...</p>
                 <p className="text-sm text-slate-600">The video will appear here automatically when the admin joins.</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Participant Sidebar */}
        {isAdmin && (
          <div className="w-80 bg-slate-900/50 border-l border-white/5 flex flex-col z-10 backdrop-blur-md">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-slate-200">Joined Members</h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold">{participants.length + 1}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Myself */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{name} (You)</p>
                  <p className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter">Meeting Host</p>
                </div>
                <div className="flex gap-1">
                  {isLocalMuted && <MicOff className="h-3 w-3 text-red-400" />}
                  {isLocalVideoOff && <VideoOff className="h-3 w-3 text-slate-500" />}
                </div>
              </div>

              {/* Others */}
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 transition-colors">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${p.isAdmin ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-700'}`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter flex items-center gap-2">
                      {p.isAdmin ? 'Administrator' : 'Participant'}
                      {p.connectionState && p.connectionState !== 'connected' && (
                        <span className="text-[8px] animate-pulse text-blue-400">({p.connectionState}...)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {p.isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                    {p.isVideoOff && <VideoOff className="h-3 w-3 text-slate-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className={`h-24 bg-slate-900/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-center gap-8 px-6 z-20 ${isAdmin ? 'pr-80' : ''}`}>
        <div className="flex items-center gap-4">
          <ControlButton 
            active={!isLocalMuted} 
            icon={isLocalMuted ? <MicOff /> : <Mic />} 
            onClick={toggleMic} 
          />
          <ControlButton 
            active={!isLocalVideoOff} 
            icon={isLocalVideoOff ? <VideoOff /> : <Video />} 
            onClick={toggleVideo} 
          />
        </div>

        {isAdmin && (
          <div className="h-10 w-[1px] bg-slate-800 mx-2" />
        )}

        {isAdmin && (
          <Button 
            variant="outline" 
            className="rounded-full px-6 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold h-14"
            onClick={() => sendCommand('all', 'MUTE')}
          >
            <VolumeX className="mr-2 h-4 w-4" /> Mute All
          </Button>
        )}
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const LocalVideoView = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <video 
      autoPlay 
      muted 
      playsInline 
      ref={videoRef} 
      className="w-full h-full object-cover mirror"
    />
  );
};

const ParticipantTile = ({ 
  stream, participant, name, isAdmin, isLocal, isMuted, isVideoOff,
  isAdminControl, onMute, onKick, onStopVideo 
}: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayName = isLocal ? name : participant?.name;
  const displayAdmin = isLocal ? isAdmin : participant?.isAdmin;
  const mutedStatus = isLocal ? isMuted : participant?.isMuted;
  const videoOffStatus = isLocal ? isVideoOff : participant?.isVideoOff;

  useEffect(() => {
    if (videoRef.current) {
      const activeStream = isLocal ? stream : participant?.stream;
      if (videoRef.current.srcObject !== activeStream) {
        videoRef.current.srcObject = activeStream || null;
      }
    }
  }, [stream, participant?.stream, isLocal]);

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-slate-900/80 border border-white/10 shadow-2xl transition-all hover:border-blue-500/30">
        <video 
          autoPlay 
          muted={isLocal} 
          playsInline 
          ref={videoRef} 
          className={`w-full h-full object-cover transition-transform group-hover:scale-105 duration-700 ${isLocal ? 'mirror' : ''}`}
        />
        
        {/* Name Label */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 shadow-xl">
           <span className="text-sm font-bold text-slate-100">{displayName}</span>
           {displayAdmin && <div className="p-1 bg-amber-500/20 rounded-md"><Crown className="h-3 w-3 text-amber-400" /></div>}
        </div>

        {/* Status Indicators */}
        <div className="absolute top-4 right-4 flex gap-2">
           {participant?.connectionState && participant.connectionState !== 'connected' && (
             <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 backdrop-blur-md text-blue-400 flex items-center gap-2 text-[10px] font-bold">
               <Loader2 className="h-3 w-3 animate-spin" /> {participant.connectionState.toUpperCase()}
             </div>
           )}
            {mutedStatus && <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-md text-red-500 shadow-lg"><MicOff className="h-4 w-4" /></div>}
            {videoOffStatus && <div className="p-2 rounded-xl bg-slate-950/80 border border-white/5 backdrop-blur-md text-slate-400 shadow-lg"><VideoOff className="h-4 w-4" /></div>}
        </div>

        {/* Admin Controls on Tile */}
        {isAdminControl && !isLocal && (
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
             <Button variant="secondary" size="icon" className="rounded-full bg-white text-slate-900 hover:bg-slate-200 shadow-xl" onClick={onMute} title="Mute Participant">
                <MicOff className="h-5 w-5" />
             </Button>
             <Button variant="secondary" size="icon" className="rounded-full bg-white text-slate-900 hover:bg-slate-200 shadow-xl" onClick={onStopVideo} title="Stop Participant Video">
                <VideoOff className="h-5 w-5" />
             </Button>
             <Button variant="destructive" size="icon" className="rounded-full shadow-xl" onClick={onKick} title="Kick from Room">
                <XCircle className="h-5 w-5" />
             </Button>
          </div>
        )}
    </div>
  );
};

const ControlButton = ({ active, icon, onClick, size = "lg", activeClass = "bg-blue-600 text-white shadow-blue-600/20" }: any) => (
  <Button 
    variant={active ? "default" : "secondary"} 
    size="icon" 
    className={`rounded-full transition-all duration-300 shadow-xl ${size === "sm" ? "h-10 w-10" : "h-14 w-14"} ${active ? activeClass : "bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white"}`}
    onClick={onClick}
  >
    {React.cloneElement(icon, { className: size === "sm" ? "h-4 w-4" : "h-6 w-6" })}
  </Button>
);

export default VideoRoom;
