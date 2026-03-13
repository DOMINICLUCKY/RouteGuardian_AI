import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- INITIAL MOCK DATA ---
const shipmentData = [
  { name: 'Mon', shipments: 120 }, { name: 'Tue', shipments: 150 }, { name: 'Wed', shipments: 140 },
  { name: 'Thu', shipments: 170 }, { name: 'Fri', shipments: 160 }, { name: 'Sat', shipments: 110 }, { name: 'Sun', shipments: 90 },
];
const delayData = [
  { name: 'Weather Anomalies', value: 45, color: '#3b82f6' }, // blue
  { name: 'Traffic Congestion', value: 30, color: '#f59e0b' }, // amber
  { name: 'Port Delays', value: 15, color: '#8b5cf6' }, // purple
  { name: 'Mechanical', value: 10, color: '#ef4444' }, // red
];

const getDriverProfile = (id) => {
  const database = {
    'TRK-96466': { name: 'Marcus Johnson', exp: '8 Years', rating: 4.8, total: 1240, stats: { onTime: 92, late: 5, fast: 3 } },
    'TRK-90333': { name: 'Sarah Connor', exp: '3 Years', rating: 4.2, total: 450, stats: { onTime: 82, late: 14, fast: 4 } },
    'TRK-28711': { name: 'David Chen', exp: '12 Years', rating: 4.9, total: 3100, stats: { onTime: 96, late: 2, fast: 2 } },
    'TRK-80504': { name: 'Elena Rodriguez', exp: '1 Year', rating: 3.9, total: 120, stats: { onTime: 78, late: 20, fast: 2 } },
  };
  return database[id] || { name: 'Alex Mercer', exp: '5 Years', rating: 4.7, total: 890, stats: { onTime: 90, late: 7, fast: 3 } };
};

