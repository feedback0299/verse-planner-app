import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Stars } from '@react-three/drei';
import { branchService, ChurchBranch } from '@/lib/commonService/branchService';
import { Loader2, MapPin, Phone, Building2 } from 'lucide-react';
import * as THREE from 'three';

// Convert lat/long to 3D coordinates on sphere
// Adjusted for NASA Blue Marble texture orientation
const latLongToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180); // +180 offset centers the map
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  // Debug logging
  console.log(`🌍 Converting: lat=${lat.toFixed(2)}, lon=${lon.toFixed(2)} -> x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`);
  
  return new THREE.Vector3(x, y, z);
};

// Branch Marker Component
const BranchMarker = ({ branch, onHover }: { branch: ChurchBranch; onHover: (branch: ChurchBranch | null) => void }) => {
  const position = latLongToVector3(branch.latitude, branch.longitude, 2.03);
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={position}>
      <Sphere
        args={[0.02, 16, 16]}
        onPointerOver={() => {
          setHovered(true);
          onHover(branch);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        <meshStandardMaterial
          color={branch.is_headquarters ? '#ef4444' : '#3b82f6'}
          emissive={branch.is_headquarters ? '#ef4444' : '#3b82f6'}
          emissiveIntensity={hovered ? 1.5 : 0.5}
        />
      </Sphere>
      
      {hovered && (
        <Html distanceFactor={8} position={[0, 0.1, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200 min-w-[250px]">
            <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
              {branch.is_headquarters && <Building2 className="w-5 h-5 text-red-500" />}
              {branch.name}
            </h3>
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
        </Html>
      )}
    </group>
  );
};

// Earth Globe Component with Textures
const Earth = ({ branches, onHover }: { branches: ChurchBranch[]; onHover: (branch: ChurchBranch | null) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const markersRef = useRef<THREE.Group>(null);
  
  // Load Earth textures (NASA Blue Marble - free and open source)
  const textureLoader = new THREE.TextureLoader();
  
  // Using free NASA Earth textures from unpkg CDN
  const earthTexture = textureLoader.load('https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg');
  const earthBumpMap = textureLoader.load('https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png');
  const cloudsTexture = textureLoader.load('https://unpkg.com/three-globe@2.31.0/example/img/earth-clouds.png');
  
  // Auto-rotate the globe, clouds, and markers together
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0012; // Slightly faster for dynamic effect
    }
    if (markersRef.current) {
      markersRef.current.rotation.y += 0.001; // Same as Earth rotation
    }
  });
  
  return (
    <group>
      {/* Earth Sphere with Realistic Textures */}
      <Sphere ref={meshRef} args={[2, 128, 128]}>
        <meshStandardMaterial
          map={earthTexture}
          bumpMap={earthBumpMap}
          bumpScale={0.015}
          roughness={0.85}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Cloud Layer */}
      <Sphere ref={cloudsRef} args={[2.01, 64, 64]}>
        <meshStandardMaterial
          map={cloudsTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </Sphere>
      
      {/* Atmosphere Glow */}
      <Sphere args={[2.15, 64, 64]}>
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Branch Markers - rotate with globe */}
      <group ref={markersRef}>
        {branches.map((branch) => (
          <BranchMarker key={branch.id} branch={branch} onHover={onHover} />
        ))}
      </group>
    </group>
  );
};

// Scene Component
const Scene = ({ branches, onHover }: { branches: ChurchBranch[]; onHover: (branch: ChurchBranch | null) => void }) => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      <pointLight position={[-10, -10, -10]} intensity={1.2} color="#60a5fa" />
      <pointLight position={[0, 10, 0]} intensity={1.5} color="#ffffff" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Earth branches={branches} onHover={onHover} />
      
      <OrbitControls
        enablePan={false}
        minDistance={2.2}
        maxDistance={15}
        autoRotate={true}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
};

// Main Globe3D Component
const Globe3D = () => {
  const [branches, setBranches] = useState<ChurchBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBranch, setHoveredBranch] = useState<ChurchBranch | null>(null);
  
  useEffect(() => {
    loadBranches();
  }, []);
  
  const loadBranches = async () => {
    try {
      const data = await branchService.getBranches();
      console.log('📍 Loaded branches:', data.map(b => ({ name: b.name, lat: b.latitude, lon: b.longitude })));
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
    <div className="h-screen w-full bg-slate-950 relative overflow-hidden pt-24">
      {/* Header Overlay */}
      <div className="absolute top-24 left-10 z-10 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/20 shadow-2xl">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-2xl">
              <Building2 className="text-blue-400 h-6 w-6" />
            </div>
            3D Global Presence
          </h1>
          <p className="text-slate-300 text-xs mt-2 font-medium">
            Interactive globe with real Earth geography • {branches.length} locations worldwide
          </p>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></div>
              <span className="text-[9px] uppercase font-black text-slate-300 tracking-widest">Headquarters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
              <span className="text-[9px] uppercase font-black text-slate-300 tracking-widest">Branches</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
          <p className="text-slate-300 text-xs font-medium">
            🖱️ Drag to rotate • Scroll to zoom (satellite-level detail) • Hover markers for info
          </p>
        </div>
      </div>
      
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Scene branches={branches} onHover={setHoveredBranch} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Globe3D;
