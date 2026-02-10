
import React, { useState, createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  MapPin, 
  BookOpen, 
  Backpack, 
  User as UserIcon, 
  CheckCircle, 
  Droplets, 
  Flame, 
  Wind, 
  Clock, 
  ChevronRight,
  Sparkles,
  Camera,
  ArrowLeft,
  X,
  Send,
  Trophy,
  Navigation,
  LocateFixed,
  Zap,
  ShieldCheck,
  UserPlus,
  LogOut,
  Settings,
  RotateCcw,
  BarChart3,
  Search,
  AlertTriangle,
  Compass,
  Target,
  Info,
  Users as UsersIcon,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Clock9,
  Focus
} from 'lucide-react';
import { QUESTS, KEY_DESCRIPTIONS } from './constants';
import { GameState, InventoryItem, Quest, ValidationType, ChatMessage, User, UserRole } from './types';

// Declaration for Leaflet globally
declare var L: any;

// --- Services ---

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

// --- Utils ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // in metres
};

// --- Context ---
interface GameContextType {
  currentUser: User | null;
  users: User[];
  globalKeysFound: Set<string>;
  login: (name: string, password?: string) => void;
  logout: () => void;
  promoteToAdmin: (userId: string) => void;
  toggleManualQuest: (userId: string, questId: number, status?: 'approve' | 'reject') => void;
  validateQuest: (quest: Quest, answer?: string) => { success: boolean; message: string };
  validateImageQuest: (quest: Quest, file: File) => Promise<{ success: boolean; message: string }>;
  requestManualReview: (questId: number) => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendChatMessage: (quest: Quest, text: string) => Promise<void>;
  isChatLoading: boolean;
  startEntryQuest: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);
const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

// --- UI Components ---

const AnimatedBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute top-0 -left-4 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
    <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false, icon: Icon }: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-amber-500/25",
    secondary: "bg-slate-800/80 text-slate-100 border border-slate-600",
    outline: "bg-transparent border-2 border-amber-500/50 text-amber-500",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all",
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all",
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-2xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group ${variants[variant as keyof typeof variants]} ${disabled ? 'opacity-50 grayscale' : ''} ${className}`}
    >
      {Icon && <Icon size={20} />}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

const AuthView = () => {
  const { login } = useGame();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      <AnimatedBackground />
      <div className="z-10 w-full max-w-sm space-y-8 animate-in fade-in duration-1000">
        <div className="w-20 h-20 bg-amber-500 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/40">
          <ShieldCheck size={40} className="text-slate-900" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold text-white">Accès Gardien</h1>
          <p className="text-amber-500 font-bold tracking-widest uppercase text-[10px]">Identifiez-vous pour entrer dans Paris</p>
        </div>
        
        <div className="space-y-4">
          <input 
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Nom de Gardien"
            className="w-full bg-slate-900/80 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-amber-500 transition-all"
          />
          <input 
            type="password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full bg-slate-900/80 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-amber-500 transition-all"
          />
          <Button onClick={() => login(name, password)} icon={ChevronRight}>
            Rejoindre la Confrérie
          </Button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const { users, promoteToAdmin, toggleManualQuest, currentUser } = useGame();
  const [search, setSearch] = useState('');
  const [reviewItem, setReviewItem] = useState<{ user: User, questId: number } | null>(null);
  const admins = users.filter(u => u.role === 'admin');
  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(search.toLowerCase())), [users, search]);
  const pendingReviews = useMemo(() => {
    const list: { user: User, questId: number }[] = [];
    users.forEach(u => u.gameState.pendingReviewQuestIds?.forEach(id => list.push({ user: u, questId: id })));
    return list;
  }, [users]);

  return (
    <div className="h-full flex flex-col bg-slate-950 pt-12 relative z-[100]">
      <div className="px-6 flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3"><ShieldCheck className="text-amber-500" /> Sanctuaire</h2>
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
      </div>

      <div className="px-6 space-y-4 mb-6">
        {pendingReviews.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl border-amber-500/40 bg-amber-500/5 animate-pulse">
             <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock9 size={12} /> Requêtes en attente ({pendingReviews.length})</h3>
             <div className="space-y-2">
                {pendingReviews.map((rev, i) => (
                  <button key={i} onClick={() => setReviewItem(rev)} className="w-full bg-slate-900/80 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">{rev.user.name}</p>
                      <p className="text-[9px] text-slate-500">Quête #{rev.questId}</p>
                    </div>
                    <Eye size={16} className="text-slate-500 group-hover:text-amber-500" />
                  </button>
                ))}
             </div>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un Gardien..." className="w-full bg-slate-900 border border-white/5 py-3 pl-11 pr-4 rounded-xl text-xs outline-none focus:border-amber-500 transition-all text-white" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="glass-panel p-5 rounded-3xl border-white/5 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${user.role === 'admin' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-slate-800 border-white/10 text-slate-400'}`}><UserIcon size={24} /></div>
                <div>
                  <h4 className="font-bold text-white">{user.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>{user.role}</span>
                  </div>
                </div>
              </div>
              {user.role === 'player' && admins.length < 3 && <button onClick={() => promoteToAdmin(user.id)} className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl"><UserPlus size={18} /></button>}
            </div>
          </div>
        ))}
      </div>

      {reviewItem && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col p-6 animate-in fade-in zoom-in duration-300">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-white">Revue : {reviewItem.user.name}</h3>
              <button onClick={() => setReviewItem(null)} className="p-2 text-slate-400"><X size={24} /></button>
           </div>
           <div className="flex-1 rounded-3xl overflow-hidden mb-6 bg-slate-900 border border-white/10">
              <img src={`data:image/jpeg;base64,${reviewItem.user.gameState.lastImages[reviewItem.questId]}`} className="w-full h-full object-cover" alt="Preuve" />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <Button variant="danger" onClick={() => { toggleManualQuest(reviewItem.user.id, reviewItem.questId, 'reject'); setReviewItem(null); }} icon={ThumbsDown}>Rejeter</Button>
              <Button variant="success" onClick={() => { toggleManualQuest(reviewItem.user.id, reviewItem.questId, 'approve'); setReviewItem(null); }} icon={ThumbsUp}>Valider</Button>
           </div>
        </div>
      )}
    </div>
  );
};

