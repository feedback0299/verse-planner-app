import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { branchService, ChurchBranch } from '@/lib/commonService/branchService';
import { Loader2, MapPin, Phone, Globe } from 'lucide-react';

// Custom Pulse Icon for Headquarters
const createPulseIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pulse-marker',
    html: `
      <div class="pulse-container">
        <div class="pulse-ring" style="border-color: ${color}"></div>
        <div class="pulse-dot" style="background-color: ${color}"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const WorldMap = () => {
  const [branches, setBranches] = useState<ChurchBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await branchService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden pt-16">
      <style>{`
        .pulse-container {
          position: relative;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid;
          border-radius: 50%;
          animation: ripple 2s infinite ease-out;
          opacity: 0;
          z-index: 1;
        }
        @keyframes ripple {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        .leaflet-container {
          background: #d4dadc !important; /* Match Voyager water color to avoid white bars */
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          color: #0f172a;
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.9);
        }
        .leaflet-container {
          background: #d4dadc !important; 
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }
      `}</style>

      {/* Header Overlay - Positioned to flow naturally under the new Navigation height */}
      <div className="absolute top-24 left-10 z-[1000] pointer-events-none transition-all duration-500">
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-2xl">
                <Globe className="text-blue-600 h-6 w-6" />
             </div>
             Global Presence
          </h1>
          <p className="text-slate-500 text-xs mt-2 font-medium">Athumanesar branches worldwide</p>
          <div className="flex gap-4 mt-4">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Main Head</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Branches</span>
             </div>
          </div>
        </div>
      </div>

      <MapContainer 
        center={[20, 0]} 
        zoom={2.5} 
        scrollWheelZoom={true} 
        className="flex-1 w-full"
        zoomControl={false}
        minZoom={2}
        maxBounds={[[-85, -200], [85, 200]]}
        maxBoundsViscosity={0.8}
        zoomSnap={0.5}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          noWrap={false} // Allow wrapping for a more natural "all device" fit, but background matches
        />
        
        {branches.map((branch) => (
          <Marker 
            key={branch.id} 
            position={[branch.latitude, branch.longitude]}
            icon={createPulseIcon(branch.is_headquarters ? '#ef4444' : '#2563eb')}
            zIndexOffset={branch.is_headquarters ? 1000 : 0}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-bold text-lg text-slate-900 mb-1">{branch.name}</h3>
                <div className="flex items-start gap-2 text-slate-600 text-sm mb-2">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                  <span>{branch.address}</span>
                </div>
                {branch.phone && (
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Phone className="h-3 w-3 text-green-600" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.is_headquarters && (
                  <div className="mt-3 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-500 uppercase tracking-tighter inline-block">
                    International Headquarters
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default WorldMap;
