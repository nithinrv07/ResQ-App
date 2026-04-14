/**
 * Firebase Configuration and Initialization
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJvd_-7a5Y2JL9Sr84Sd05M54UU4EBqiU",
  authDomain: "crisislink-1b7e0.firebaseapp.com",
  projectId: "crisislink-1b7e0",
  storageBucket: "crisislink-1b7e0.firebasestorage.app",
  messagingSenderId: "527459182647",
  appId: "1:527459182647:web:253896386edfadbcda37b2",
  measurementId: "G-7G69HP6EZH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize core services immediately
const db = getFirestore(app);
const auth = getAuth(app);

// Defer non-critical services (analytics and messaging)
let analytics = null;
let messaging = null;

// Initialize analytics on first page interaction (deferred)
if (typeof window !== 'undefined' && !window.__analyticsInitialized) {
  const initAnalytics = () => {
    try {
      if (!analytics) {
        analytics = getAnalytics(app);
      }
    } catch (error) {
      console.log('Analytics initialization failed', error);
    }
    document.removeEventListener('click', initAnalytics);
  };
  document.addEventListener('click', initAnalytics);
  window.__analyticsInitialized = true;
}

// Initialize messaging (for push notifications)
try {
  messaging = getMessaging(app);
} catch (error) {
  console.log('Messaging not available (may need service worker)', error);
}

// Export Firebase services
export { app, db, auth, analytics, messaging };

/**
 * Mock Database Layer with localStorage fallback
 * Uses localStorage for instant sync between tabs while Firebase initializes
 * Can be migrated to real Firestore later
 */