const OracleChat = ({ isOpen, onClose, quest }: { isOpen: boolean, onClose: () => void, quest: Quest }) => {
  const { chatHistory, sendChatMessage, isChatLoading } = useGame();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [chatHistory, isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 w-full max-w-md h-[55vh] rounded-t-[2.5rem] flex flex-col shadow-2xl border-t border-amber-500/30 overflow-hidden animate-in slide-in-from-bottom duration-500" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1"></div>
        <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-amber-500 animate-pulse" />
            <h3 className="font-bold text-amber-100 text-sm">L'Oracle</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
          {chatHistory.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 px-4 rounded-2xl text-[13px] ${msg.sender === 'user' ? 'bg-amber-600 text-slate-950 font-bold' : 'bg-slate-800 border border-white/5 text-amber-50'}`}>{msg.text}</div>
            </div>
          ))}
          {isChatLoading && <div className="flex justify-start"><div className="bg-slate-800 p-3 rounded-2xl animate-pulse text-[13px] text-amber-500/50 italic">L'Oracle médite...</div></div>}
        </div>
        <div className="p-4 border-t border-white/5 flex gap-2 pb-8">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (sendChatMessage(quest, input), setInput(''))} placeholder="Posez votre question..." className="flex-1 bg-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none text-white" />
          <button onClick={() => { sendChatMessage(quest, input); setInput(''); }} disabled={isChatLoading || !input.trim()} className="bg-amber-500 p-2.5 rounded-xl text-slate-900 disabled:opacity-50"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
};

// --- REAL GPS MAP COMPONENT ---
const MapView = ({ onSelectQuest }: { onSelectQuest: (q: Quest) => void }) => {
  const { currentUser } = useGame();
  const [playerLoc, setPlayerLoc] = useState<{ lat: number; lng: number }>({ lat: 48.8566, lng: 2.3522 });
  const [heading, setHeading] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'simulated'>('searching');
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const [isFollowingPlayer, setIsFollowingPlayer] = useState(true);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const playerMarkerRef = useRef<any>(null);
  const playerCircleRef = useRef<any>(null);
  const questMarkersRef = useRef<Map<number, any>>(new Map());
  const destinationLineRef = useRef<any>(null);

  // Initialization of Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dark Matter tiles from CartoDB
    mapRef.current = L.map(mapContainerRef.current, {
      center: [playerLoc.lat, playerLoc.lng],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapRef.current);

    // Initial markers logic
    updateMarkers();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers and destination line
  const updateMarkers = () => {
    if (!mapRef.current) return;

    // Remove existing destination line
    if (destinationLineRef.current) {
      mapRef.current.removeLayer(destinationLineRef.current);
    }

    // Player Marker
    if (!playerMarkerRef.current) {
      const playerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative"><div class="absolute -inset-8 bg-blue-500/20 rounded-full animate-radar"></div><div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      playerMarkerRef.current = L.marker([playerLoc.lat, playerLoc.lng], { icon: playerIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
      
      // Interaction radius
      playerCircleRef.current = L.circle([playerLoc.lat, playerLoc.lng], {
        radius: 50,
        color: '#3b82f6',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        dashArray: '5, 10'
      }).addTo(mapRef.current);
    } else {
      playerMarkerRef.current.setLatLng([playerLoc.lat, playerLoc.lng]);
      playerCircleRef.current.setLatLng([playerLoc.lat, playerLoc.lng]);
    }

    // Quest Markers
    QUESTS.forEach(q => {
      if (!q.coordinates) return;
      
      const isDone = currentUser?.gameState.completedQuestIds.includes(q.id);
      const isSelected = selectedQuestId === q.id;
      const isNext = !isDone && (currentUser?.gameState.completedQuestIds.length === q.id || (q.id === 1 && currentUser?.gameState.completedQuestIds.length === 0));
      
      const dist = calculateDistance(playerLoc.lat, playerLoc.lng, q.coordinates.lat, q.coordinates.lng);
      const isNearby = dist <= 50;

      let marker = questMarkersRef.current.get(q.id);
      
      const markerHtml = `
        <div class="flex flex-col items-center transition-all duration-500 ${isSelected ? 'scale-125' : 'scale-100'}">
          ${isNearby && !isDone ? '<div class="absolute -inset-10 border-4 border-amber-400/50 rounded-full animate-radar"></div>' : ''}
          <div class="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-xl ${
            isDone ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
            isNearby ? 'bg-amber-400 border-white text-slate-950 animate-bounce' :
            isSelected ? 'bg-amber-500 border-white text-slate-950' :
            isNext ? 'bg-slate-800 border-amber-500 text-amber-500 animate-float' :
            'bg-slate-900 border-slate-700 text-slate-600 opacity-40'
          }">
            ${isDone ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : 
              isNearby ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>' :
              q.id === 6 ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>' :
              `<span class="font-bold text-[14px]">${q.id}</span>`
            }
          </div>
        </div>
      `;

      if (!marker) {
        const icon = L.divIcon({ className: 'custom-div-icon', html: markerHtml, iconSize: [40, 40], iconAnchor: [20, 20] });
        marker = L.marker([q.coordinates.lat, q.coordinates.lng], { icon }).addTo(mapRef.current);
        marker.on('click', () => setSelectedQuestId(q.id));
        questMarkersRef.current.set(q.id, marker);
      } else {
        const icon = L.divIcon({ className: 'custom-div-icon', html: markerHtml, iconSize: [40, 40], iconAnchor: [20, 20] });
        marker.setIcon(icon);
      }
    });

    // Draw Destiny Line to selected quest
    const selectedQuest = QUESTS.find(q => q.id === selectedQuestId);
    if (selectedQuest && selectedQuest.coordinates) {
      destinationLineRef.current = L.polyline(
        [[playerLoc.lat, playerLoc.lng], [selectedQuest.coordinates.lat, selectedQuest.coordinates.lng]],
        { color: '#fbbf24', weight: 3, opacity: 0.5, dashArray: '10, 10', className: 'destination-line' }
      ).addTo(mapRef.current);
    }
  };

  // GPS Tracking
  useEffect(() => {
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading: h } = pos.coords;
          setPlayerLoc({ lat: latitude, lng: longitude });
          setGpsStatus('locked');
          if (h !== null) setHeading(h);
          if (isFollowingPlayer && mapRef.current) {
            mapRef.current.panTo([latitude, longitude], { animate: true, duration: 1.0 });
          }
        },
        () => {
          setGpsStatus('simulated');
          const interval = setInterval(() => {
            setPlayerLoc(prev => ({ lat: prev.lat + (Math.random() - 0.5) * 0.00005, lng: prev.lng + (Math.random() - 0.5) * 0.00005 }));
          }, 4000);
          return () => clearInterval(interval);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => { if(watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isFollowingPlayer]);

  // Orientation logic
  useEffect(() => {
    const handleOrientation = (e: any) => {
      const h = e.webkitCompassHeading || (360 - e.alpha);
      if (h !== undefined) setHeading(h);
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Sync markers when state changes
  useEffect(() => {
    updateMarkers();
  }, [playerLoc, selectedQuestId, currentUser]);

  const selectedQuestData = useMemo(() => QUESTS.find(q => q.id === selectedQuestId), [selectedQuestId]);
  const distance = useMemo(() => {
    if (!selectedQuestData?.coordinates) return null;
    return calculateDistance(playerLoc.lat, playerLoc.lng, selectedQuestData.coordinates.lat, selectedQuestData.coordinates.lng);
  }, [playerLoc, selectedQuestData]);

  return (
    <div className="h-full w-full relative overflow-hidden flex flex-col bg-slate-950">
      {/* Map Target Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
      
      {/* Overlays */}
      <div className="absolute inset-0 z-10 map-overlay-shadow pointer-events-none"></div>

      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 z-40 pointer-events-none">
        <div className="glass-panel px-5 py-4 rounded-3xl flex justify-between items-center pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${gpsStatus === 'locked' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
              <LocateFixed size={20} className={gpsStatus === 'locked' ? 'animate-pulse' : ''} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GPS Status</p>
              <p className="text-xs font-mono font-bold text-white">{gpsStatus === 'locked' ? 'VERROUILLÉ' : 'SIMULÉ'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cap</p>
            <p className="text-xs font-mono font-bold text-white flex items-center justify-end gap-1">
              {Math.round(heading)}° <Compass size={14} className="text-amber-500" style={{ transform: `rotate(${heading}deg)` }} />
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Floating */}
      <div className="absolute right-6 top-32 z-40 flex flex-col gap-3 pointer-events-auto">
        <button 
          onClick={() => {
            setIsFollowingPlayer(!isFollowingPlayer);
            if (!isFollowingPlayer && mapRef.current) mapRef.current.panTo([playerLoc.lat, playerLoc.lng]);
          }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center glass-panel border-white/20 transition-all ${isFollowingPlayer ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' : 'text-slate-400'}`}
        >
          <Focus size={20} />
        </button>
        <button 
          onClick={() => mapRef.current?.zoomIn()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center glass-panel border-white/20 text-slate-400 active:scale-90"
        >
          <span className="font-bold text-xl">+</span>
        </button>
        <button 
          onClick={() => mapRef.current?.zoomOut()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center glass-panel border-white/20 text-slate-400 active:scale-90"
        >
          <span className="font-bold text-xl">-</span>
        </button>
      </div>

      {/* Quest Preview Slide-up */}
      {selectedQuestData && (
        <div className="absolute bottom-28 left-6 right-6 z-40 animate-in slide-in-from-bottom-10 pointer-events-auto">
          <div className="glass-panel overflow-hidden rounded-[2rem] border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[8px] font-black rounded uppercase tracking-widest">Objectif {selectedQuestData.id}</span>
                    {currentUser?.gameState.completedQuestIds.includes(selectedQuestData.id) && (
                        <span className="flex items-center gap-1 text-[8px] text-emerald-400 font-bold uppercase"><CheckCircle size={10} /> Archivé</span>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white leading-tight">{selectedQuestData.title}</h3>
                </div>
                <button onClick={() => setSelectedQuestId(null)} className="p-2 text-slate-500"><X size={20} /></button>
              </div>
              
              <div className="flex items-center gap-4 text-slate-400 text-[11px] font-medium">
                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-500" /> {selectedQuestData.location}</div>
                {distance !== null && <div className="flex items-center gap-1.5"><Navigation size={14} className="text-blue-400 rotate-45" /> {distance > 1000 ? `${(distance/1000).toFixed(1)} km` : `${Math.round(distance)} m`}</div>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => onSelectQuest(selectedQuestData)} className="flex-1 bg-amber-500 text-slate-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30">
                  Consulter les archives <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- REST OF THE APPLICATION REMAINS THE SAME BUT WRAPPED IN GAMEPROVIDER ---

const InventoryView = () => {
    const { currentUser, globalKeysFound } = useGame();
    const gameState = currentUser?.gameState;
    if (!gameState) return null;

    return (
        <div className="p-6 pt-12 h-full overflow-y-auto pb-32">
            <h2 className="text-2xl font-serif font-bold text-white mb-8">Sacoche de Gardien</h2>
            <div className="grid grid-cols-2 gap-4 mb-12">
                {['water', 'time', 'air', 'fire'].map(type => {
                    const keyId = `KEY_${type.toUpperCase()}`;
                    const item = gameState.inventory.find(i => i.id === keyId);
                    const icons = { water: Droplets, time: Clock, air: Wind, fire: Flame };
                    const Icon = icons[type as keyof typeof icons];
                    const isFoundGlobally = globalKeysFound.has(keyId);
                    
                    return (
                        <div key={type} className={`aspect-square rounded-3xl border flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all duration-500 ${
                            item ? 'bg-slate-800 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 
                            isFoundGlobally ? 'bg-amber-500/5 border-amber-500/20 opacity-60' : 'bg-slate-900/50 border-white/5 opacity-20'
                        }`}>
                            <Icon size={32} className={item ? 'text-amber-400' : isFoundGlobally ? 'text-amber-500/50' : 'text-slate-600'} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item ? item.name : 'Inconnue'}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const QuestHub = ({ onSelectQuest }: { onSelectQuest: (q: Quest) => void }) => {
    const { currentUser, globalKeysFound } = useGame();
    const gameState = currentUser?.gameState;
    if (!gameState) return null;

    const availableQuests = QUESTS.filter(q => q.id > 0 && q.id < 6);
    const unionQuest = QUESTS[6];
    const requiredKeys = ['KEY_WATER', 'KEY_TIME', 'KEY_AIR', 'KEY_FIRE'];
    const allCompletedGlobally = requiredKeys.every(k => globalKeysFound.has(k));

    return (
        <div className="p-6 pt-12 h-full overflow-y-auto pb-32">
            <h1 className="text-3xl font-serif font-bold text-white mb-8">Journal des Quêtes</h1>
            <div className="space-y-4">
                {availableQuests.map(q => (
                  <div key={q.id} onClick={() => onSelectQuest(q)} className={`p-5 rounded-3xl border transition-all cursor-pointer ${gameState.completedQuestIds.includes(q.id) ? 'bg-slate-950/50 border-emerald-500/20 opacity-50' : 'bg-slate-800 border-white/5 shadow-xl hover:border-amber-500/50'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-sm">{q.title}</h3>
                        {gameState.completedQuestIds.includes(q.id) && <CheckCircle size={16} className="text-emerald-500" />}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{q.location}</p>
                  </div>
                ))}
                
                {allCompletedGlobally && !gameState.completedQuestIds.includes(unionQuest.id) && (
                    <div onClick={() => onSelectQuest(unionQuest)} className="p-6 rounded-3xl bg-gradient-to-br from-amber-600/20 to-indigo-900/40 border border-amber-500/50 animate-pulse cursor-pointer shadow-2xl">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles size={20} className="text-amber-400" /> {unionQuest.title}</h3>
                        <p className="text-[10px] text-amber-200 mt-1 uppercase tracking-tighter">L'Union Sacrée vous attend à l'Arc de Triomphe</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ActiveQuestView = ({ quest, onBack }: { quest: Quest, onBack: () => void }) => {
    const { validateQuest, validateImageQuest, requestManualReview, currentUser, setChatHistory } = useGame();
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const gameState = currentUser?.gameState;
    const isCompleted = gameState?.completedQuestIds.includes(quest.id);
    const isPendingReview = gameState?.pendingReviewQuestIds?.includes(quest.id);

    useEffect(() => { setChatHistory([]); }, [quest.id]);

    const handleResult = (res: { success: boolean, message: string }) => {
        setFeedback({ type: res.success ? 'success' : 'error', msg: res.message });
        if (res.success) setTimeout(onBack, 3000);
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 relative">
            <div className="pt-6 px-6 bg-slate-950/90 backdrop-blur-md z-10 pb-4 border-b border-white/5">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white mb-4 group font-bold uppercase text-[10px] tracking-widest">
                    <ArrowLeft size={16} /> Retour au journal
                </button>
                <h1 className="text-2xl font-serif font-bold text-white leading-tight">{quest.title}</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-40 space-y-8">
                <div className="glass-panel p-8 rounded-[2rem] italic font-serif text-slate-200 text-sm leading-relaxed border-amber-500/10 shadow-2xl relative">
                    <div className="absolute -top-3 left-8 px-4 py-1 bg-slate-950 border border-amber-500/30 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest">Le Mythe</div>
                    "{quest.description}"
                </div>

                {isCompleted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-12 rounded-[2rem] text-center shadow-2xl animate-in zoom-in">
                        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
                        <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[11px]">Relique Obtenue</p>
                    </div>
                ) : isPendingReview ? (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-12 rounded-[2rem] text-center shadow-2xl">
                        <Clock9 size={64} className="text-amber-500 mx-auto mb-6 animate-pulse" />
                        <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-[11px]">En attente de revue</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {quest.validationType === ValidationType.IMAGE_AI && (
                          <div 
                              onClick={() => !isProcessing && document.getElementById('cam-input')?.click()}
                              className={`w-full aspect-video border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-500 ${isProcessing ? 'border-amber-500 bg-amber-500/10 animate-pulse' : 'border-slate-800 bg-slate-900 hover:border-amber-500/50 hover:bg-slate-800'}`}
                          >
                              <input id="cam-input" type="file" accept="image/*" capture="environment" className="hidden" 
                                  onChange={async (e) => {
                                      if (e.target.files?.[0]) {
                                          setIsProcessing(true);
                                          const res = await validateImageQuest(quest, e.target.files[0]);
                                          setIsProcessing(false);
                                          handleResult(res);
                                      }
                                  }}
                              />
                              <Camera size={48} className="text-amber-500 opacity-60" />
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Capturer l'Éveil</span>
                          </div>
                        )}
                        {quest.validationType === ValidationType.CHECK_INVENTORY && (
                            <Button onClick={() => handleResult(validateQuest(quest))} icon={Sparkles} className="h-20 text-lg uppercase tracking-widest">Invoquer l'Union Sacrée</Button>
                        )}
                    </div>
                )}

                {feedback.msg && (
                    <div className={`p-6 rounded-2xl text-center font-bold text-xs border animate-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-emerald-900/60 text-emerald-100 border-emerald-500/40' : 'bg-red-900/40 text-red-200 border-red-500/30'}`}>
                        {feedback.msg}
                        {feedback.type === 'error' && quest.validationType === ValidationType.IMAGE_AI && (
                             <button onClick={() => { requestManualReview(quest.id); setFeedback({ type: null, msg: '' }); }} className="block w-full mt-4 text-[10px] text-amber-500 underline uppercase font-black">Appel aux Maîtres</button>
                        )}
                    </div>
                )}
            </div>

            {!isCompleted && !isChatOpen && (
              <button onClick={() => setIsChatOpen(true)} className="fixed bottom-32 right-8 w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 shadow-2xl z-40 active:scale-90 transition-transform">
                <Sparkles size={24} />
              </button>
            )}
            <OracleChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} quest={quest} />
        </div>
    );
};

// --- GAME PROVIDER & MAIN LAYOUT ---

const GameProvider = ({ children }: { children?: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('gardien_users') || '[]'));
  const [currentUserId, setCurrentUserId] = useState<string | null>(localStorage.getItem('gardien_current_user_id'));
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => localStorage.setItem('gardien_users', JSON.stringify(users)), [users]);
  useEffect(() => currentUserId ? localStorage.setItem('gardien_current_user_id', currentUserId) : localStorage.removeItem('gardien_current_user_id'), [currentUserId]);

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || null, [users, currentUserId]);
  const globalKeysFound = useMemo(() => {
    const keys = new Set<string>();
    users.forEach(u => u.gameState.inventory.forEach(item => keys.add(item.id)));
    return keys;
  }, [users]);

  const login = (name: string, password?: string) => {
    const existing = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existing) setCurrentUserId(existing.id);
    else {
      const newUser: User = {
        id: Date.now().toString(),
        name, password, role: users.length === 0 ? 'admin' : 'player', 
        gameState: { completedQuestIds: [], pendingReviewQuestIds: [], lastImages: {}, inventory: [], isCompleted: false, hasStarted: false }
      };
      setUsers([...users, newUser]);
      setCurrentUserId(newUser.id);
    }
  };

  const logout = () => setCurrentUserId(null);
  const startEntryQuest = () => setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, gameState: { ...u.gameState, hasStarted: true } } : u));

  const toggleManualQuest = (userId: string, questId: number, action?: 'approve' | 'reject') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const quest = QUESTS.find(q => q.id === questId);
        if (!quest) return u;
        let newCompleted = [...u.gameState.completedQuestIds];
        let newInv = [...u.gameState.inventory];
        let newPending = (u.gameState.pendingReviewQuestIds || []).filter(id => id !== questId);
        
        if (action === 'approve') {
            if (!newCompleted.includes(questId)) {
                newCompleted.push(questId);
                if (quest.rewardKey && quest.rewardName) {
                    const desc = KEY_DESCRIPTIONS[quest.rewardKey];
                    newInv.push({ id: quest.rewardKey, name: quest.rewardName, iconType: desc.icon, description: desc.description, acquiredAt: Date.now() });
                }
            }
        } else if (action === 'reject') {
            newCompleted = newCompleted.filter(id => id !== questId);
            if (quest.rewardKey) newInv = newInv.filter(i => i.id !== quest.rewardKey);
        }
        return { ...u, gameState: { ...u.gameState, completedQuestIds: newCompleted, inventory: newInv, pendingReviewQuestIds: newPending, isCompleted: questId === 6 && action === 'approve' } };
      }
      return u;
    }));
  };

  const validateImageQuest = async (quest: Quest, file: File) => {
    const base64 = await fileToBase64(file);
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, gameState: { ...u.gameState, lastImages: { ...u.gameState.lastImages, [quest.id]: base64 } } } : u));
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: `Analyse cette image pour l'objectif ARG: ${quest.aiValidationPrompt}. Réponds JSON {valid: boolean, reason: string}.` }] },
            config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { valid: { type: Type.BOOLEAN }, reason: { type: Type.STRING } }, required: ["valid", "reason"] } }
        });
        const json = JSON.parse(response.text || '{}');
        if (json.valid) toggleManualQuest(currentUserId!, quest.id, 'approve');
        return { success: json.valid, message: json.reason || "L'Oracle est indécis." };
    } catch (e) { return { success: false, message: "Le voile d'Isis est trop épais." }; }
  };

  const validateQuest = (quest: Quest) => {
      const requiredKeys = ['KEY_WATER', 'KEY_TIME', 'KEY_AIR', 'KEY_FIRE'];
      const valid = requiredKeys.every(k => globalKeysFound.has(k));
      if (valid) toggleManualQuest(currentUserId!, quest.id, 'approve');
      return { success: valid, message: valid ? "L'Union Sacrée est accomplie." : "Les reliques ne chantent pas encore en chœur." };
  };

  const sendChatMessage = async (quest: Quest, text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: `Tu es l'Oracle mystique de Paris. Aide discrètement le Gardien sur: ${quest.title}. Pas de réponse directe.` }] }
        });
        setChatHistory(prev => [...prev, { id: Date.now().toString(), sender: 'oracle', text: res.text || "..." }]);
    } finally { setIsChatLoading(false); }
  };

  return (
    <GameContext.Provider value={{ 
      currentUser, users, globalKeysFound, login, logout, promoteToAdmin: (id) => {}, toggleManualQuest,
      validateQuest, validateImageQuest, requestManualReview: (id) => setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, gameState: { ...u.gameState, pendingReviewQuestIds: [...(u.gameState.pendingReviewQuestIds || []), id] } } : u)), chatHistory, setChatHistory, sendChatMessage, isChatLoading, startEntryQuest 
    }}>
      {children}
    </GameContext.Provider>
  );
};

