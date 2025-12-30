import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle, XCircle } from 'lucide-react';
import L from 'leaflet';

// Define custom icon to avoid import issues with default Leaflet icon
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Member {
  id: string;
  name: string;
  address: string;
  phone: string;
  pin_code?: string;
}

interface MembersMapProps {
  members: Member[];
}

interface GeocodedMember extends Member {
  lat: number;
  lng: number;
}

// Simple Error Boundary to prevent white screen
class MapErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Map Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-red-50">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-700">Map Failed to Load</h3>
          <p className="text-red-600 mt-2 text-sm">{this.state.error?.message || "Unknown error occurred"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const MembersMap: React.FC<MembersMapProps> = ({ members }) => {
  const [geocodedMembers, setGeocodedMembers] = useState<GeocodedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const isMounted = useRef(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    
    // Safety timeout to ensure loading doesn't stick forever if empty
    if (members.length === 0) {
      setLoading(false);
      return;
    }

    const geocodeMembers = async () => {
      setLoading(true);
      const results: GeocodedMember[] = [];
      const cache = JSON.parse(localStorage.getItem('member_geocoding_cache') || '{}');
      let cacheUpdated = false;

      let processedCount = 0;
      const totalToProcess = members.length;
      
      for (const member of members) {
        if (!isMounted.current) break;

        const addressKey = `${member.address?.toLowerCase().trim()}_${member.pin_code || ''}`;
        
        // Check cache first
        if (cache[addressKey]) {
          const cached = cache[addressKey];
           // validate cached coords
          if (cached && !isNaN(cached.lat) && !isNaN(cached.lng)) {
              results.push({ ...member, ...cached });
          }
          processedCount++;
          setProgress(Math.round((processedCount / totalToProcess) * 100));
          continue;
        }

        // If not in cache, fetch from Nominatim
        try {
          if (!member.address) { 
             processedCount++;
             continue; 
          }

          // Rate limiting: 1 request every 1.2 seconds
          await new Promise(resolve => setTimeout(resolve, 1200));

          const fetchCoords = async (query: string): Promise<{lat: number, lng: number} | null> => {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                headers: { 'User-Agent': 'ChurchPlannerApp/1.0' }
              });
              
              if (!response.ok) throw new Error('Network response was not ok');
              
              const data = await response.json();
              
              if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
              }
            } catch (e) {
              console.error(`[Geocode] Error fetching "${query}":`, e);
            }
            return null;
          };

          // Strategy 1: Exact address + pin
          let coords = await fetchCoords(`${member.address}, ${member.pin_code || ''}`);

          // Strategy 2: If failed, try stripping common noise for Indian addresses (e.g. "near ...")
          if (!coords && member.address.toLowerCase().includes('near')) {
             const cleanAddress = member.address.replace(/near\s+[^,]+,?/gi, ''); // Remove 'near X'
             if (cleanAddress !== member.address) {
                await new Promise(resolve => setTimeout(resolve, 1200)); // Respect rate limit between retries
                coords = await fetchCoords(`${cleanAddress}, ${member.pin_code || ''}`);
             }
          }

          // Strategy 3: Just the pin code (high confidence fallback)
          if (!coords && member.pin_code && member.pin_code.length >= 6) {
             await new Promise(resolve => setTimeout(resolve, 1200));
             coords = await fetchCoords(member.pin_code);
          }

          // Strategy 3.5: Extract zip from address if pin_code failed or missing
          // Supports Indian (6 digits) and Japanese (3-4 digits) formats
          if (!coords) {
             const zipMatch = member.address.match(/\b(\d{6}|\d{3}-\d{4})\b/);
             if (zipMatch) {
                await new Promise(resolve => setTimeout(resolve, 1200));
                coords = await fetchCoords(zipMatch[0]);
             }
          }

          // Strategy 4: Last resort - try finding city/district from last part of address
          if (!coords) {
             const parts = member.address.split(',').map(s => s.trim()).filter(s => s.length > 0);
             if (parts.length >= 2) {
                // Try the last 2 parts (e.g. "Tirunelveli, TamilNadu")
                const lastParts = parts.slice(-2).join(', ');
                await new Promise(resolve => setTimeout(resolve, 1200));
                coords = await fetchCoords(lastParts);
             }
          }

          if (coords) {
            cache[addressKey] = coords;
            cacheUpdated = true;
            results.push({ ...member, ...coords });
          } else {
             console.warn(`[Geocode] Failed to locate ${member.name} after all attempts.`);
          }
          
        } catch (error) {
          console.error("Geocoding validation failed for:", member.name, error);
        }

        processedCount++;
        setProgress(Math.round((processedCount / totalToProcess) * 100));
      }

      if (cacheUpdated) {
        localStorage.setItem('member_geocoding_cache', JSON.stringify(cache));
      }

      if (isMounted.current) {
        setGeocodedMembers(results);
        setLoading(false);
        setMapReady(true);
      }
    };

    geocodeMembers();

    return () => { isMounted.current = false; };
  }, [members]);

  // Default center 
  let defaultCenter: [number, number] = [20.5937, 78.9629]; // India center fallback
  if (geocodedMembers.length > 0) {
      const firstValid = geocodedMembers.find(m => !isNaN(m.lat) && !isNaN(m.lng));
      if (firstValid) {
          defaultCenter = [firstValid.lat, firstValid.lng];
      }
  }

  return (
    <div className="w-full h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 relative bg-slate-50">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-spiritual-blue animate-spin mb-4" />
          <p className="text-slate-600 font-bold mb-2">Locating Members on Map...</p>
          <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-spiritual-blue transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Using OpenStreetMap (Free Service)</p>
        </div>
      )}

      <MapErrorBoundary>
        {geocodedMembers.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
             <p className="font-bold">No locations found or addresses are invalid.</p>
          </div>
        ) : (
          !loading && (
              <MapContainer center={defaultCenter} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {geocodedMembers.map((member, idx) => (
                  !isNaN(member.lat) && !isNaN(member.lng) ? (
                      <Marker key={`${member.id}-${idx}`} position={[member.lat, member.lng]} icon={defaultIcon}>
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{member.name}</h3>
                            <div className="text-sm font-medium text-slate-600 mb-2">{member.phone}</div>
                            <div className="text-xs text-slate-400 border-t pt-2 mt-1">{member.address}</div>
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${member.lat},${member.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-3 text-center bg-spiritual-blue text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Get Directions
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                  ) : null
                ))}
              </MapContainer>
          )
        )}
      </MapErrorBoundary>
    </div>
  );
};

export default MembersMap;