export const mockDb = {
  getEmergencies: () => JSON.parse(localStorage.getItem('emergencies') || '[]'),

  getEmergencyById: (id) => {
    if (!id) return null;
    return mockDb.getEmergencies().find((e) => e.id === id) || null;
  },

  _notifyChange: () => {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('emergencies:updated'));
  },
  
  clearAll: () => {
    localStorage.removeItem('emergencies');
    mockDb._notifyChange();
  },

  saveEmergency: (emergency) => {
    const arr = mockDb.getEmergencies();
    const id = Date.now().toString();
    
    // Spawn responder slightly away
    const responderStart = {
       lat: emergency.location.lat + (Math.random() - 0.5) * 0.03,
       lng: emergency.location.lng + (Math.random() - 0.5) * 0.03
    };

    const newEmergency = { 
      ...emergency, 
      id, 
      timestamp: new Date().toISOString(),
      responderLocation: responderStart,
      status: 'pending'
    };
    
    arr.push(newEmergency);
    localStorage.setItem('emergencies', JSON.stringify(arr));
    
    mockDb._notifyChange();
    return newEmergency;
  },

  dispatchUnit: (id) => {
    let arr = mockDb.getEmergencies();
    const idx = arr.findIndex(e => e.id === id);
    if (idx !== -1) {
       arr[idx].status = 'assigned';
       localStorage.setItem('emergencies', JSON.stringify(arr));
       mockDb._notifyChange();
       mockDb._fetchRouteAndMove(id, arr[idx].responderLocation, arr[idx].location);
    }
  },

  _fetchRouteAndMove: async (id, current, target) => {
     let routeCoords = [];
     try {
       const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${current.lng},${current.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`);
       const data = await res.json();
       if (data.routes && data.routes[0]) {
           // OSRM returns [lon, lat], we need [lat, lon]
           routeCoords = data.routes[0].geometry.coordinates.map(coord => ({ lat: coord[1], lng: coord[0] }));
       }
     } catch (err) {
       console.error('Routing failed', err);
     }
     
     if (routeCoords.length < 2) {
       routeCoords = [current, target]; // fallback to straight line
     }

     let arr = mockDb.getEmergencies();
     let idx = arr.findIndex(e => e.id === id);
     if (idx !== -1) {
       arr[idx].routeCoordinates = routeCoords;
       localStorage.setItem('emergencies', JSON.stringify(arr));
       mockDb._notifyChange();
     }

     let currentStep = 0;
     let curLat = current.lat;
     let curLng = current.lng;
     
     const interval = setInterval(() => {
        const currentArr = mockDb.getEmergencies();
        const currentIdx = currentArr.findIndex(e => e.id === id);
        if (currentIdx === -1 || currentArr[currentIdx].status === 'resolved') {
           clearInterval(interval);
           return;
        }
        
        if (currentStep < routeCoords.length - 1) {
           const nextPoint = routeCoords[currentStep + 1];
           const dist = Math.hypot(nextPoint.lat - curLat, nextPoint.lng - curLng);
           
           if (dist < 0.0005) {
              currentStep++;
           } else {
              // Move towards next road point
              curLat += (nextPoint.lat - curLat) * 0.3;
              curLng += (nextPoint.lng - curLng) * 0.3;
           }
        } else {
            // At destination or route finished
          currentArr[currentIdx].status = 'arrived';
          clearInterval(interval);
          
          // Auto-remove from active queue roughly 4 seconds after arrival
          setTimeout(() => {
              const resolveArr = JSON.parse(localStorage.getItem('emergencies') || '[]');
              const resolveIdx = resolveArr.findIndex(e => e.id === id);
              if (resolveIdx !== -1) {
                  resolveArr[resolveIdx].status = 'resolved';
                  localStorage.setItem('emergencies', JSON.stringify(resolveArr));
                  mockDb._notifyChange();
              }
          }, 4000); // Wait 4s so user can see "Arrived On Scene!" then clear.
        }
        
        currentArr[currentIdx].responderLocation = { lat: curLat, lng: curLng };
        localStorage.setItem('emergencies', JSON.stringify(currentArr));
            mockDb._notifyChange();
     }, 1000); // 1 tick per second
  },

  updateEmergencyStatus: (id, status) => {
    let arr = mockDb.getEmergencies();
    arr = arr.map(e => e.id === id ? { ...e, status } : e);
    localStorage.setItem('emergencies', JSON.stringify(arr));
    mockDb._notifyChange();
  },

  listenEmergencies: (callback) => {
    // Initial fetch
    callback(mockDb.getEmergencies());
    
    // Listen for cross-tab or same-tab storage changes
    const listener = () => callback(mockDb.getEmergencies());
    window.addEventListener('storage', listener);
    window.addEventListener('emergencies:updated', listener);
    
    return () => {
      window.removeEventListener('storage', listener);
      window.removeEventListener('emergencies:updated', listener);
    }; // unsubscribe
  },

  listenEmergencyById: (id, callback) => {
    const emit = () => callback(mockDb.getEmergencyById(id));

    emit();

    window.addEventListener('storage', emit);
    window.addEventListener('emergencies:updated', emit);

    return () => {
      window.removeEventListener('storage', emit);
      window.removeEventListener('emergencies:updated', emit);
    };
  },

  // Chat Methods
  getMessages: (senderId, recipientId) => {
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    return messages.filter(m => 
      (m.senderId === senderId && m.recipientId === recipientId) ||
      (m.senderId === recipientId && m.recipientId === senderId)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },

  sendMessage: (senderId, senderName, recipientId, recipientName, text) => {
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const newMessage = {
      id: Date.now().toString(),
      senderId,
      senderName,
      recipientId,
      recipientName,
      text,
      timestamp: Date.now(),
      read: false
    };
    messages.push(newMessage);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    mockDb._notifyChat();
    return newMessage;
  },

  listenMessages: (senderId, recipientId, callback) => {
    const emit = () => callback(mockDb.getMessages(senderId, recipientId));
    emit();

    const listener = () => emit();
    window.addEventListener('storage', listener);
    window.addEventListener('chat:updated', listener);

    return () => {
      window.removeEventListener('storage', listener);
      window.removeEventListener('chat:updated', listener);
    };
  },

  getConversations: (userId) => {
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const conversationsMap = new Map();

    messages.forEach(msg => {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const otherUserName = msg.senderId === userId ? msg.recipientName : msg.senderName;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: msg.text,
          lastTimestamp: msg.timestamp,
          unread: 0
        });
      }
      
      const conv = conversationsMap.get(otherUserId);
      if (msg.recipientId === userId && !msg.read) {
        conv.unread += 1;
      }
      if (msg.timestamp > conv.lastTimestamp) {
        conv.lastMessage = msg.text;
        conv.lastTimestamp = msg.timestamp;
      }
    });

    return Array.from(conversationsMap.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  },

  _notifyChat: () => {
    window.dispatchEvent(new Event('chat:updated'));
  }
};

