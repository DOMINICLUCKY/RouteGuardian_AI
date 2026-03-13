import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';

// --- MOCK DATA FOR THE INTERACTIVE CHART ---
const shipmentData = [
  { name: 'Mon', shipments: 120 },
  { name: 'Tue', shipments: 150 },
  { name: 'Wed', shipments: 140 },
  { name: 'Thu', shipments: 170 },
  { name: 'Fri', shipments: 160 },
  { name: 'Sat', shipments: 110 },
  { name: 'Sun', shipments: 90 },
];

// ----------------------------------------------------------------------
// 1. LOGIN SCREEN
// ----------------------------------------------------------------------
const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 font-sans text-slate-200">
    <div className="max-w-md w-full bg-[#0a0f1c] border border-slate-800 rounded-xl p-10 shadow-2xl text-center">
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">RouteGuardian <span className="text-indigo-500 font-normal">AI</span></h1>
      <p className="text-slate-400 mb-8 font-medium text-sm">Real-time Shipment Risk Monitoring</p>
      <button onClick={onLogin} className="w-full flex items-center justify-center gap-3 bg-[#6366f1] hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg">
        <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Sign In with Google
      </button>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// 2. CLIENT DASHBOARD (Restored exactly to Screenshot 1)
// ----------------------------------------------------------------------
const ClientDashboard = ({ user, onLogout }) => (
  <div className="min-h-screen bg-[#050810] text-slate-200 p-8 font-sans">
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {user.displayName}</h1>
          <p className="text-slate-400 mt-1 text-sm">Here is the status of your recent shipments.</p>
        </div>
        <button onClick={onLogout} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2 rounded-md border border-slate-700 transition-all font-medium text-sm">Sign Out</button>
      </div>

      {/* Track Active Order Card */}
      <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-8 mb-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6">Track Active Order: #TRK-88492</h2>
        <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
          <span className="text-indigo-400">Origin (NYC)</span>
          <span className="text-indigo-400">In Transit</span>
          <span>Destination (LAX)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
          <div className="bg-[#6366f1] h-2 rounded-full w-[60%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
        </div>
        <p className="text-xs text-slate-500">Estimated Arrival: Tomorrow at 2:00 PM</p>
      </div>

      {/* Order History Card */}
      <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6">Order History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-slate-400 text-sm border-b border-slate-800">
              <tr>
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Route</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="py-4 text-indigo-400 text-xs font-mono">TRK-22941</td>
                <td className="py-4 text-slate-300">MIA -&gt; CHI</td>
                <td className="py-4 text-slate-300">Oct 12, 2023</td>
                <td className="py-4"><span className="bg-emerald-950/40 text-emerald-400 px-3 py-1 rounded-full text-[10px] border border-emerald-900">Delivered</span></td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-4 text-indigo-400 text-xs font-mono">TRK-10488</td>
                <td className="py-4 text-slate-300">SEA -&gt; BOS</td>
                <td className="py-4 text-slate-300">Oct 05, 2023</td>
                <td className="py-4"><span className="bg-emerald-950/40 text-emerald-400 px-3 py-1 rounded-full text-[10px] border border-emerald-900">Delivered</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// 3. MANAGER DASHBOARD
// ----------------------------------------------------------------------
const ManagerDashboard = ({ user, onLogout }) => {
  const [shipments, setShipments] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: 'ai', text: "estimate as soon as possible." },
    { role: 'user', text: "Write a polite 5-sentence email to a client apologizing that their shipment of electronics was delayed by a thunderstorm." },
    { role: 'ai', text: "Subject: Update Regarding Your Electronics Shipment\n\n[Client Name/Order Number] We sincerely apologize for the unexpected delay concerning your recent electronics shipment. This was unfortunately caused by severe thunderstorms impacting our transit routes yesterday. Our team is actively working to minimize further disruption and expedite delivery. Your shipment is now expected to arrive within the next [New ETA, e.g., 24-48 hours]. We appreciate your understanding and will provide updated tracking information as soon as it's available." }
  ]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog]);

  useEffect(() => {
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newLog = [...chatLog, { role: 'user', text: chatInput }];
    setChatLog(newLog);
    setChatInput("");
    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await response.json();
      setChatLog([...newLog, { role: 'ai', text: data.reply }]);
    } catch (err) { setChatLog([...newLog, { role: 'ai', text: "⚠️ AI Connection Error." }]); }
  };

  // Custom Tooltip for the Recharts graph
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg">
          <p className="text-white text-xs">{`${label}: ${payload[0].value} shipments`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#131b2f] text-slate-300 flex font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[240px] bg-[#1e293b] border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 p-6 mb-2">
            <div>
              <h1 className="text-lg font-bold text-indigo-400 leading-tight">RouteGuardian</h1>
              <p className="text-[10px] text-slate-500">AI Engine</p>
            </div>
            <button className="ml-auto text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          </div>
          
          <nav className="px-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'analytics', label: 'Analytics', icon: 'M7 21V7m0 0l-3 3m3-3l3 3m5 14V3m0 0l-3 3m3-3l3 3' },
              { id: 'alerts', label: 'Alerts', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
              { id: 'tools', label: 'AI Tools', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
            ].map(tab => (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeTab === tab.id ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} /></svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 flex justify-between items-center text-xs text-slate-600 border-t border-slate-800">
          <span>v1.0 BETA</span>
          <button onClick={onLogout} className="text-slate-400 hover:text-white underline">Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-[72px] bg-[#1e293b] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">RouteGuardian AI Engine</h2>
            <p className="text-xs text-slate-400">Real-time Shipment Risk Monitoring</p>
          </div>
          <div className="bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">ONLINE</span>
          </div>
        </header>

        {/* VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6">
          
          {/* ================= DASHBOARD TAB ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* TOP 3 CARDS */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* 1. INTERACTIVE CHART CARD */}
                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 flex flex-col shadow-lg relative min-h-[160px]">
                  <div className="flex justify-between items-start mb-2 z-10">
                    <p className="text-sm font-medium text-slate-300">Total Active Shipments</p>
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white z-10">4</h3>
                  <p className="text-xs text-slate-400 mb-2 z-10">Active in network</p>
                  
                  {/* Recharts Interactive Area Chart */}
                  <div className="absolute bottom-0 left-0 w-full h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={shipmentData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                        <Area type="monotone" dataKey="shipments" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorShipments)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute bottom-2 left-0 w-full flex justify-between px-4 text-[9px] text-slate-500 z-10">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>

                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 flex flex-col shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-slate-300">On-Time Deliveries</p>
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6">87%</h3>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mb-3"><div className="bg-emerald-400 h-1.5 rounded-full w-[87%] shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div></div>
                  <p className="text-[10px] text-slate-400">↑ 2.4% from last week</p>
                </div>

                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 flex flex-col shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <p className="text-sm font-medium text-slate-300">High-Risk (72h)</p>
                    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-rose-500 mb-1 pl-2">5</h3>
                  <p className="text-xs text-slate-400 mb-4 pl-2">Requiring intervention</p>
                  <div className="bg-rose-950/40 border border-rose-900/50 rounded-md p-2.5 flex items-center gap-2 ml-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="text-xs font-medium text-slate-300">Immediate action needed</span>
                  </div>
                </div>

              </div>

              {/* TABLE & AI CHAT SPLIT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* DELAYED SHIPMENTS TABLE */}
                <div className="xl:col-span-2 bg-[#1e293b] border border-slate-700 rounded-xl shadow-lg">
                  <div className="p-5 border-b border-slate-700"><h3 className="text-base font-bold text-white">Delayed Shipments</h3></div>
                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-left">
                      <thead className="text-slate-400 text-xs border-b border-slate-700">
                        <tr><th className="px-5 py-3 font-semibold">ID</th><th className="px-5 py-3 font-semibold">Route</th><th className="px-5 py-3 font-semibold">ETA</th><th className="px-5 py-3 font-semibold">Risk Level</th><th className="px-5 py-3 font-semibold">Action</th></tr>
                      </thead>
                      <tbody className="text-xs">
                        {(shipments.length > 0 ? shipments : [
                          { id: 'TRK-44227', route: 'SEA -> BOS', eta: '42h', riskLevel: 'Critical' },
                          { id: 'TRK-73040', route: 'PHX -> DET', eta: '23h', riskLevel: 'Critical' },
                          { id: 'TRK-27571', route: 'ATL -> SFO', eta: '12h', riskLevel: 'Low' },
                          { id: 'TRK-12946', route: 'PHX -> DET', eta: '47h', riskLevel: 'Critical' }
                        ]).map((s, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-5 py-5 text-indigo-400 font-mono">{s.id}</td>
                            <td className="px-5 py-5 text-slate-300">{s.route}</td>
                            <td className="px-5 py-5 text-slate-300">{s.eta}</td>
                            <td className="px-5 py-5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${s.riskLevel === 'Critical' ? 'bg-rose-950/40 text-rose-400 border-rose-800' : 'bg-amber-950/40 text-amber-400 border-amber-800'}`}>{s.riskLevel}</span>
                            </td>
                            <td className="px-5 py-5"><button className="bg-[#6366f1] hover:bg-indigo-500 text-white text-[10px] font-medium px-3 py-1.5 rounded transition">Intervene</button></td>
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

          {/* ================= ANALYTICS TAB (Fixed Height) ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { l: 'Network Efficiency', v: '87%', s: '↑ 4.2% this month', i: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', ic: 'text-indigo-400' },
                  { l: 'Avg. Processing Time', v: '2.4h', s: 'Per shipment', i: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', ic: 'text-emerald-500' },
                  { l: 'Total Routes', v: '142', s: 'Active routes', i: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', ic: 'text-indigo-400' },
                  { l: 'Cost Savings', v: '$12K', s: 'This week', i: 'M13 10V3L4 14h7v7l9-11h-7z', ic: 'text-amber-400' }
                ].map((s, i) => (
                  <div key={i} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-lg relative">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-medium text-slate-300">{s.l}</p>
                      <svg className={`w-4 h-4 ${s.ic}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.i} /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{s.v}</h3>
                    <p className="text-[10px] text-slate-500">{s.s}</p>
                  </div>
                ))}
              </div>
              
              {/* FIXED HEIGHT ANALYTICS CHART */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg h-[350px] flex flex-col">
                <h3 className="text-sm font-bold text-white mb-6">Network Efficiency Trend</h3>
                <div className="flex-1 border-b border-l border-slate-700 relative text-xs text-slate-500">
                  <div className="absolute bottom-0 w-full h-full flex flex-col justify-between -left-6 text-right pr-2"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
                  <div className="absolute -bottom-6 w-full flex justify-between px-2"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span></div>
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full text-indigo-500 stroke-current drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"><path fill="none" strokeWidth="0.5" d="M0 10 Q 25 5, 50 8 T 100 12" /><circle cx="0" cy="10" r="1.5" fill="white" /><circle cx="25" cy="5" r="1.5" fill="white" /><circle cx="50" cy="8" r="1.5" fill="white" /><circle cx="75" cy="5" r="1.5" fill="white" /><circle cx="100" cy="12" r="1.5" fill="white" /></svg>
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
                    <div>
                      <p className={`text-[10px] font-bold ${a.color.split(' ')[1]} mb-1`}>{a.level}</p>
                      <p className="text-sm text-slate-300">{a.msg}</p>
                    </div>
                    <span className="text-xs text-slate-500">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= AI TOOLS TAB ================= */}
          {activeTab === 'tools' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">AI Tools & Capabilities</h2>
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <h3 className="text-base font-bold text-white">Predictive Weather Routing Engine</h3>
                </div>
                <div className="space-y-4 mb-6">
                  <div><label className="block text-xs text-slate-400 mb-1">Origin City</label><input type="text" value="New York, NY" readOnly className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-300 focus:outline-none" /></div>
                  <div><label className="block text-xs text-slate-400 mb-1">Destination City</label><input type="text" value="Los Angeles, CA" readOnly className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-300 focus:outline-none" /></div>
                </div>
                <button className="w-full bg-[#8b5cf6] hover:bg-violet-600 text-white font-medium py-2.5 rounded-md transition flex justify-center items-center gap-2 text-sm shadow-md">
                   Run AI Simulation
                </button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-8 text-center text-[10px] text-slate-600">RouteGuardian AI Engine | Real-time Logistics Intelligence | Updated: {new Date().toLocaleTimeString()}</div>

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

  const handleGoogleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error("Login Failed", error); } };
  const handleLogout = async () => { try { await signOut(auth); } catch (error) { console.error("Logout Failed", error); } };

  if (loadingAuth) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-500 text-sm">Loading System...</div>;
  if (!user) return <LoginScreen onLogin={handleGoogleLogin} />;
  
  if (user.email === 'adarshmund07@gmail.com') return <ManagerDashboard user={user} onLogout={handleLogout} />;
  return <ClientDashboard user={user} onLogout={handleLogout} />;
}