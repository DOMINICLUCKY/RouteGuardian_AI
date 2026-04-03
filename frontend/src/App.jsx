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
import { 
  Box, CheckCircle2, DollarSign, RefreshCw, MapPin, 
  FileText, CheckSquare, Phone, User, Map, X, Download 
} from 'lucide-react'; // NEW IMPORTS NEEDED FOR CLIENT DASHBOARD

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
// 0.5 LEGAL TERMS MODAL
// ----------------------------------------------------------------------
const TermsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1e293b] rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">Terms of Service & AI Policy</h2>
            <p className="text-xs text-slate-400 mt-1">Last Updated: March 2026</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6 text-sm text-slate-300 scrollbar-thin scrollbar-thumb-slate-700">
          <section>
            <h3 className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-xs">1. System Access & Roles</h3>
            <p className="leading-relaxed">RouteGuardian AI provides role-based access. <strong>Clients</strong> are granted read-only tracking. <strong>Managers</strong> are granted administrative control, including overriding active dispatches.</p>
          </section>
          <section>
            <h3 className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-xs">2. AI Liability & Predictive Routing</h3>
            <p className="leading-relaxed">Our AI achieves a 94% historical accuracy rate. However, <strong>RouteGuardian is not legally liable for SLA failures or fuel cost overruns</strong> resulting from executing an "AI Fix." Final dispatch authority remains with the Manager.</p>
          </section>
          <section>
            <h3 className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-xs">3. Data Telemetry & Privacy</h3>
            <p className="leading-relaxed">You consent to the continuous collection of anonymized fleet telemetry and geolocation data to train our neural networks. We comply with SOC-2 and GDPR enterprise standards.</p>
          </section>
        </div>

        <div className="p-6 border-t border-slate-800 bg-[#0a0f1c] rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg">I Understand & Agree</button>
        </div>
      </div>
    </div>
  );
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
  const [showTerms, setShowTerms] = useState(false);

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

          <p className="text-center text-[10px] text-slate-500 max-w-xs mx-auto mt-4">
            By continuing, you acknowledge that you have read and agree to our <button type="button" onClick={() => setShowTerms(true)} className="text-slate-300 hover:text-indigo-400 underline decoration-slate-600 underline-offset-2 transition-colors">Terms of Service & AI Privacy Policy</button>.
          </p>
        </div>
      </div>
      {/* RENDER MODAL */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
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
  const [showTerms, setShowTerms] = useState(false);

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
        <div className="border-t border-slate-700 pt-6 space-y-3">
          <button onClick={() => setShowTerms(true)} type="button" className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            View Enterprise Terms & Conditions
          </button>
          <button onClick={onLogout} type="button" className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold py-3 rounded-xl transition-all">Sign Out Securely</button>
        </div>

        {/* RENDER MODAL */}
        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 2. CLIENT DASHBOARD (UPGRADED WITH AGENT & INVOICE)
// ----------------------------------------------------------------------
const ClientDashboard = ({ user, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const completedShipments = [
    { id: 'TRK-22941', route: 'MIA -> CHI', date: 'Oct 12, 2023', amount: '$1,240', status: 'DELIVERED' },
    { id: 'TRK-10488', route: 'SEA -> BOS', date: 'Oct 05, 2023', amount: '$2,800', status: 'DELIVERED' }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const openInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 p-6 font-sans">
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onLogout={onLogout} />}
      
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Client Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Welcome back, {user?.displayName || user?.email || 'Client'}. Here is your network overview.</p>
        </div>
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] px-4 py-2 rounded-full border border-slate-700 transition-colors">
          <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">{user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'C')}</div>
          <span className="text-sm font-medium text-white">Account</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="bg-[#0f172a] p-3 rounded-lg"><Box className="text-indigo-400 w-6 h-6" /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Active Dispatches</p><p className="text-2xl font-bold text-white">1</p></div>
          </div>
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="bg-[#0f172a] p-3 rounded-lg"><CheckCircle2 className="text-emerald-400 w-6 h-6" /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">AI On-Time Rate</p><p className="text-2xl font-bold text-white">100%</p></div>
          </div>
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="bg-[#0f172a] p-3 rounded-lg"><DollarSign className="text-amber-400 w-6 h-6" /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Spend (YTD)</p><p className="text-2xl font-bold text-white">$14,250</p></div>
          </div>
        </div>

        {/* Live Tracking Box - UPGRADED WITH AGENT & NODES */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                Live Tracking: #TRK-88492
                <span className="text-[10px] bg-indigo-900/50 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30 uppercase tracking-wider">Standard Freight</span>
              </h2>
              <div className="flex items-center gap-2 mt-2 bg-emerald-900/20 px-3 py-1.5 rounded text-sm w-max border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-emerald-400">AI Status: Optimal Route. No weather anomalies detected.</span>
              </div>
            </div>
            <button onClick={handleRefresh} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Telemetry
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              <span>NYC (Origin)</span>
              <span className="text-indigo-400">In Transit</span>
              <span>LAX (Dest)</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[45%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            </div>
            <div className="flex justify-between text-sm mt-3">
              <div className="flex items-center gap-2">
                <MapPin className="text-indigo-400 w-4 h-4" />
                <span className="font-medium text-white">Current: Denver, CO (Node 4)</span>
              </div>
              <span className="font-medium text-white">Est. Arrival: Tomorrow at 2:00 PM</span>
            </div>
          </div>

          {/* NEW: Agent Profile & Checkpoints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
            
            {/* Delivery Agent Card */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-slate-800">
              <h3 className="text-xs text-slate-400 font-bold uppercase mb-3">Assigned Delivery Agent</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Marcus Johnson</p>
                    <p className="text-xs text-slate-400">License: CDL-A • Rating: 4.9/5</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-emerald-900/30 text-emerald-400 rounded hover:bg-emerald-900/50 transition-colors" title="Call Agent">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-indigo-900/30 text-indigo-400 rounded hover:bg-indigo-900/50 transition-colors" title="Update Drop-off Pin">
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Update Pin to beam exact dock coordinates to driver's GPS.
              </p>
            </div>

            {/* Live Checkpoints */}
            <div className="bg-[#0f172a] rounded-lg p-4 border border-slate-800">
              <h3 className="text-xs text-slate-400 font-bold uppercase mb-3">Recent Checkpoints</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-white">Arrived at Node 4: Denver, CO</span>
                  <span className="text-slate-500 text-xs ml-auto">10:45 AM</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-50">
                  <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                  <span className="text-slate-300">Departed Node 3: Omaha, NE</span>
                  <span className="text-slate-500 text-xs ml-auto">Yesterday</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-50">
                  <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                  <span className="text-slate-300">Departed Node 2: Chicago, IL</span>
                  <span className="text-slate-500 text-xs ml-auto">Oct 24</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Completed Shipments & Documents */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6">Completed Shipments & Documents</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Order ID</th>
                  <th className="pb-3 px-4 font-semibold">Route</th>
                  <th className="pb-3 px-4 font-semibold">Delivery Date</th>
                  <th className="pb-3 px-4 font-semibold">Billed Amount</th>
                  <th className="pb-3 px-4 font-semibold">Status</th>
                  <th className="pb-3 px-4 font-semibold text-right">Compliance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {completedShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-slate-800/50 hover:bg-[#0f172a]/50 transition-colors">
                    <td className="py-4 px-4 text-indigo-400 font-medium">{shipment.id}</td>
                    <td className="py-4 px-4 font-medium text-slate-300">{shipment.route}</td>
                    <td className="py-4 px-4 text-slate-400">{shipment.date}</td>
                    <td className="py-4 px-4 text-white font-medium">{shipment.amount}</td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 border border-emerald-900 bg-emerald-900/20 px-2 py-1 rounded">
                        {shipment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right flex justify-end gap-2">
                      <button onClick={() => openInvoice(shipment)} className="flex items-center gap-1 border border-slate-600 hover:border-slate-400 text-slate-300 px-3 py-1.5 rounded transition-colors text-xs">
                        <FileText className="w-3 h-3" /> Invoice
                      </button>
                      <button className="flex items-center gap-1 border border-slate-600 hover:border-slate-400 text-slate-300 px-3 py-1.5 rounded transition-colors text-xs">
                        <CheckSquare className="w-3 h-3" /> POD
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NEW: Invoice Digital Modal */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#0f172a] p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg"><FileText className="w-5 h-5 text-white" /></div>
                <div>
                  <h3 className="text-white font-bold text-lg">Official Invoice</h3>
                  <p className="text-slate-400 text-xs tracking-wider">REF: INV-{selectedOrder.id}</p>
                </div>
              </div>
              <button onClick={() => setShowInvoice(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body - The "Receipt" */}
            <div className="p-6">
              <div className="flex justify-between mb-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Billed To</p>
                  <p className="text-white text-sm font-medium">{user?.displayName || 'Enterprise Client Corp.'}</p>
                  <p className="text-slate-400 text-xs">123 Logistics Way<br/>New York, NY 10001</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Date</p>
                  <p className="text-white text-sm font-medium">{selectedOrder.date}</p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg border border-slate-800 p-4 mb-6">
                <div className="flex justify-between border-b border-slate-800 pb-3 mb-3 text-sm">
                  <span className="text-slate-400">Freight Route</span>
                  <span className="text-white font-medium">{selectedOrder.route}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3 mb-3 text-sm">
                  <span className="text-slate-400">Base Haul Rate</span>
                  <span className="text-white">{selectedOrder.amount}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3 mb-3 text-sm">
                  <span className="text-slate-400">AI Routing Fee</span>
                  <span className="text-white">$0.00 <span className="text-emerald-400 text-xs ml-1">(Waived)</span></span>
                </div>
                <div className="flex justify-between text-lg mt-4">
                  <span className="text-slate-300 font-bold">Total Due</span>
                  <span className="text-indigo-400 font-bold">{selectedOrder.amount}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-900/50 p-3 rounded mb-6">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> PAID IN FULL</span>
                <span>Thank you for your business.</span>
              </div>

              {/* Action Buttons */}
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Download PDF Copy
              </button>
            </div>
          </div>
        </div>
      )}
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
  
  // --- NEW ALERTS STATE ---
  const [alertFilter, setAlertFilter] = useState('ALL');
  const [resolvedAlerts, setResolvedAlerts] = useState([]);

  // --- LIVE WEATHER STATE ---
  const [originCity, setOriginCity] = useState('New York');
  const [destCity, setDestCity] = useState('Los Angeles');
  
  // 🔥 ADVANCED PARAMETERS 🔥
  const [cargoType, setCargoType] = useState('Standard');
  const [fleetType, setFleetType] = useState('Standard 18-Wheeler');
  
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
        const res = await fetch('https://routeguardian-ai.onrender.com/api/shipments/at-risk');
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
    
    // 1. Add user's message to the chat window immediately
    const newLog = [...chatLog, { role: 'user', text: userMessage }];
    setChatLog(newLog);
    setChatInput(""); 

    try {
      // 2. Send the message to your LIVE Render backend!
      const response = await fetch("https://routeguardian-ai.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await response.json();
      
      // 3. Add the real AI's reply to the chat window
      setChatLog([...newLog, { role: 'ai', text: data.reply }]);
      
    } catch (error) {
      console.error("Chat Error:", error);
      setChatLog([...newLog, { role: 'ai', text: "⚠️ Connection error to AI Backend." }]);
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
        statusColor,
        // 🔥 NEW: LOGISTICS METRICS 🔥
        confidence: Math.floor(Math.random() * (98 - 85 + 1)) + 85, // Random 85-98%
        transitTime: Math.floor(Math.random() * (72 - 24 + 1)) + 24, // Random 24-72 hours
        fuelImpact: (originBad || destBad) ? `+${Math.floor(Math.random() * 5) + 3}% (Detour)` : 'Normal'
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

          {/* ================= ALERTS TAB (UPGRADED) ================= */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              
              {/* FILTER BUTTONS */}
              <div className="flex gap-3 mb-2">
                {['ALL', 'CRITICAL', 'WARNING'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setAlertFilter(f)}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all tracking-wide ${alertFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-700'}`}
                  >
                    {f} ALERTS
                  </button>
                ))}
              </div>

              {/* ACTIONABLE ALERTS LIST */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Smart Actionable Alerts</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { id: 'AL-001', level: 'CRITICAL', msg: 'SHIP-001 storm delay detected on NYC→LAX route', rec: 'Reroute via Air Freight (94% Confidence).', time: '2 min ago', color: 'border-l-rose-500 text-rose-500', bg: 'bg-[#1f1925]' },
                    { id: 'AL-002', level: 'WARNING', msg: 'Traffic congestion on I-40', rec: 'Adjust departure time +2 hrs to avoid peak gridlock.', time: '5 min ago', color: 'border-l-amber-500 text-amber-500', bg: 'bg-[#221f20]' },
                    { id: 'AL-003', level: 'INFO', msg: 'System performing optimally', rec: '', time: '15 min ago', color: 'border-l-emerald-500 text-emerald-500', bg: 'bg-[#152324]' },
                  ]
                  .filter(a => alertFilter === 'ALL' || a.level === alertFilter)
                  .map((a) => {
                    const isResolved = resolvedAlerts.includes(a.id);
                    return (
                      <div key={a.id} className={`${isResolved ? 'bg-slate-800/30 border-l-slate-600' : a.bg + ' ' + a.color.split(' ')[0]} border border-slate-800 border-l-4 p-5 rounded-lg flex justify-between items-center transition-all`}>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            {/* ✨ TWEAK 1: Added flex layout, gap, and the Green Checkmark SVG */}
                            <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isResolved ? 'text-emerald-500' : a.color.split(' ')[1]}`}>
                              {isResolved && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                              {isResolved ? 'RESOLVED' : a.level}
                            </p>
                            <span className="text-xs text-slate-500 font-medium">{a.time}</span>
                          </div>
                          
                          <p className={`text-sm ${isResolved ? 'text-slate-500 line-through' : 'text-slate-200'} font-medium`}>{a.msg}</p>
                          
                          {/* AI Recommendation Box */}
                          {!isResolved && a.level !== 'INFO' && (
                            <div className="mt-3 bg-indigo-950/30 border border-indigo-500/20 inline-flex items-center gap-2 px-3 py-1.5 rounded-md">
                              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              <p className="text-xs text-indigo-300"><span className="font-bold">AI Suggests:</span> {a.rec}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* 1-Click Resolve Button */}
                        {!isResolved && a.level !== 'INFO' && (
                          <button 
                            onClick={() => setResolvedAlerts(prev => [...prev, a.id])}
                            className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2 ${a.level === 'CRITICAL' ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'}`}
                          >
                            <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            Execute AI Fix
                          </button>
                        )}

                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= AI TOOLS TAB (ENTERPRISE UPGRADE) ================= */}
          {activeTab === 'tools' && (
            <div className="space-y-6 pb-10">
              <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">AI Route Simulation Engine</h2>
              
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  <h3 className="text-lg font-bold text-white">Simulation Parameters</h3>
                </div>
                
                {/* ADVANCED PARAMETERS FORM */}
                <div className="space-y-5 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Origin Hub</label><input type="text" value={originCity} onChange={e => setOriginCity(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner" /></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destination Hub</label><input type="text" value={destCity} onChange={e => setDestCity(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cargo Classification</label>
                      <select value={cargoType} onChange={e => setCargoType(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                        <option>Standard Freight</option>
                        <option>Perishables (Refrigerated)</option>
                        <option>Hazardous Materials (HAZMAT)</option>
                        <option>High-Value Electronics</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fleet Allocation</label>
                      <select value={fleetType} onChange={e => setFleetType(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                        <option>Standard 18-Wheeler</option>
                        <option>Heavy-Duty Flatbed</option>
                        <option>Sprinter Van (Expedited)</option>
                        <option>Air Freight / Cargo Plane</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <button onClick={handleLiveWeatherSimulation} disabled={weatherLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-lg transition-all flex justify-center items-center gap-2 text-sm shadow-lg shadow-indigo-900/20">
                  {weatherLoading ? (
                    <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing Live Satellite Data...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Execute Pre-Dispatch Simulation</>
                  )}
                </button>

                {/* EXPANDED LIVE RESULTS PANEL */}
                {weatherResult && (
                  <div className="mt-8 pt-6 border-t border-slate-700 animate-in fade-in slide-in-from-top-4">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Simulation Complete
                    </h4>
                    
                    {/* Weather Data */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-inner">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{originCity} (ORIGIN)</p>
                        <h5 className="text-3xl font-black text-white my-1">{Math.round(weatherResult.origin.temp)}°C</h5>
                        <p className="text-xs text-slate-400 capitalize flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg> {weatherResult.origin.desc}</p>
                      </div>
                      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-inner">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{destCity} (DESTINATION)</p>
                        <h5 className="text-3xl font-black text-white my-1">{Math.round(weatherResult.dest.temp)}°C</h5>
                        <p className="text-xs text-slate-400 capitalize flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg> {weatherResult.dest.desc}</p>
                      </div>
                    </div>

                    {/* NEW: Logistics Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Est. Transit Time</p>
                        <p className="text-lg font-bold text-white">{weatherResult.transitTime} Hours</p>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">AI Confidence</p>
                        <p className="text-lg font-bold text-indigo-400">{weatherResult.confidence}%</p>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fuel Impact</p>
                        <p className={`text-lg font-bold ${weatherResult.fuelImpact === 'Normal' ? 'text-emerald-400' : 'text-rose-400'}`}>{weatherResult.fuelImpact}</p>
                      </div>
                    </div>

                    {/* Recommendation Box */}
                    <div className={`p-5 rounded-xl border ${weatherResult.statusColor.replace('text', 'border')}/30 bg-slate-800/30 mb-4`}>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Routing Recommendation</p>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${weatherResult.statusColor.replace('text', 'border')} ${weatherResult.statusColor}`}>{weatherResult.riskScore} RISK</span>
                      </div>
                      <p className="text-sm text-white font-medium leading-relaxed">{weatherResult.recommendation}</p>
                    </div>

                    {/* NEW: Action Buttons */}
                    <div className="flex gap-3">
                      <button onClick={() => alert('Route Brief PDF generated and downloaded.')} className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-lg transition-colors border border-slate-700 text-xs flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export Route Brief
                      </button>
                      <button onClick={() => alert('Route saved to active dispatch queue.')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 text-xs flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Save to Active Dispatch
                      </button>
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