const MainLayout = () => {
    const { currentUser, logout, startEntryQuest } = useGame();
    const [activeTab, setActiveTab] = useState('map');
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    if (!currentUser) return <AuthView />;
    if (isAdminPanelOpen) return <AdminDashboard onBack={() => setIsAdminPanelOpen(false)} />;
    
    if (!currentUser.gameState.hasStarted) return (
      <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col items-center justify-center p-8 text-center">
        <Sparkles size={64} className="text-amber-500 mb-8 animate-pulse" />
        <h1 className="text-4xl font-serif font-bold mb-4">Bienvenue, Gardien {currentUser.name}</h1>
        <p className="text-slate-400 italic mb-12 leading-relaxed">"Le destin de Paris repose sur votre intuition. Suivez la lumière, déchiffrez les pierres."</p>
        <Button onClick={startEntryQuest} icon={ChevronRight}>Initier l'Éveil</Button>
      </div>
    );

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col items-center">
            <div className="w-full max-w-md h-[100dvh] bg-slate-900 relative flex flex-col shadow-2xl border-x border-white/5 overflow-hidden">
                <main className="flex-1 overflow-hidden relative">
                    {selectedQuest ? <ActiveQuestView quest={selectedQuest} onBack={() => setSelectedQuest(null)} /> : (
                        <>
                            {activeTab === 'map' && <MapView onSelectQuest={setSelectedQuest} />}
                            {activeTab === 'quests' && <QuestHub onSelectQuest={setSelectedQuest} />}
                            {activeTab === 'inventory' && <InventoryView />}
                            {activeTab === 'profile' && (
                               <div className="p-12 flex flex-col items-center justify-center h-full space-y-12">
                                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center shadow-2xl"><UserIcon size={48} className="text-amber-500" /></div>
                                  <div className="text-center"><h2 className="text-2xl font-bold text-white mb-2">{currentUser.name}</h2><p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">{currentUser.role}</p></div>
                                  <div className="w-full space-y-3">
                                    {currentUser.role === 'admin' && <Button variant="outline" onClick={() => setIsAdminPanelOpen(true)} icon={Settings}>Conseil des Maîtres</Button>}
                                    <Button variant="danger" onClick={logout} icon={LogOut}>Quitter la Confrérie</Button>
                                  </div>
                               </div>
                            )}
                        </>
                    )}
                </main>
                {!selectedQuest && (
                    <nav className="fixed bottom-6 left-4 right-4 h-20 glass-panel rounded-[2rem] flex justify-around items-center z-50 border-white/20">
                        {[
                            { id: 'map', icon: Navigation, label: 'GPS' },
                            { id: 'quests', icon: BookOpen, label: 'Journal' },
                            { id: 'inventory', icon: Backpack, label: 'Sac' },
                            { id: 'profile', icon: UserIcon, label: 'Profil' }
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center justify-center w-16 h-16 transition-all duration-300 rounded-2xl ${activeTab === t.id ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500'}`}>
                                <t.icon size={22} />
                                <span className="text-[8px] font-black uppercase mt-1.5 tracking-tighter">{t.label}</span>
                            </button>
                        ))}
                    </nav>
                )}
            </div>
        </div>
    );
};

export default function App() {
  return (
    <GameProvider>
      <MainLayout />
    </GameProvider>
  );
}