// ----------------------------------------------------------------------
// 1. ENTERPRISE SPLIT-SCREEN AUTHENTICATION
// ----------------------------------------------------------------------
const AuthScreen = ({ onGoogleLogin, onEmailAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && userType === 'manager' && accessCode !== 'ADMIN123') {
      setError('Invalid Enterprise Access Code. Contact your system administrator.');
      return;
    }

    setLoading(true);
    try {
      await onEmailAuth(isLogin, email, password, name, userType);
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use': setError('This email is already registered. Please sign in instead.'); break;
        case 'auth/invalid-email': setError('Please enter a valid email address.'); break;
        case 'auth/weak-password': setError('Your password must be at least 6 characters long.'); break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found': setError('Incorrect email or password. Please try again.'); break;
        case 'auth/operation-not-allowed': setError('Email sign-in is disabled. Please enable it in Firebase.'); break;
        default: setError('An unexpected error occurred. Please try again.'); console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] flex font-sans text-slate-200">
      <div className="hidden lg:flex flex-1 relative bg-[#0a0f1c] overflow-hidden flex-col justify-between p-16 border-r border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeOpacity="0.3"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /><circle cx="20%" cy="30%" r="200" fill="#6366f1" filter="blur(100px)" opacity="0.15"/><circle cx="80%" cy="70%" r="300" fill="#34d399" filter="blur(120px)" opacity="0.1"/></svg>
        </div>
        <div className="z-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-5xl font-black text-white mb-6 tracking-tight leading-tight">Next-Generation<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Logistics Intelligence</span></h1>
          <p className="text-lg text-slate-400 max-w-md font-medium">Predict disruptions, optimize routes, and manage your global supply chain with real-time AI intervention.</p>
        </div>
        <div className="z-10 text-slate-500 text-sm font-medium">© 2026 RouteGuardian AI. All rights reserved.</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#050810]">
        <div className="w-full max-w-md">
          <div className="flex bg-[#0a0f1c] border border-slate-800 rounded-xl p-1 mb-8 shadow-inner">
            <button type="button" onClick={() => setUserType('client')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${userType === 'client' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Client Portal</button>
            <button type="button" onClick={() => setUserType('manager')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${userType === 'manager' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Manager Access</button>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="text-slate-400 mb-8">{isLogin ? `Sign in to access your ${userType} dashboard.` : `Register as a ${userType} to continue.`}</p>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John Doe" />
              </div>
            )}
            
            {!isLogin && userType === 'manager' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Enterprise Access Code</label>
                <input type="password" required value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full bg-[#0a0f1c] border border-amber-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Enter provided admin code" />
              </div>
            )}

            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="name@company.com" /></div>
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••" /></div>
            
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 mt-2">
              {loading ? 'Processing...' : (isLogin ? `Sign In as ${userType}` : 'Create Account')}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-8"><div className="absolute border-t border-slate-800 w-full"></div><span className="bg-[#050810] px-4 text-xs text-slate-500 font-bold uppercase tracking-widest relative">Or continue with</span></div>

          <button type="button" onClick={() => onGoogleLogin(userType)} className="w-full flex items-center justify-center gap-3 bg-[#0a0f1c] border border-slate-800 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all mb-8">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Google Authentication
          </button>

          <p className="text-center text-slate-400 text-sm">{isLogin ? "Don't have an account? " : "Already have an account? "}<button type="button" onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">{isLogin ? 'Sign up' : 'Sign in'}</button></p>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 1.5 USER PROFILE MODAL
// ----------------------------------------------------------------------
const ProfileModal = ({ user, onClose, onLogout }) => {
  const [newName, setNewName] = useState(user.displayName || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white border-2 border-indigo-400/30 shadow-lg">{newName ? newName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}</div>
          <div><p className="text-sm text-slate-400">Account Email</p><p className="text-white font-medium">{user.email}</p></div>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4 mb-8">
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Display Name</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" /></div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-md">{loading ? 'Saving...' : 'Update Profile'}</button>
          {success && <p className="text-emerald-400 text-xs text-center font-medium mt-2">Profile updated successfully!</p>}
        </form>
        <div className="border-t border-slate-700 pt-6"><button onClick={onLogout} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold py-3 rounded-xl transition-all">Sign Out Securely</button></div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. CLIENT DASHBOARD
// ----------------------------------------------------------------------
const ClientDashboard = ({ user, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [activeOrder, setActiveOrder] = useState({ id: 'TRK-88492', origin: 'NYC', destination: 'LAX', status: 'In Transit', progress: 60, eta: 'Tomorrow at 2:00 PM' });
  const [orderHistory, setOrderHistory] = useState([
    { id: 'TRK-22941', route: 'MIA -> CHI', date: 'Oct 12, 2023', status: 'Delivered', details: 'Delivered to front desk. Signed by J. Smith.' },
    { id: 'TRK-10488', route: 'SEA -> BOS', date: 'Oct 05, 2023', status: 'Delivered', details: 'Package left on front porch.' },
  ]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const simulateProgress = () => {
    setActiveOrder(prev => {
      let newProgress = prev.progress + 20;
      let newStatus = prev.status;
      let newEta = prev.eta;
      if (newProgress >= 100) { newProgress = 100; newStatus = 'Delivered'; newEta = 'Arrived'; } 
      else if (newProgress > 80) { newStatus = 'Out for Delivery'; newEta = 'Today at 4:00 PM'; } 
      else if (newProgress > 30) { newStatus = 'In Transit'; } 
      else { newStatus = 'At Origin'; }
      return { ...prev, progress: newProgress, status: newStatus, eta: newEta };
    });
  };

  const toggleDetails = (orderId) => setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  const getStatusColor = (status) => {
    if (status === 'Delivered') return 'text-emerald-400';
    if (status === 'In Transit' || status === 'Out for Delivery') return 'text-indigo-400';
    return 'text-slate-400';
  };
  const getProgressBarColor = (status) => status === 'Delivered' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.5)]';

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 p-8 font-sans">
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onLogout={onLogout} />}
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div><h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {user.displayName || 'Client'}</h1><p className="text-slate-400 mt-1 text-sm">Here is the status of your recent shipments.</p></div>
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 bg-[#0a0f1c] hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl transition-all shadow-lg">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">{user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}</div>
             <span className="font-medium text-sm text-slate-300">Profile</span>
          </button>
        </div>

        <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-8 mb-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Track Active Order: #{activeOrder.id}</h2>
            <button onClick={simulateProgress} disabled={activeOrder.status === 'Delivered'} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${activeOrder.status === 'Delivered' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30'}`}>
              {activeOrder.status === 'Delivered' ? 'Order Complete' : 'Simulate Update'}
            </button>
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-400 mb-2"><span className={getStatusColor(activeOrder.status === 'At Origin' || activeOrder.progress > 0 ? 'In Transit' : '')}>Origin ({activeOrder.origin})</span><span className={getStatusColor(activeOrder.status)}>{activeOrder.status}</span><span className={getStatusColor(activeOrder.status === 'Delivered' ? 'Delivered' : '')}>Destination ({activeOrder.destination})</span></div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-4 relative overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ease-in-out ${getProgressBarColor(activeOrder.status)}`} style={{ width: `${activeOrder.progress}%` }}></div></div>
          <p className="text-xs text-slate-500">Estimated Arrival: {activeOrder.eta}</p>
        </div>

        <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">Order History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-400 text-sm border-b border-slate-800"><tr><th className="pb-3 font-medium">Order ID</th><th className="pb-3 font-medium">Route</th><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium text-right">Action</th></tr></thead>
              <tbody className="text-sm">
                {orderHistory.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 text-indigo-400 text-xs font-mono">{order.id}</td><td className="py-4 text-slate-300">{order.route}</td><td className="py-4 text-slate-300">{order.date}</td>
                      <td className="py-4"><span className="bg-emerald-950/40 text-emerald-400 px-3 py-1 rounded-full text-[10px] border border-emerald-900">{order.status}</span></td>
                      <td className="py-4 text-right"><button onClick={() => toggleDetails(order.id)} className="text-slate-400 hover:text-indigo-400 text-xs font-medium transition-colors px-3 py-1 border border-transparent hover:border-indigo-500/30 rounded">{expandedOrderId === order.id ? 'Hide' : 'View'}</button></td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="bg-slate-800/20"><td colSpan="5" className="p-4 text-xs text-slate-400 border-b border-slate-800/50"><div className="flex gap-2 items-center"><svg className="w-4 h-4 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p><span className="font-medium text-slate-300">Delivery Notes:</span> {order.details}</p></div></td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. MANAGER DASHBOARD 
// ----------------------------------------------------------------------
const ManagerDashboard = ({ user, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [interventionModal, setInterventionModal] = useState(null); 
  const [driverModal, setDriverModal] = useState(null); 
  const [shipments, setShipments] = useState([]);
  const [resolvedIds, setResolvedIds] = useState([]); 
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([{ role: 'ai', text: "RouteGuardian AI online. Monitoring network for routing risks. Awaiting command..." }]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const messagesEndRef = useRef(null);

  // --- LIVE WEATHER STATE ---
  const [originCity, setOriginCity] = useState('New York');
  const [destCity, setDestCity] = useState('Los Angeles');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherResult, setWeatherResult] = useState(null);
  
  const WEATHER_API_KEY = '5ca0f5b6cf69fc095bd5611fd88aa5ff'; 

  // 🔥 NEW: LIVE TICKER STATE FOR ANALYTICS 🔥
  const [liveEfficiency, setLiveEfficiency] = useState(87.4);
  const [liveSavings, setLiveSavings] = useState(12450);
  const [liveChartData, setLiveChartData] = useState([
    { time: '12:00', efficiency: 82 }, { time: '12:05', efficiency: 84 },
    { time: '12:10', efficiency: 81 }, { time: '12:15', efficiency: 85 },
    { time: '12:20', efficiency: 87.4 }
  ]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog]);

  useEffect(() => {
    // This connects to your Python backend if it's running
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/shipments/at-risk');
        if (res.ok) setShipments(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 THE LIVE "HEARTBEAT" SIMULATOR FOR THE PRESENTATION 🔥
  useEffect(() => {
    const heartbeat = setInterval(() => {
      // 1. Fluctuate Efficiency slightly (between 85 and 92)
      setLiveEfficiency(prev => {
        let next = prev + (Math.random() * 2 - 1);
        if (next > 92) next = 92;
        if (next < 85) next = 85;
        return Number(next.toFixed(1));
      });

      // 2. Increment Cost Savings
      setLiveSavings(prev => prev + Math.floor(Math.random() * 15));

      // 3. Move the Graph (push new point, remove oldest point)
      setLiveChartData(prev => {
        const newData = [...prev];
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const lastEff = newData[newData.length - 1].efficiency;
        let nextEff = lastEff + (Math.random() * 4 - 2);
        if(nextEff > 98) nextEff = 98;
        if(nextEff < 75) nextEff = 75;
        
        newData.push({ time: timeStr, efficiency: Math.round(nextEff) });
        if (newData.length > 7) newData.shift(); 
        return newData;
      });
    }, 3000); // Ticks every 3 seconds!

    return () => clearInterval(heartbeat);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    const lowerMsg = userMessage.toLowerCase();
    
    setChatLog(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput(""); 

    let aiReply = "";
    let isAsyncProcessing = false; 

    const cityMap = {
      "mia": "Miami", "miami": "Miami",
      "chi": "Chicago", "chicago": "Chicago",
      "nyc": "New York", "new york": "New York", "ny": "New York",
      "lax": "Los Angeles", "los angeles": "Los Angeles", "la": "Los Angeles",
      "dal": "Dallas", "dallas": "Dallas",
      "den": "Denver", "denver": "Denver",
      "sea": "Seattle", "seattle": "Seattle",
      "sfo": "San Francisco", "san francisco": "San Francisco",
      "atl": "Atlanta", "atlanta": "Atlanta",
      "bos": "Boston", "boston": "Boston",
      "hou": "Houston", "houston": "Houston",
      "phx": "Phoenix", "phoenix": "Phoenix"
    };

    if ((lowerMsg.includes("what is") || lowerMsg.includes("how does") || lowerMsg.includes("explain")) && (lowerMsg.includes("app") || lowerMsg.includes("website") || lowerMsg.includes("routeguardian") || lowerMsg.includes("system"))) {
      aiReply = "I am the RouteGuardian AI Core. My primary function is predictive logistics. I continuously monitor your shipment network against real-time weather satellite data, traffic patterns, and driver performance history to identify risks before they become delays. You can use the 'AI Tools' tab for manual simulations, or rely on my proactive alerts in the dashboard.";
    }
    else if (lowerMsg.includes("weather") || lowerMsg.includes("storm") || lowerMsg.includes("rain") || lowerMsg.includes("temperature") || lowerMsg.includes("route") || lowerMsg.includes("forecast")) {
      
      let detectedCityKey = Object.keys(cityMap).find(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        return regex.test(lowerMsg);
      });
      
      if (detectedCityKey) {
        isAsyncProcessing = true; 
        const cityQuery = cityMap[detectedCityKey];
        
        setChatLog(prev => [...prev, { role: 'ai', text: `🛰️ Connecting to live satellite feed for ${cityQuery}...` }]);

        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityQuery}&units=metric&appid=${WEATHER_API_KEY}`);
          if (!res.ok) throw new Error("City not found.");
          const data = await res.json();

          const temp = Math.round(data.main.temp);
          const condition = data.weather[0].description;
          const weatherId = data.weather[0].id; 

          aiReply = `LIVE REPORT for ${cityQuery.toUpperCase()}: Current temperature is ${temp}°C with ${condition}. `;

          if (weatherId < 800) {
             aiReply += "⚠️ CRITICAL: Adverse weather conditions detected. This poses a high risk for ground freight delays. Recommend reviewing active shipments routed through this node immediately for potential intervention.";
          } else if (weatherId === 800) {
             aiReply += "✅ CONDITIONS CLEAR: Optimal visibility and road conditions. No weather-related impedance projected for standard routing.";
          } else {
             aiReply += "ℹ️ STATUS: Conditions are stable, but minor cloud cover/atmosphere issues exist. Continue monitoring standard routes.";
          }
          
          setChatLog(prev => prev.slice(0, -1)); 
          setChatLog(prev => [...prev, { role: 'ai', text: aiReply }]);

        } catch (error) {
           setChatLog(prev => prev.slice(0, -1));
           setChatLog(prev => [...prev, { role: 'ai', text: `❌ Error: Unable to establish satellite uplink for node "${cityQuery}". Please verify location code or try again later.` }]);
        }
      } else {
        aiReply = "To provide a real-time weather risk assessment, please specify a valid route code or city name (e.g., 'MIA', 'Chicago', 'LAX').";
      }
    }
    else if (lowerMsg === "hi" || lowerMsg === "hello" || lowerMsg === "hey" || lowerMsg.includes("good morning")) {
      aiReply = `RouteGuardian AI online. Live network efficiency is currently at ${liveEfficiency}%. I am standing by for route analysis commands.`;
    }
    else if (!isAsyncProcessing) {
      aiReply = "⚠️ OUT OF SCOPE: I am a specialized Tier-1 Logistics AI tailored for supply chain optimization. I cannot process requests unrelated to routing, weather analysis, or shipment tracking. Please refine your command parameters.";
    }

    if (!isAsyncProcessing && aiReply) {
      setTimeout(() => {
        setChatLog(prev => [...prev, { role: 'ai', text: aiReply }]);
      }, 700);
    }
  };

  const executeReroute = async () => {
    const shipment = interventionModal;
    setInterventionModal(null); 

    const prompt = `System Alert: Executing AI Reroute for ${shipment.id} (${shipment.route}). Bypassing weather anomalies via Air Freight. Update routing logs.`;
    const newLog = [...chatLog, { role: 'user', text: prompt }];
    setChatLog(newLog);
    setResolvedIds(prev => [...prev, shipment.id]);

    setTimeout(() => {
        setChatLog([...newLog, { role: 'ai', text: `✅ Reroute successful for ${shipment.id}. Driver has been notified and ETA updated to minimize SLA failure.` }]);
    }, 1000);
  };

  const handleLiveWeatherSimulation = async () => {
    setWeatherLoading(true);
    setWeatherResult(null);

    try {
      const originRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${originCity}&units=metric&appid=${WEATHER_API_KEY}`);
      if (!originRes.ok) throw new Error(`Could not find ${originCity}`);
      const originData = await originRes.json();

      const destRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${destCity}&units=metric&appid=${WEATHER_API_KEY}`);
      if (!destRes.ok) throw new Error(`Could not find ${destCity}`);
      const destData = await destRes.json();

      const isBadWeather = (weather) => weather.weather[0].id < 800; 

      const originBad = isBadWeather(originData);
      const destBad = isBadWeather(destData);
      
      let recommendation = "Route Clear. Optimal conditions for standard ground freight.";
      let riskScore = "LOW";
      let statusColor = "text-emerald-400";

      if (originBad && destBad) {
        recommendation = "Severe weather across entire route. Halt shipment or switch to Air Freight immediately.";
        riskScore = "CRITICAL";
        statusColor = "text-rose-500";
      } else if (originBad || destBad) {
        recommendation = "Local weather disturbances. Suggest adjusting departure time by +12 hours.";
        riskScore = "MEDIUM";
        statusColor = "text-amber-500";
      }

      setWeatherResult({
        origin: { temp: originData.main.temp, desc: originData.weather[0].description },
        dest: { temp: destData.main.temp, desc: destData.weather[0].description },
        riskScore,
        recommendation,
        statusColor
      });

    } catch (err) {
      alert(err.message + " (Wait 10 mins if you just created the API key!)");
    } finally {
      setWeatherLoading(false);
    }
  };

  // Map resolved states
  const displayShipments = shipments.map(s => resolvedIds.includes(s.id) ? { ...s, riskLevel: 'Resolved' } : s);

  // Define the table data once
  const tableData = displayShipments.length > 0 ? displayShipments : [
    { id: 'TRK-96466', route: 'DAL -> DEN', eta: '17h', riskLevel: 'Critical' },
    { id: 'TRK-90333', route: 'NYC -> LAX', eta: '45h', riskLevel: 'Medium' },
    { id: 'TRK-28711', route: 'SEA -> BOS', eta: '15h', riskLevel: 'Critical' },
    { id: 'TRK-80504', route: 'MIA -> CHI', eta: '6h', riskLevel: 'Critical' }
  ];

  // Make the top card dynamically equal to the number of rows in the table
  const activeShipmentsCount = tableData.length;

  const CustomTooltipArea = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-white text-xs font-bold mb-1">{label}</p>
          <p className="text-indigo-400 text-sm font-bold">{payload[0].value} Shipments</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 flex font-sans overflow-hidden relative">
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onLogout={onLogout} />}
      
      {/* AI INTERVENTION MODAL */}
      {interventionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-indigo-400 mb-6">AI Intervention Panel</h2>
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-400 mb-1">Shipment ID: <span className="text-indigo-400 font-mono text-sm">{interventionModal.id}</span></p>
              <p className="text-xs text-slate-400">Route: <span className="text-slate-200">{interventionModal.route}</span></p>
            </div>
            <div className="bg-amber-950/20 border border-amber-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><h3 className="text-amber-500 font-bold text-sm">AI Analysis</h3></div>
              <p className="text-amber-200/70 text-xs leading-relaxed">Severe weather detected on route. 85% probability of missing SLA.</p>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-700/50 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><h3 className="text-emerald-500 font-bold text-sm">AI Recommendation</h3></div>
              <p className="text-emerald-200/70 text-xs leading-relaxed">Reroute via Air Freight. Estimated delay avoided: 14 hours.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setInterventionModal(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">Cancel</button>
              <button onClick={executeReroute} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 text-sm">Execute AI Reroute</button>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER INTELLIGENCE MODAL */}
      {driverModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setDriverModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>Driver Intelligence Profile</h2>
            <div className="flex items-center gap-4 mb-6 bg-[#0f172a] p-4 rounded-lg border border-slate-800">
              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md">{driverModal.name.charAt(0)}</div>
              <div>
                <h3 className="text-white font-bold">{driverModal.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1"><span className="flex items-center gap-1"><svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {driverModal.rating}/5.0</span><span>•</span><span>{driverModal.exp} Exp</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <div><div className="flex justify-between text-xs mb-1 font-medium"><span className="text-emerald-400">On-Time Deliveries</span><span className="text-white">{driverModal.stats.onTime}%</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{width: `${driverModal.stats.onTime}%`}}></div></div></div>
              <div><div className="flex justify-between text-xs mb-1 font-medium"><span className="text-rose-400">Late / Delayed</span><span className="text-white">{driverModal.stats.late}%</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-rose-500 h-full" style={{width: `${driverModal.stats.late}%`}}></div></div></div>
              <div><div className="flex justify-between text-xs mb-1 font-medium"><span className="text-indigo-400">Early / Fast</span><span className="text-white">{driverModal.stats.fast}%</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full" style={{width: `${driverModal.stats.fast}%`}}></div></div></div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700"><p className="text-xs text-slate-500 text-center">Total lifetime routes optimized: <span className="text-slate-300 font-bold">{driverModal.total}</span></p></div>
          </div>
        </div>
      )}

      <aside className="w-[240px] bg-[#1e293b] border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 p-6 mb-2">
            <div><h1 className="text-lg font-bold text-indigo-400 leading-tight">RouteGuardian</h1><p className="text-[10px] text-slate-500">AI Engine</p></div>
          </div>
          <nav className="px-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'analytics', label: 'Analytics', icon: 'M7 21V7m0 0l-3 3m3-3l3 3m5 14V3m0 0l-3 3m3-3l3 3' },
              { id: 'alerts', label: 'Alerts', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
              { id: 'tools', label: 'AI Tools', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeTab === tab.id ? 'bg-[#6366f1] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} /></svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 flex justify-between items-center text-xs text-slate-600 border-t border-slate-800"><span>v1.0 BETA</span></div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-[72px] bg-[#1e293b] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div><h2 className="text-xl font-bold text-white leading-tight">RouteGuardian AI Engine</h2><p className="text-xs text-slate-400">Real-time Shipment Risk Monitoring</p></div>
          <div className="flex items-center gap-6">
            <div className="bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-full flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-xs font-bold text-white uppercase tracking-wider">LIVE DATA</span></div>
            <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">{user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'M')}</div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* ================= DASHBOARD TAB ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 flex flex-col shadow-lg relative min-h-[160px] overflow-hidden">
                  <div className="flex justify-between items-start mb-2 z-10"><p className="text-sm font-medium text-slate-300">Total Active Shipments</p><svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                  <h3 className="text-3xl font-bold text-white z-10">{activeShipmentsCount}</h3><p className="text-xs text-slate-400 mb-2 z-10">Active in network</p>
                  <div className="absolute bottom-0 left-0 w-full h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={shipmentData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs><linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="name" hide />
                        <Tooltip content={<CustomTooltipArea />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }}/>
                        <Area type="monotone" dataKey="shipments" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorShipments)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute bottom-2 left-0 w-full flex justify-between px-4 text-[9px] text-slate-500 z-10"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
                </div>

                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 flex flex-col shadow-lg">
                  <div className="flex justify-between items-start mb-2"><p className="text-sm font-medium text-slate-300">Live Network Efficiency</p><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                  <h3 className="text-3xl font-bold text-emerald-400 mb-6">{liveEfficiency}%</h3>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mb-3"><div className="bg-emerald-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-500" style={{width: `${liveEfficiency}%`}}></div></div>
                  <p className="text-[10px] text-slate-400">Updating in real-time...</p>
                </div>

                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 flex flex-col shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                  <div className="flex justify-between items-start mb-2 pl-2"><p className="text-sm font-medium text-slate-300">High-Risk (72h)</p><svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                  <h3 className="text-3xl font-bold text-rose-500 mb-1 pl-2">5</h3><p className="text-xs text-slate-400 mb-4 pl-2">Requiring intervention</p>
                  <div className="bg-rose-950/40 border border-rose-900/50 rounded-md p-2.5 flex items-center gap-2 ml-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="text-[10px] text-slate-300">Immediate action needed</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* DELAYED SHIPMENTS TABLE */}
                <div className="xl:col-span-2 bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg">
                  <div className="p-5 border-b border-slate-700"><h3 className="text-base font-bold text-white">Delayed Shipments Monitor</h3></div>
                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-left">
                      <thead className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-700">
                        <tr>
                          <th className="px-5 py-3 font-semibold">ID</th>
                          <th className="px-5 py-3 font-semibold">Route</th>
                          <th className="px-5 py-3 font-semibold">ETA</th>
                          <th className="px-5 py-3 font-semibold">Risk Level</th>
                          <th className="px-5 py-3 font-semibold text-center">Driver</th>
                          <th className="px-5 py-3 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {tableData.map((s, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-5 py-4 text-indigo-400 font-mono">{s.id}</td>
                            <td className="px-5 py-4 text-slate-300 font-medium">{s.route}</td>
                            <td className="px-5 py-4 text-slate-300">{s.eta}</td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.riskLevel === 'Critical' ? 'bg-rose-950/40 text-rose-400 border-rose-800' : s.riskLevel === 'Resolved' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' : 'bg-amber-950/40 text-amber-400 border-amber-800'}`}>{s.riskLevel}</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                               <button onClick={() => setDriverModal(getDriverProfile(s.id))} className="text-slate-400 hover:text-indigo-400 transition-colors p-1.5 rounded-md hover:bg-slate-800" title="View Driver">
                                 <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                               </button>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {s.riskLevel === 'Resolved' ? (<span className="text-emerald-500 text-[10px] font-bold">Optimized</span>) : (
                                <button onClick={() => setInterventionModal(s)} className="bg-[#6366f1] hover:bg-indigo-500 text-white text-[10px] font-bold px-4 py-1.5 rounded transition shadow-md">Intervene</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI CHATBOX */}
                <div className="xl:col-span-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg flex flex-col h-[500px]">
                  <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <h3 className="text-sm font-bold text-indigo-400">AI Chat</h3>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#1e293b] scrollbar-thin scrollbar-thumb-slate-600">
                    {chatLog.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-3 rounded-lg text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-[#4f46e5] text-white' : 'bg-slate-700 text-slate-200'}`}>{m.text}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700 flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask AI..." className="flex-1 bg-slate-800 border border-slate-600 text-sm text-white rounded px-3 py-2.5 focus:outline-none focus:border-indigo-500" />
                    <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3.5 rounded flex items-center justify-center border border-slate-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================= ANALYTICS TAB (LIVE SIMULATION) ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5 flex items-start gap-4 shadow-lg shadow-indigo-900/10">
                <div className="bg-indigo-600/20 p-3 rounded-lg border border-indigo-500/30">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-indigo-400 font-bold text-sm tracking-wide uppercase mb-1">AI Predictive Insight</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Based on current satellite weather patterns, predictive models indicate a <span className="text-rose-400 font-bold">14% drop</span> in East Coast network efficiency over the next 48 hours. <span className="text-emerald-400 font-bold">System has proactively re-routed 24 vulnerable shipments</span>, saving an estimated $8,400 in late penalties.
                  </p>
                </div>
              </div>

              {/* 4 KPI CARDS WITH LIVE TICKERS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { l: 'Network Efficiency', v: `${liveEfficiency}%`, s: 'Updating live...', i: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', ic: 'text-indigo-400' },
                  { l: 'Avg. AI Processing', v: '0.4s', s: 'Per reroute calculation', i: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', ic: 'text-emerald-500' },
                  { l: 'Routes AI-Optimized', v: '1,242', s: 'Lifetime optimized', i: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', ic: 'text-indigo-400' },
                  { l: 'AI Cost Savings', v: `$${(liveSavings / 1000).toFixed(2)}K`, s: 'Calculated in real-time', i: 'M13 10V3L4 14h7v7l9-11h-7z', ic: 'text-amber-400' }
                ].map((s, i) => (
                  <div key={i} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2"><p className="text-xs font-medium text-slate-300">{s.l}</p><svg className={`w-4 h-4 ${s.ic}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.i} /></svg></div>
                    <h3 className="text-2xl font-bold text-white mb-2">{s.v}</h3><p className="text-[10px] text-slate-500">{s.s}</p>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* LIVE MOVING CHART */}
                <div className="xl:col-span-2 bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg h-[400px] flex flex-col">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    Live Network Efficiency Trend
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                  </h3>
                  <div className="flex-1 w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={liveChartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={true} horizontal={true} />
                        <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} domain={[70, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                        <Line type="monotone" dataKey="efficiency" stroke="#818cf8" strokeWidth={3} isAnimationActive={false} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#818cf8', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="xl:col-span-1 bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg h-[400px] flex flex-col">
                  <h3 className="text-sm font-bold text-white mb-2">AI Root Cause Analysis</h3>
                  <p className="text-[10px] text-slate-400 mb-4">Breakdown of network disruptions.</p>
                  <div className="flex-1 w-full h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={delayData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                          {delayData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <span className="block text-2xl font-black text-white">45%</span>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest">Weather</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {delayData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[10px] text-slate-300">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================= ALERTS TAB ================= */}
          {activeTab === 'alerts' && (
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg p-0 overflow-hidden">
              <div className="p-5 border-b border-slate-700 flex justify-between items-center"><h3 className="text-lg font-bold text-white">System Alerts Log</h3></div>
              <div className="p-6 space-y-4">
                {[
                  { level: 'CRITICAL', msg: 'SHIP-001 storm delay detected on NYC→LAX route', time: '2 min ago', color: 'border-l-rose-500 text-rose-500', bg: 'bg-[#1f1925]' },
                  { level: 'WARNING', msg: 'Traffic congestion on I-40', time: '5 min ago', color: 'border-l-amber-500 text-amber-500', bg: 'bg-[#221f20]' },
                  { level: 'INFO', msg: 'System performing optimally', time: '15 min ago', color: 'border-l-emerald-500 text-emerald-500', bg: 'bg-[#152324]' },
                ].map((a, i) => (
                  <div key={i} className={`${a.bg} border border-slate-800 border-l-4 ${a.color} p-4 rounded-md flex justify-between items-start`}>
                    <div><p className={`text-[10px] font-bold ${a.color.split(' ')[1]} mb-1`}>{a.level}</p><p className="text-sm text-slate-300">{a.msg}</p></div>
                    <span className="text-xs text-slate-500">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= AI TOOLS TAB ================= */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">AI Tools & Capabilities</h2>
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6"><svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg><h3 className="text-lg font-bold text-white">Predictive Weather Routing Engine</h3></div>
                <div className="space-y-4 mb-6">
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Origin City</label><input type="text" value={originCity} onChange={e => setOriginCity(e.target.value)} className="w-full bg-[#2a374a] border border-slate-600 rounded-md px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors" /></div>
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Destination City</label><input type="text" value={destCity} onChange={e => setDestCity(e.target.value)} className="w-full bg-[#2a374a] border border-slate-600 rounded-md px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors" /></div>
                </div>
                
                <button onClick={handleLiveWeatherSimulation} disabled={weatherLoading} className="w-full bg-[#8b5cf6] hover:bg-violet-500 text-white font-bold py-3 rounded-md transition flex justify-center items-center gap-2 text-sm shadow-md">
                  {weatherLoading ? 'Fetching Live Satellite Data...' : 'Run AI Simulation'}
                </button>

                {weatherResult && (
                  <div className="mt-6 pt-6 border-t border-slate-700 animate-in fade-in slide-in-from-top-4">
                    <h4 className="text-sm font-bold text-white mb-4">Live Analysis Results</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{originCity}</p>
                        <h5 className="text-2xl font-black text-white my-1">{Math.round(weatherResult.origin.temp)}°C</h5>
                        <p className="text-xs text-slate-400 capitalize">{weatherResult.origin.desc}</p>
                      </div>
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{destCity}</p>
                        <h5 className="text-2xl font-black text-white my-1">{Math.round(weatherResult.dest.temp)}°C</h5>
                        <p className="text-xs text-slate-400 capitalize">{weatherResult.dest.desc}</p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg bg-slate-800/50 border border-slate-700`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">AI Recommendation</p>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${weatherResult.statusColor.replace('text', 'border')} ${weatherResult.statusColor}`}>{weatherResult.riskScore} RISK</span>
                      </div>
                      <p className="text-sm text-white">{weatherResult.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. MAIN APP ROUTER
// ----------------------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setLoadingAuth(false); });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async (selectedRole) => { 
    try { 
      await signInWithPopup(auth, googleProvider); 
      localStorage.setItem('routeguardian_role', selectedRole);
    } catch (error) { console.error("Login Failed", error); } 
  };

  const handleEmailAuth = async (isLogin, email, password, name, selectedRole) => {
    if (isLogin) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
    }
    localStorage.setItem('routeguardian_role', selectedRole);
    if (!isLogin) window.location.reload(); 
  };

  const handleLogout = async () => { 
    try { 
      await signOut(auth); 
      localStorage.removeItem('routeguardian_role'); 
    } catch (error) { console.error("Logout Failed", error); } 
  };

  if (loadingAuth) return <div className="min-h-screen bg-[#050810] flex items-center justify-center text-slate-500 text-sm">Loading System...</div>;
  if (!user) return <AuthScreen onGoogleLogin={handleGoogleLogin} onEmailAuth={handleEmailAuth} />;

  const savedRole = localStorage.getItem('routeguardian_role');

  if (user.email === 'adarshmund07@gmail.com' || savedRole === 'manager') return <ManagerDashboard user={user} onLogout={handleLogout} />;
  return <ClientDashboard user={user} onLogout={handleLogout} />;
}