import { useEffect, useRef, useState } from 'react';
import { analyzeEmergency } from '../services/ai';
import { mockDb } from '../services/firebase';
import { sendAllEmergencyNotifications } from '../services/emergencyNotification';
import { MapContainer, TileLayer, Popup, Circle, CircleMarker, Polyline, useMap } from 'react-leaflet';
import { searchCities } from '../data/indianCities';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wifi, WifiOff, LogOut, Lock, PhoneCall, Mic, Send, AlertCircle, Activity, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const ACTIVE_EMERGENCY_STORAGE_KEY = 'activeEmergencyId';

const toUiStatus = (emergencyStatus) => {
  if (emergencyStatus === 'assigned' || emergencyStatus === 'arrived') return 'dispatched';
  if (emergencyStatus === 'pending') return 'pending';
  return 'idle';
};

const isRequestAccepted = (emergency) => emergency?.status === 'assigned' || emergency?.status === 'arrived';

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 14, { animate: true });
    }
  }, [center[0], center[1], map]);
  return null;
}


export default function UserApp() {
  const navigate = useNavigate();
  const { user, role, logout, isLoading } = useAuth();
  const [status, setStatus] = useState('idle'); // idle, asking, countdown, analyzing, pending, dispatched
  const [details, setDetails] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [networkMode, setNetworkMode] = useState('online');
  const [aiScore, setAiScore] = useState(null);
  const [countdownTimer, setCountdownTimer] = useState(10);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationMode, setLocationMode] = useState('gps'); // 'gps', 'city', or 'map'
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Offline queue for SOS
  const [offlineQueue, setOfflineQueue] = useState(() => {
    const saved = localStorage.getItem('emergency_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });
  // Effect to process offline queue when coming back online
  useEffect(() => {
    if (networkMode === 'online' && offlineQueue.length > 0) {
      const processQueue = async () => {
        const item = offlineQueue[0];
        // In a real app, we'd loop through all, but for SOS usually one at a time makes sense
        await executeDispatch(item.details, item.manualLocation);
        const newQueue = offlineQueue.slice(1);
        setOfflineQueue(newQueue);
        localStorage.setItem('emergency_offline_queue', JSON.stringify(newQueue));
        alert('✅ Network restored! Your queued SOS has been successfully dispatched.');
      };
      processQueue();
    }
  }, [networkMode, offlineQueue]);

  // Rate limiting: Prevent SOS spam (max 1 per minute)
  const [lastSOSTime, setLastSOSTime] = useState(0);
  const [sosLocked, setSosLocked] = useState(false);
  const [sosLockCountdown, setSosLockCountdown] = useState(0);

  // Redirect if not guest (but wait for session restore first)
  useEffect(() => {
    if (!isLoading && role !== 'guest') {
      navigate('/');
    }
  }, [role, navigate, isLoading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Handle SOS countdown timer
  useEffect(() => {
    if (!sosLocked) return;
    
    const timer = setInterval(() => {
      setSosLockCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSosLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sosLocked]);

  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice command is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    // Tap again to stop listening.
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += `${event.results[i][0].transcript} `;
        }
      }

      const text = finalTranscript.trim();
      if (text) {
        setDetails((prev) => (prev.trim() ? `${prev} ${text}` : text));
      }
    };

    recognition.onerror = (event) => {
      console.warn('Voice recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    const raw = localStorage.getItem('selectedEmergencyLocation');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.lat && parsed?.lng) {
        setSelectedLocation(parsed);
        setLocationMode('map');
        setUseManualLocation(true);
      }
      localStorage.removeItem('selectedEmergencyLocation');
    } catch (e) {
      console.error('Failed to parse selected map location:', e);
      localStorage.removeItem('selectedEmergencyLocation');
    }
  }, []);

  useEffect(() => {
    const storedId = localStorage.getItem(ACTIVE_EMERGENCY_STORAGE_KEY);
    if (!storedId) return;

    const restoredEmergency = mockDb.getEmergencyById(storedId);
    if (!restoredEmergency || restoredEmergency.status === 'resolved') {
      localStorage.removeItem(ACTIVE_EMERGENCY_STORAGE_KEY);
      return;
    }

    setActiveEmergency(restoredEmergency);
    setStatus(toUiStatus(restoredEmergency.status));
  }, []);

  const fetchLocationSuggestions = (input) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Search in local database
    const matches = searchCities(input);

    if (matches.length > 0) {
      console.log("✅ Found local matches:", matches.length);
      setSuggestions(matches.map(item => ({
        name: item.name,
        display: `${item.name}, ${item.state}, India`,
        lat: item.lat,
        lng: item.lng
      })));
      setShowSuggestions(true);
    } else {
      console.log("❌ No matches found for:", input);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    console.log("📌 Selected suggestion:", suggestion.name, "→ lat:", suggestion.lat, "lng:", suggestion.lng);
    setManualAddress(suggestion.name);
    setSelectedLocation({ lat: suggestion.lat, lng: suggestion.lng });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    let interval;
    if (status === 'countdown') {
      interval = setInterval(() => {
        setCountdownTimer((prev) => {
           if (prev <= 1) {
              clearInterval(interval);
              // Check if we are offline
              if (networkMode === 'offline') {
                const queueItem = {
                  details: details || "Immediate assistance requested",
                  manualLocation: selectedLocation || (useManualLocation && manualAddress ? manualAddress : null),
                  timestamp: Date.now()
                };
                const newQueue = [...offlineQueue, queueItem];
                setOfflineQueue(newQueue);
                localStorage.setItem('emergency_offline_queue', JSON.stringify(newQueue));
                setStatus('idle'); // Back to idle after queuing
                setDetails('');
                setSelectedLocation(null);
                alert('⚠️ No connection: Your SOS has been QUEUED and will be sent automatically when you are back online.');
                return 0;
              }
              executeDispatch();
              return 0;
           }
           return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, networkMode, offlineQueue]);

  useEffect(() => {
    if (!activeEmergency?.id) return;

    const unsub = mockDb.listenEmergencyById(activeEmergency.id, (updated) => {
      if (!updated || updated.status === 'resolved') {
        setActiveEmergency(null);
        setStatus('idle');
        localStorage.removeItem(ACTIVE_EMERGENCY_STORAGE_KEY);
        return;
      }

      setActiveEmergency(updated);
      setStatus(toUiStatus(updated.status));
    });

    return unsub;
  }, [activeEmergency?.id]);

  const handleSOS = () => {
    console.log('🚨 SOS button pressed');
    
    // Rate limiting check (max 1 SOS per 60 seconds)
    const now = Date.now();
    const timeSinceLastSOS = now - lastSOSTime;
    const MIN_SOS_INTERVAL = 60000; // 60 seconds

    if (timeSinceLastSOS < MIN_SOS_INTERVAL && lastSOSTime > 0) {
      const secondsRemaining = Math.ceil((MIN_SOS_INTERVAL - timeSinceLastSOS) / 1000);
      console.warn('⏱️ SOS locked for', secondsRemaining, 'seconds');
      setSosLocked(true);
      setSosLockCountdown(secondsRemaining);
      alert(`⏱️ SOS is on cooldown for ${secondsRemaining} seconds to prevent spam. Please wait.`);
      return;
    }

    setLastSOSTime(now);
    
    if (!details.trim()) {
      console.log('📝 Asking for details...');
      setStatus('asking');
    } else {
      console.log('⏱️ Starting countdown with details:', details);
      setStatus('countdown');
      setCountdownTimer(10);
    }
  };

  const triggerSOSWithDetails = (opt) => {
    console.log('📢 Triggering SOS with:', opt);
    setDetails(opt);
    setStatus('countdown');
    setCountdownTimer(10);
  };

  const executeDispatch = async () => {
    const textToAnalyze = details || "Immediate assistance requested";

    setStatus('analyzing');
    setAiScore(null);
    
    // We launch localization and analysis concurrently
    let locationToUse = null;
    const locationPromise = (async () => {
      // If a location was explicitly selected (from city search or map), use it directly!
      if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
        console.log("✅ Using selected location from", locationMode, "→ lat:", selectedLocation.lat, "lng:", selectedLocation.lng);
        return selectedLocation;
      }
      
      if (useManualLocation && manualAddress.trim()) {
        // Only try geocoding if address text is provided but location not selected
        // (selected locations are already handled above)
        try {
           const query = manualAddress.includes(',') ? manualAddress : `${manualAddress}, India`;
           console.log("🔍 Geocoding query:", query);
           const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=10&zoom=10`, {
             headers: {
               'User-Agent': 'EmergencyApp/1.0'
             }
           });
           const data = await res.json();
           console.log("📍 Geocoding results:", data);
           
           if (data && data.length > 0) {
              // Use the first result with highest importance, or if multiple have same importance, pick best match
              const bestResult = data.sort((a, b) => {
                const aImportance = parseFloat(a.importance) || 0;
                const bImportance = parseFloat(b.importance) || 0;
                if (aImportance !== bImportance) return bImportance - aImportance;
                // If same importance, prefer exact match of query term
                const aMatch = a.name.toLowerCase().includes(manualAddress.toLowerCase()) ? 1 : 0;
                const bMatch = b.name.toLowerCase().includes(manualAddress.toLowerCase()) ? 1 : 0;
                return bMatch - aMatch;
              })[0];
              
              const finalLat = parseFloat(bestResult.lat);
              const finalLng = parseFloat(bestResult.lon);
              console.log("✅ Selected location:", bestResult.name, "→ lat:", finalLat, "lng:", finalLng);
              return { lat: finalLat, lng: finalLng };
           }
           console.warn("❌ No results found for:", query);
        } catch (e) { 
           console.error("❌ Geocoding failed:", e);
        }
        
        // If we strictly asked for manual address but Nominatim failed to find it,
        // DO NOT silently capture physical GPS. Intentionally fail out to the New Delhi defaults.
        return null;
      }

      if ("geolocation" in navigator) {
        return await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null)
          );
        });
      }

      return null;
    })();

    // 1. Analyze text with AI
    const analysisPromise = analyzeEmergency(textToAnalyze);
    
    const [analysis, position] = await Promise.all([analysisPromise, locationPromise]);
    
    if (position) {
      locationToUse = position;
      setCurrentLocation(position);
    } else {
      locationToUse = currentLocation || { lat: 28.6139, lng: 77.2090 }; // Default to New Delhi, India
    }

    // Capture calculated score and display it directly on the wheel for user to see
    setAiScore(analysis.criticalScore);
    
    // Hold the screen for 2.5 seconds so the user can see their exact metric
    await new Promise(r => setTimeout(r, 2500));

    // 2. Dispatch to backend (Mock Firebase)
    const em = mockDb.saveEmergency({
      location: locationToUse,
      details: textToAnalyze,
      type: analysis.category,
      priority: analysis.priority,
      criticalScore: analysis.criticalScore,
      status: 'pending',
      guestData: {
        name: user?.name,
        room: user?.room,
        floor: user?.floor,
        phone: user?.phone,
        email: user?.email,
        medicalInfo: user?.medicalInfo,
        diseases: user?.diseases,
        emergencyContact: user?.emergencyContact,
        emergencyContactPhone: user?.emergencyContactPhone
      },
      floor: user?.floor
    });
    
    localStorage.setItem(ACTIVE_EMERGENCY_STORAGE_KEY, em.id);
    setActiveEmergency(em);
    setStatus('pending');

    // 3. Send emergency notifications to emergency contact
    if (user?.emergencyContactPhone || user?.email) {
      const notificationData = {
        guestName: user?.name || 'Guest',
        emergencyType: analysis.category || 'Emergency',
        details: textToAnalyze || 'Emergency assistance requested',
        room: user?.room || 'Unknown',
        floor: user?.floor || 'Unknown',
        location: locationToUse,
        priority: analysis.priority,
        criticalScore: analysis.criticalScore,
        timestamp: new Date().toISOString(),
        medicalInfo: user?.medicalInfo,
        diseases: user?.diseases
      };

      console.log('📱 Preparing to send notifications...', {
        phone: user?.emergencyContactPhone,
        email: user?.email,
        emergencyContactName: user?.emergencyContact
      });

      // Send notifications asynchronously (don't block UI)
      sendAllEmergencyNotifications(
        user?.emergencyContactPhone,
        user?.email,
        notificationData
      ).then(result => {
        console.log('✅ Notification send result:', result);
      }).catch(error => {
        console.error('❌ Error sending notifications:', error);
      });
    } else {
      console.warn('⚠️ No emergency contact info available for notifications');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 z-10 relative overflow-hidden bg-white">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold text-lg">Loading session...</p>
        </div>
      ) : (
        <>
      {/* Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-[100]">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow">
          <span className="font-bold text-slate-900">Guest: {user?.name || 'Anonymous'}</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">Room {user?.room}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setNetworkMode(m => m === 'online' ? 'offline' : 'online')} 
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 font-bold transition-colors shadow-sm border backdrop-blur ${
              networkMode === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            {networkMode === 'online' ? <Wifi className="w-5 h-5"/> : <WifiOff className="w-5 h-5"/>}
          </button>
          <button
            onClick={() => {
              logout();
                navigate('/');
            }}
            className="px-4 py-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold flex items-center gap-2 transition-colors shadow-sm border border-red-300 backdrop-blur"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Vibrant Ambient glow for Unique SOS Aesthetic */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-rose-400/20 to-orange-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-400/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {status === 'idle' && (
        <div className="flex flex-col items-center max-w-md w-full glass p-10 rounded-[2rem] animate-[fadeIn_0.5s_ease-out] shadow-2xl shadow-rose-900/5 relative z-10 border border-white/50">
          <h1 className="text-4xl font-extrabold mb-3 text-center tracking-tight text-gray-900">Rapid Crisis Response</h1>
          <p className="text-gray-500 text-center mb-12 font-medium">Report a hotel emergency instantly. Our AI alerts the right team with exact location and priority.</p>
          
          <button 
            onClick={handleSOS}
            disabled={sosLocked}
            className={`relative lg:w-72 lg:h-72 w-56 h-56 rounded-full flex items-center justify-center mb-12 transition-all duration-300 group ${
              sosLocked 
                ? 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-[0_20px_60px_-10px_rgba(107,114,128,0.4)] cursor-not-allowed opacity-75' 
                : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_20px_60px_-10px_rgba(225,29,72,0.6)] hover:scale-105'
            }`}
          >
            {!sosLocked && (
              <>
                <div className="absolute w-full h-full rounded-full border-4 border-rose-500/40 animate-ripple pointer-events-none" />
                <div className="absolute w-full h-full rounded-full border-4 border-rose-400/20 animate-ripple pointer-events-none" style={{ animationDelay: '0.4s'}} />
              </>
            )}
            {sosLocked && (
              <div className="absolute w-full h-full rounded-full border-4 border-gray-600/40 pointer-events-none" />
            )}
            <div className="flex flex-col items-center text-white scale-110 group-hover:scale-125 transition-transform duration-300">
              {sosLocked ? (
                <>
                  <Lock className="w-16 h-16 mb-3" />
                  <span className="text-4xl font-black tracking-widest drop-shadow-md">{sosLockCountdown}s</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-16 h-16 mb-3" />
                  <span className="text-5xl font-black tracking-widest drop-shadow-md">SOS</span>
                </>
              )}
            </div>
          </button>

          <div className="w-full mb-5 px-4 bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl shadow-sm hover:border-slate-200 transition-colors">
            <label className="text-lg font-bold text-slate-700 mb-3 block">Select Location:</label>
            
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => {
                  setLocationMode('gps');
                  setUseManualLocation(false);
                  setSelectedLocation(null);
                  setManualAddress('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all ${
                  locationMode === 'gps' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300'
                }`}
              >
                GPS
              </button>
              
              <button
                onClick={() => {
                  setLocationMode('city');
                  setUseManualLocation(true);
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all ${
                  locationMode === 'city' 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-emerald-300'
                }`}
              >
                City
              </button>

              <button
                onClick={() => {
                  setLocationMode('map');
                  setUseManualLocation(true);
                  setSelectedLocation(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all ${
                  locationMode === 'map'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300'
                }`}
              >
                Map
              </button>
            </div>

            {locationMode === 'city' && (
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Enter Address / City..." 
                  value={manualAddress}
                  onChange={e => {
                    setManualAddress(e.target.value);
                    fetchLocationSuggestions(e.target.value);
                  }}
                  onFocus={() => manualAddress && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoFocus
                  className="border-2 border-slate-300 outline-none focus:border-emerald-400 text-base py-2 px-3 font-bold bg-white rounded-lg text-slate-800 transition-colors w-full shadow-sm"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0 text-sm font-medium text-slate-800 transition-colors"
                      >
                        <div className="font-bold text-slate-900">{suggestion.name}</div>
                        <div className="text-xs text-slate-500">{suggestion.display?.split(',').slice(-2).join(',')}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedLocation && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700 font-bold">
                    ✅ Selected: ({selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°)
                  </div>
                )}
              </div>
            )}

            {locationMode === 'map' && (
              <div className="w-full">
                <button
                  onClick={() => navigate('/map-selector')}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-3"
                >
                  Open Map Picker
                </button>
                {selectedLocation && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700 font-bold">
                    ✅ Selected: ({selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°)
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full relative group shadow-sm rounded-2xl">
            <textarea
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 pl-14 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors resize-none font-medium text-lg"
              placeholder="Describe the incident (room, floor, what happened)..."
              rows="2"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <Mic
              onClick={handleVoiceCommand}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`absolute left-5 top-6 cursor-pointer transition-colors w-6 h-6 ${
                isListening ? 'text-rose-600 animate-pulse' : 'text-slate-400 hover:text-rose-500'
              }`}
            />
            <button 
               onClick={handleSOS}
               disabled={sosLocked}
               className={`absolute right-4 bottom-4 p-2.5 rounded-xl transition-all text-white font-bold ${
                 sosLocked 
                   ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-60' 
                   : 'bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-lg'
               }`}
            >
              {sosLocked ? <Lock className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {status === 'countdown' && (
        <div className="flex flex-col items-center glass p-12 rounded-[2rem] max-w-sm w-full shadow-2xl relative z-10 border border-rose-200">
          <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 140 140">
               <circle cx="70" cy="70" r="60" className="stroke-slate-200" strokeWidth="8" fill="none" />
               <circle cx="70" cy="70" r="60" className="flex transition-all duration-1000 ease-linear" strokeWidth="8" fill="none" strokeDasharray="377" strokeDashoffset={377 - (377 * countdownTimer) / 10} style={{ stroke: '#e11d48'}} />
            </svg>
            <span className="text-6xl font-black text-rose-600 drop-shadow-lg z-10">{countdownTimer}</span>
          </div>
          <h2 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">Alert Initiated</h2>
          <p className="text-gray-500 text-center mb-8 font-medium">Cancel within {countdownTimer} seconds if this alert was accidental.</p>
          <div className="w-full space-y-3">
            <button 
               onClick={() => {
                setCountdownTimer(0);
                executeDispatch();
               }}
               className="w-full bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-xl font-bold transition-all border-2 border-rose-700 shadow-lg shadow-rose-600/30"
            >
               Confirm Alert 
            </button>
            <button 
               onClick={() => {
                setStatus('idle');
                setDetails('');
                setSelectedLocation(null);
                setActiveEmergency(null);
                localStorage.removeItem(ACTIVE_EMERGENCY_STORAGE_KEY);
               }}
               className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 p-4 rounded-xl font-bold transition-all border-2 border-slate-300"
            >
               Cancel Alert
            </button>
          </div>
        </div>
      )}

      {status === 'asking' && (
        <div className="flex flex-col items-center max-w-2xl w-full glass p-10 rounded-[2rem] animate-[fadeIn_0.5s_ease-out] shadow-2xl shadow-rose-900/5 relative z-10 border border-white/50">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">What help do you need?</h2>
          
          {/* Category Buttons Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            {/* Row 1: Medical & Fire */}
            <button 
              onClick={() => triggerSOSWithDetails("Medical emergency in hotel. Need immediate assistance.")} 
              className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 hover:border-red-400 hover:shadow-lg p-6 rounded-2xl flex flex-col items-center gap-3 transition-all text-red-700 hover:text-red-900 font-bold"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <span className="text-lg">Medical</span>
            </button>

            <button 
              onClick={() => triggerSOSWithDetails("Fire detected in hotel area. Evacuation support needed.")} 
              className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg p-6 rounded-2xl flex flex-col items-center gap-3 transition-all text-orange-700 hover:text-orange-900 font-bold"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-lg">Fire</span>
            </button>

            {/* Row 2: Security & Other */}
            <button 
              onClick={() => triggerSOSWithDetails("Security threat reported. Send hotel security immediately.")} 
              className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg p-6 rounded-2xl flex flex-col items-center gap-3 transition-all text-blue-700 hover:text-blue-900 font-bold"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-lg">Security</span>
            </button>

            <button 
              onClick={() => triggerSOSWithDetails("Possible natural disaster impact. Need urgent coordination.")} 
              className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg p-6 rounded-2xl flex flex-col items-center gap-3 transition-all text-purple-700 hover:text-purple-900 font-bold"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-lg">Other</span>
            </button>
          </div>

          {/* Custom Details Input */}
          <div className="w-full">
            <p className="text-sm text-slate-600 font-medium mb-2">Or describe your emergency:</p>
            <div className="w-full relative shadow-sm rounded-2xl">
              <textarea
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 pl-5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors resize-none font-medium"
                placeholder="Type specific details about your emergency..."
                rows="3"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
              <button 
                 onClick={() => triggerSOSWithDetails(details)}
                 disabled={!details.trim()}
                 className={`absolute right-4 bottom-4 p-2.5 rounded-xl transition-all text-white ${details.trim() ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-md hover:scale-105' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'analyzing' && (
        <div className="flex flex-col items-center glass p-12 rounded-[2rem] max-w-sm w-full shadow-2xl relative z-10 border border-white/50">
          <div className={`w-24 h-24 border-4 rounded-full mb-8 shadow-sm ${aiScore ? 'border-emerald-500 bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-3xl transition-all scale-110 shadow-emerald-500/30' : 'border-rose-100 border-t-rose-500 animate-spin'}`}>
            {aiScore ? `${aiScore}%` : null}
          </div>
          <h2 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">
            {aiScore ? 'Analysis Complete' : 'AI Priority Engine'}
          </h2>
          <p className="text-gray-500 text-center mb-6 font-medium">
            {aiScore ? 'Incident severity quantified and categorized.' : 'Classifying incident from voice/text to trigger the right hotel response team...'}
          </p>
          <div className="w-full bg-slate-100 h-2 mt-2 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full ${aiScore ? 'bg-emerald-500 transition-all duration-1000' : 'bg-gradient-to-r from-amber-400 to-rose-500 animate-[pulse_1s_ease-in-out_infinite]'}`} 
              style={{width: aiScore ? `${aiScore}%` : '85%'}}
            ></div>
          </div>
          <p className={`text-sm mt-4 font-extrabold tracking-widest ${aiScore ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
            {aiScore ? `CRITICAL SCORE MATCHED` : `ANALYZING INTENT...`}
          </p>
        </div>
      )}

      {(status === 'pending' || status === 'dispatched') && activeEmergency && (
        <div className="w-full max-w-2xl glass rounded-[2rem] overflow-hidden flex flex-col shadow-2xl shadow-emerald-900/10 border border-white/50 relative z-10">
          <div className={`border-b p-8 flex items-center gap-5 ${status === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
            {status === 'pending' ? (
               <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
            ) : (
               <div className="relative">
                 <CheckCircle className="text-emerald-500 w-12 h-12" />
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
               </div>
            )}
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {status === 'pending' ? 'Incident Reported' : 'Response Team En Route'}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className={`font-bold ${status === 'pending' ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {status === 'pending' ? 'Waiting for hotel command center to assign staff...' : `ETA: ${activeEmergency.status === 'arrived' ? 'Team on Site' : '4 minutes'}`}
                </p>
                {status === 'dispatched' && activeEmergency.status !== 'arrived' && (
                  <div className="flex-1 h-2 bg-emerald-200 rounded-full overflow-hidden max-w-[150px]">
                    <div className="h-full bg-emerald-500 animate-[progress_10s_ease-in-out_infinite]" style={{ width: '65%' }} />
                  </div>
                )}
              </div>
              {networkMode === 'offline' && <span className="mt-1 inline-block text-rose-500 text-xs font-bold px-2 py-0.5 bg-rose-100 rounded">Offline fallback mode</span>}
              {isRequestAccepted(activeEmergency) && activeEmergency.status !== 'arrived' && (
                <p className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200">
                  Staff Member: {activeEmergency.responderName || 'Security Team B'} • Accepted
                </p>
              )}
            </div>
          </div>
          
          {/* Emergency Contact Notification */}
          {(activeEmergency.guestData?.emergencyContactPhone || activeEmergency.guestData?.email) && (
            <div className="border-b p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-emerald-900 text-sm uppercase tracking-wider mb-2">Emergency Contact Notified</h3>
                  <p className="text-emerald-800 font-semibold text-sm">
                    ✓ Notification sent to emergency contact with:
                  </p>
                  <ul className="mt-2 ml-4 text-emerald-700 font-medium text-sm space-y-1">
                    <li>• <strong>Your Location:</strong> Room {activeEmergency.guestData?.room}, Floor {activeEmergency.guestData?.floor}</li>
                    <li>• <strong>Emergency Type:</strong> {activeEmergency.type}</li>
                    <li>• <strong>Severity Level:</strong> {activeEmergency.priority?.toUpperCase()}</li>
                    <li>• <strong>Critical Score:</strong> {(activeEmergency.criticalScore * 100).toFixed(0)}%</li>
                    {activeEmergency.guestData?.medicalInfo && <li>• <strong>Medical Details:</strong> Included in notification</li>}
                  </ul>
                  <p className="text-emerald-600 font-semibold text-xs mt-3">
                    {activeEmergency.guestData?.emergencyContactPhone && `SMS: ${activeEmergency.guestData.emergencyContactPhone}`}
                    {activeEmergency.guestData?.emergencyContactPhone && activeEmergency.guestData?.email && ' • '}
                    {activeEmergency.guestData?.email && `Email: ${activeEmergency.guestData.email}`}
                  </p>
                </div>
              </div>
            </div>
          )}
           
          <div className="h-72 w-full bg-slate-100 relative z-0">
             {(activeEmergency.location || currentLocation) && activeEmergency.status !== 'arrived' ? (
                <MapContainer 
                  center={[activeEmergency.location.lat, activeEmergency.location.lng]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <MapUpdater center={[activeEmergency.location.lat, activeEmergency.location.lng]} />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  />
                  <Circle 
                    center={[activeEmergency.location.lat, activeEmergency.location.lng]} 
                    pathOptions={{ color: '#e11d48', fillColor: '#e11d48', fillOpacity: 0.15 }}
                    radius={200}
                  >
                    <Popup>Incident Location</Popup>
                  </Circle>

                  {/* Always show an explicit user marker so location is unmistakable */}
                  <CircleMarker
                    center={[activeEmergency.location.lat, activeEmergency.location.lng]}
                    pathOptions={{ color: '#e11d48', fillColor: '#e11d48', fillOpacity: 1 }}
                    radius={6}
                  >
                    <Popup>Exact Incident Spot</Popup>
                  </CircleMarker>
                  
                  {/* Show responder only after assignment to avoid confusion while request is still pending */}
                  {activeEmergency.responderLocation && status !== 'pending' && (
                    <>
                      <CircleMarker 
                         center={[activeEmergency.responderLocation.lat, activeEmergency.responderLocation.lng]}
                         pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }}
                         radius={10}
                      >
                         <Popup>Response Unit</Popup>
                      </CircleMarker>
                      {activeEmergency.routeCoordinates ? (
                        <Polyline 
                          positions={activeEmergency.routeCoordinates.map(c => [c.lat, c.lng])} 
                          pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }}
                        />
                      ) : (
                        <Polyline 
                          positions={[[activeEmergency.responderLocation.lat, activeEmergency.responderLocation.lng], [activeEmergency.location.lat, activeEmergency.location.lng]]} 
                          pathOptions={{ color: '#2563eb', dashArray: '8, 8', weight: 4, opacity: 0.5 }}
                        />
                      )}
                    </>
                  )}
                </MapContainer>
             ) : activeEmergency.status === 'arrived' ? (
               <div className="w-full h-full flex flex-col items-center justify-center text-emerald-700 bg-emerald-50">
                 <CheckCircle className="w-16 h-16 mb-3 text-emerald-500" />
                 <p className="text-2xl font-extrabold">Team on Site</p>
                 <p className="text-sm font-semibold text-emerald-600 mt-1">The response team has reached the incident location.</p>
               </div>
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Loading Navigation Map...</div>
             )}
          </div>
          
          <div className="p-8">
             <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
               <div>
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Status</p>
                 <p className={`text-2xl font-black flex items-center gap-2 ${status === 'pending' ? 'text-amber-500' : activeEmergency.status === 'arrived' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                   {status === 'pending' ? <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" /> : <AlertCircle className="w-7 h-7" />} 
                   {status === 'pending' ? 'Standby...' : activeEmergency.status === 'arrived' ? 'Team on Site' : 'Team En Route'}
                 </p>
               </div>
               <div className="text-right">
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Priority Match</p>
                 <p className="text-xl font-black ml-auto py-1 px-4 bg-rose-100 text-rose-600 rounded-lg w-fit uppercase">
                    {activeEmergency.priority}
                 </p>
               </div>
            </div>

            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <p className="text-blue-900 text-sm font-bold uppercase tracking-wider mb-2">Location Details</p>
              <p className="text-blue-700 font-mono text-lg font-bold">
                Lat: {activeEmergency.location?.lat.toFixed(6)} | Lng: {activeEmergency.location?.lng.toFixed(6)}
              </p>
            </div>

            {isRequestAccepted(activeEmergency) && activeEmergency.status !== 'arrived' && (
              <div className="mt-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
                <p className="text-indigo-900 text-sm font-bold uppercase tracking-wider mb-1">🚑 Live Tracking</p>
                <p className="text-indigo-700 font-semibold">Response route is live and updates automatically for staff coordination.</p>
              </div>
            )}
            
            <button 
              onClick={() => {
                setStatus('idle');
                setDetails('');
                setSelectedLocation(null);
                setActiveEmergency(null);
                localStorage.removeItem(ACTIVE_EMERGENCY_STORAGE_KEY);
              }}
              className="mt-6 w-full py-4 rounded-2xl border-2 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold text-lg"
            >
              Cancel Incident Request
            </button>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}
