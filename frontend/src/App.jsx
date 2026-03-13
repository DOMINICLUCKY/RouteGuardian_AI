import React, { useState, useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Menu, AlertTriangle, TrendingUp, Package, Clock, Zap, Send, Bot, LineChart as LineChartIcon, Wifi, Activity } from 'lucide-react';

// Fallback Dummy Data
const DUMMY_SHIPMENTS = [
  {
    id: 'SHIP-001',
    route: 'NYC → LAX',
    eta: '2h 45m',
    status: 'Delayed',
    riskLevel: 'Critical',
    destination: 'Los Angeles, CA',
    carrier: 'CargoX Air',
  },
  {
    id: 'SHIP-002',
    route: 'MIA → Chicago',
    eta: '4h 20m',
    status: 'At Risk',
    riskLevel: 'High',
    destination: 'Chicago, IL',
    carrier: 'FedEx Prime',
  },
  {
    id: 'SHIP-003',
    route: 'Seattle → Boston',
    eta: '8h 15m',
    status: 'Delayed',
    riskLevel: 'Critical',
    destination: 'Boston, MA',
    carrier: 'UPS Logistics',
  },
  {
    id: 'SHIP-004',
    route: 'Dallas → Denver',
    eta: '3h 30m',
    status: 'At Risk',
    riskLevel: 'Medium',
    destination: 'Denver, CO',
    carrier: 'DHL Express',
  },
  {
    id: 'SHIP-005',
    route: 'Phoenix → Detroit',
    eta: '6h 00m',
    status: 'Delayed',
    riskLevel: 'Critical',
    destination: 'Detroit, MI',
    carrier: 'YRC Worldwide',
  },
];

const TRENDLINE_DATA = [
  { day: 'Mon', shipments: 120 },
  { day: 'Tue', shipments: 145 },
  { day: 'Wed', shipments: 132 },
  { day: 'Thu', shipments: 158 },
  { day: 'Fri', shipments: 172 },
  { day: 'Sat', shipments: 145 },
  { day: 'Sun', shipments: 165 },
];

const AI_ALERTS = [
  'AI Alert: Reroute Flight 402 due to Storm Front over Midwest',
  'System Notice: Weather delays detected on TX-NM corridor',
  'AI Recommendation: Accelerate shipment SHIP-001 before closure window',
  'Traffic Alert: I-40 congestion detected, alternate routes suggested',
  'Predictive Alert: 72-hour forecast shows 3 additional delays incoming',
];

// Order History Data for Client
const CLIENT_ORDER_HISTORY = [
  {
    id: 'ORD-2024-001',
    shipmentId: 'SHIP-098',
    route: 'NYC → LA',
    date: '2024-03-10',
    delivered: '2024-03-12',
    status: 'Delivered',
  },
  {
    id: 'ORD-2024-002',
    shipmentId: 'SHIP-087',
    route: 'Chicago → Miami',
    date: '2024-03-08',
    delivered: '2024-03-10',
    status: 'Delivered',
  },
  {
    id: 'ORD-2024-003',
    shipmentId: 'SHIP-065',
    route: 'Seattle → Atlanta',
    date: '2024-03-05',
    delivered: '2024-03-08',
    status: 'Delivered',
  },
];

// Standalone AIToolsView Component (Outside App to prevent re-renders)
const AIToolsView = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold mb-6">AI Tools & Capabilities</h2>
    </div>

    <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 shadow-xl">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Zap className="text-yellow-400" size={24} />
        Predictive Weather Routing Engine
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Origin City</label>
          <input
            type="text"
            defaultValue=""
            placeholder="New York, NY"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Destination City</label>
          <input
            type="text"
            defaultValue=""
            placeholder="Los Angeles, CA"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Shipment Weight (lbs)</label>
          <input
            type="number"
            defaultValue=""
            placeholder="500"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => alert('Running predictive weather routing sequence...')}
          className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all"
        >
          <Zap size={18} className="inline mr-2" />
          Run AI Simulation
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h4 className="text-lg font-semibold mb-3">Real-Time Weather Analysis</h4>
        <p className="text-slate-400 text-sm">Advanced AI scans weather patterns across all active routes and predicts delays up to 72 hours in advance.</p>
      </div>
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h4 className="text-lg font-semibold mb-3">Traffic Prediction Model</h4>
        <p className="text-slate-400 text-sm">Machine learning model trained on historical traffic data to optimize route selection and minimize delays.</p>
      </div>
    </div>
  </div>
);

// Login Screen Component
const LoginScreen = ({ onSelectRole }) => (
  <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 items-center justify-center overflow-hidden">
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
    </div>

    {/* Content */}
    <div className="relative z-10 text-center px-4 max-w-md w-full">
      {/* Logo/Branding */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-indigo-400 mb-2">RouteGuardian</h1>
        <p className="text-slate-300 text-lg">AI-Powered Logistics Engine</p>
        <div className="mt-4 h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full" />
      </div>

      {/* Description */}
      <p className="text-slate-400 mb-12 text-sm leading-relaxed">
        Real-time shipment tracking, risk monitoring, and AI-powered logistics optimization. Choose your role to get started.
      </p>

      {/* Buttons */}
      <div className="space-y-4">
        <button
          onClick={() => onSelectRole('manager')}
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <span className="text-lg">📊 Login as Logistics Manager</span>
          <p className="text-xs text-indigo-200 mt-1">Full dashboard, AI tools, analytics</p>
        </button>

        <button
          onClick={() => onSelectRole('client')}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <span className="text-lg">📦 Login as Client</span>
          <p className="text-xs text-emerald-200 mt-1">Track your shipments, view history</p>
        </button>
      </div>

      {/* Footer */}
      <p className="text-slate-500 text-xs mt-12">v1.0 BETA | Hackathon Edition</p>
    </div>
  </div>
);

// Client Dashboard Component
const ClientDashboard = ({ onLogout }) => (
  <div className="min-h-screen bg-slate-900 text-white">
    {/* Header */}
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 shadow-lg">
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, Acme Corp</h2>
          <p className="text-sm text-slate-400 mt-1">Shipment tracking & order management</p>
        </div>
        <button
          onClick={onLogout}
          className="px-6 py-2 bg-red-600/20 border border-red-500/50 text-red-300 hover:bg-red-600/40 rounded-lg font-medium transition text-sm"
        >
          Log Out
        </button>
      </div>
    </header>

    {/* Main Content */}
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Track Active Shipment Card */}
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 shadow-xl">
        <h3 className="text-2xl font-bold mb-6">Track Active Shipment</h3>
        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
          <div className="mb-4">
            <p className="text-sm text-slate-300 mb-2">
              <span className="font-semibold">Shipment ID:</span> <span className="text-indigo-300 font-mono">SHIP-2024-001</span>
            </p>
            <p className="text-sm text-slate-300">
              <span className="font-semibold">Contents:</span> <span className="text-slate-100">Electronics Components</span>
            </p>
            <p className="text-sm text-slate-300">
              <span className="font-semibold">Expected Delivery:</span> <span className="text-emerald-300">March 15, 2024</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-emerald-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
                <p className="text-xs font-semibold text-slate-300">Origin</p>
                <p className="text-xs text-slate-500">NYC</p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="h-1 flex-1 bg-gradient-to-r from-emerald-500 to-indigo-500 mx-2 rounded-full" />
              </div>

              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-indigo-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                  ⊙
                </div>
                <p className="text-xs font-semibold text-slate-300">In Transit</p>
                <p className="text-xs text-slate-500">Chicago, IL</p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="h-1 flex-1 bg-slate-700 mx-2 rounded-full" />
              </div>

              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-slate-600 rounded-full mx-auto mb-2 flex items-center justify-center text-slate-300 font-bold">
                  →
                </div>
                <p className="text-xs font-semibold text-slate-300">Destination</p>
                <p className="text-xs text-slate-500">Los Angeles, CA</p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="mt-6 bg-indigo-500/10 border border-indigo-500/50 rounded-lg p-4">
            <p className="text-sm text-indigo-300 font-semibold">📍 Currently in Transit</p>
            <p className="text-sm text-indigo-200 mt-1">Your shipment is on schedule and expected to arrive on March 15, 2024.</p>
          </div>
        </div>
      </div>

      {/* Order History Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
          <h3 className="text-lg font-semibold">Order History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Ordered Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Delivered Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {CLIENT_ORDER_HISTORY.map((order) => (
                <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 text-sm font-mono text-indigo-400">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{order.route}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{order.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{order.delivered}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-700 pt-6">
        <p>RouteGuardian Client Portal | Secure Shipment Tracking | Updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  </div>
);

export default function App() {
  const [userRole, setUserRole] = useState(null); // null | 'manager' | 'client'
  const [shipments, setShipments] = useState([]);
  const [atRiskShipments, setAtRiskShipments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiAlertIndex, setAiAlertIndex] = useState(0);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  useEffect(() => {
    if (userRole !== 'manager') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        let shipmentsData = [];
        try {
          const shipmentsRes = await fetch('http://localhost:8000/api/shipments');
          if (shipmentsRes.ok) {
            const data = await shipmentsRes.json();
            console.log('Shipments API response:', data);
            shipmentsData = Array.isArray(data) ? data : (data.data || data.shipments || []);
          } else {
            console.warn('Shipments endpoint failed, using dummy data');
            shipmentsData = DUMMY_SHIPMENTS;
          }
        } catch (err) {
          console.error('Shipments fetch error:', err);
          shipmentsData = DUMMY_SHIPMENTS;
        }

        let atRiskCount = 0;
        try {
          const atRiskRes = await fetch('http://localhost:8000/api/shipments/at-risk');
          if (atRiskRes.ok) {
            const data = await atRiskRes.json();
            console.log('At-risk API response:', data);
            setShipments(Array.isArray(data) ? data : []);
            atRiskCount = data.count || data.length || (Array.isArray(data) ? data.length : 0);
          }
        } catch (err) {
          console.error('At-risk fetch error:', err);
          atRiskCount = 3;
        }

        setAtRiskShipments(atRiskCount);
        console.log('Shipments state updated:', shipmentsData.length, 'items');
      } catch (err) {
        console.error('Fetch error:', err);
        setShipments(DUMMY_SHIPMENTS);
        setAtRiskShipments(3);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      setAiAlertIndex((prev) => (prev + 1) % AI_ALERTS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [userRole]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!chatInput.trim()) return;
    
    const userMessage = { role: 'user', text: chatInput };
    setChatLog(prev => [...prev, userMessage]);
    
    const tempInput = chatInput;
    setChatInput('');
    
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: tempInput })
      });
      
      if (!response.ok) throw new Error('Chat API failed');
      
      const aiReply = await response.json();
      const aiMessage = { role: 'ai', text: aiReply.reply || 'AI response received' };
      setChatLog(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { role: 'ai', text: '⚠️ AI temporarily unavailable. Using fallback mode.' };
      setChatLog(prev => [...prev, errorMessage]);
    }
  };

  const onTimePercentage = 87;
  const totalShipments = shipments.length || 5;

  const ANALYTICS_DATA = [
    { time: '00:00', efficiency: 75 },
    { time: '04:00', efficiency: 82 },
    { time: '08:00', efficiency: 88 },
    { time: '12:00', efficiency: 92 },
    { time: '16:00', efficiency: 85 },
    { time: '20:00', efficiency: 79 },
  ];

  const ALERTS_FEED = [
    { id: 1, level: 'critical', message: 'SHIP-001 storm delay detected on NYC→LAX route', time: '2 min ago' },
    { id: 2, level: 'warning', message: 'Traffic congestion on I-40', time: '5 min ago' },
    { id: 3, level: 'critical', message: 'SHIP-003 might miss SLA window', time: '8 min ago' },
    { id: 4, level: 'info', message: 'System performing optimally', time: '15 min ago' },
  ];

  const SkeletonCard = () => (
    <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/3 mb-4" />
      <div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
      <div className="h-4 bg-slate-700 rounded w-2/3" />
    </div>
  );

  const SkeletonRow = () => (
    <tr className="border-b border-slate-700">
      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded animate-pulse w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded animate-pulse w-32" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded animate-pulse w-16" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded animate-pulse w-24" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded animate-pulse w-20" /></td>
    </tr>
  );

  const DashboardView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl overflow-hidden">
          {loading ? (
            <SkeletonCard />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300">Total Active Shipments</h3>
                <Package className="text-indigo-400" size={20} />
              </div>
              <div className="mb-4">
                <p className="text-3xl font-bold text-white">{totalShipments}</p>
                <p className="text-xs text-slate-400 mt-1">Active in network</p>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={TRENDLINE_DATA}>
                  <defs>
                    <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="day"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="shipments"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorShipments)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
          {loading ? (
            <SkeletonCard />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300">On-Time Deliveries</h3>
                <Clock className="text-green-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{onTimePercentage}%</p>
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                  style={{ width: `${onTimePercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-3">↑ 2.4% from last week</p>
            </>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
          {loading ? (
            <SkeletonCard />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300">High-Risk (72h)</h3>
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-red-400">{atRiskShipments}</p>
              <p className="text-xs text-slate-400 mt-1">Requiring intervention</p>
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-xs text-red-200">⚠️ Immediate action needed</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
            <h3 className="text-lg font-semibold">Delayed Shipments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">ETA</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : shipments && shipments.length > 0 ? (
                  shipments.map((shipment) => (
                    <tr key={shipment.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-indigo-400">{shipment.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-200">{shipment.route}</td>
                      <td className="px-6 py-4 text-sm text-slate-200">{shipment.eta}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            shipment.riskLevel === 'Critical'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                              : shipment.riskLevel === 'High'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                          }`}
                        >
                          {shipment.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedShipment(shipment)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-medium transition"
                        >
                          Intervene
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                      No shipments data available. Check browser console for API errors.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Chat
          </h3>
          
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto bg-slate-900/50 p-4 rounded-lg">
            {chatLog.length === 0 ? (
              <div className="text-slate-500 text-sm italic text-center py-8">
                Ask me about shipment risks...
              </div>
            ) : (
              chatLog.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-700 text-slate-200'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Network Efficiency</h3>
            <Activity className="text-indigo-400" size={20} />
          </div>
          <p className="text-3xl font-bold">87%</p>
          <p className="text-xs text-slate-400 mt-2">↑ 4.2% this month</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Avg. Processing Time</h3>
            <Clock className="text-green-400" size={20} />
          </div>
          <p className="text-3xl font-bold">2.4h</p>
          <p className="text-xs text-slate-400 mt-2">Per shipment</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Total Routes</h3>
            <TrendingUp className="text-blue-400" size={20} />
          </div>
          <p className="text-3xl font-bold">142</p>
          <p className="text-xs text-slate-400 mt-2">Active routes</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Cost Savings</h3>
            <Zap className="text-yellow-400" size={20} />
          </div>
          <p className="text-3xl font-bold">$12K</p>
          <p className="text-xs text-slate-400 mt-2">This week</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
        <h3 className="text-lg font-semibold mb-6">Network Efficiency Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ANALYTICS_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Line type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const AlertsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">System Alerts Log</h2>
        <AlertTriangle className="text-red-400" size={24} />
      </div>

      <div className="space-y-3">
        {ALERTS_FEED.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 rounded-lg p-4 ${
              alert.level === 'critical'
                ? 'bg-red-500/10 border-red-500'
                : alert.level === 'warning'
                ? 'bg-orange-500/10 border-orange-500'
                : 'bg-green-500/10 border-green-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-semibold ${
                  alert.level === 'critical'
                    ? 'text-red-300'
                    : alert.level === 'warning'
                    ? 'text-orange-300'
                    : 'text-green-300'
                }`}>
                  {alert.level.toUpperCase()}
                </p>
                <p className="text-slate-200 mt-1">{alert.message}</p>
              </div>
              <span className="text-xs text-slate-400">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Conditional Rendering based on User Role
  if (userRole === null) {
    return <LoginScreen onSelectRole={setUserRole} />;
  }

  if (userRole === 'client') {
    return <ClientDashboard onLogout={() => setUserRole(null)} />;
  }

  // Manager Dashboard
  return (
    <ReactLenis root>
      <div className="flex min-h-screen bg-slate-900 text-white overflow-x-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-slate-800 border-r border-slate-700 transition-all duration-300 fixed left-0 top-0 h-screen flex flex-col`}
        >
          <div className="p-6 flex items-center justify-between">
            <div className={`${!sidebarOpen && 'hidden'}`}>
              <h1 className="text-xl font-bold text-indigo-400">RouteGuardian</h1>
              <p className="text-xs text-slate-400">AI Engine</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {[
              { icon: Package, label: 'Dashboard' },
              { icon: TrendingUp, label: 'Analytics' },
              { icon: AlertTriangle, label: 'Alerts' },
              { icon: Zap, label: 'AI Tools' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === item.label
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <item.icon size={20} />
                <span className={`${!sidebarOpen && 'hidden'}`}>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className={`p-4 border-t border-slate-700 space-y-2 ${!sidebarOpen && 'text-center'}`}>
            <button
              onClick={() => setUserRole(null)}
              className={`w-full px-3 py-2 bg-red-600/20 border border-red-500/50 text-red-300 hover:bg-red-600/40 rounded-lg font-medium transition text-xs ${
                !sidebarOpen && 'px-2'
              }`}
            >
              {sidebarOpen ? '🚪 Log Out' : '⊗'}
            </button>
            <p className="text-xs text-slate-400">v1.0 BETA</p>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          {/* Header */}
          <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 shadow-lg">
            <div className="px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">RouteGuardian AI Engine</h2>
                <p className="text-sm text-slate-400 mt-1">Real-time Shipment Risk Monitoring</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-full border border-slate-700">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">ONLINE</span>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="p-8">
            {activeTab === 'Dashboard' && <DashboardView />}
            {activeTab === 'Analytics' && <AnalyticsView />}
            {activeTab === 'Alerts' && <AlertsView />}
            {activeTab === 'AI Tools' && <AIToolsView />}

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-slate-500 border-t border-slate-700 pt-6">
              <p>RouteGuardian AI Engine | Real-time Logistics Intelligence | Updated: {new Date().toLocaleTimeString()}</p>
            </div>

            {/* AI Modal */}
            {selectedShipment && (
              <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                  <h2 className="text-2xl font-bold mb-6 text-indigo-400">AI Intervention Panel</h2>

                  <div className="bg-slate-900/50 rounded-lg p-4 mb-5 border border-slate-700">
                    <p className="text-sm text-slate-300 mb-2">
                      <span className="font-semibold">Shipment ID:</span> <span className="text-indigo-300 font-mono">{selectedShipment.id}</span>
                    </p>
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold">Route:</span> <span className="text-slate-100">{selectedShipment.route}</span>
                    </p>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-orange-300 font-semibold mb-1">⚠️ AI Analysis</p>
                    <p className="text-sm text-orange-200">Severe weather detected on route. 85% probability of missing SLA.</p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-emerald-300 font-semibold mb-1">✓ AI Recommendation</p>
                    <p className="text-sm text-emerald-200">Reroute via Air Freight. Estimated delay avoided: 14 hours.</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedShipment(null)}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShipments(shipments.filter(s => s.id !== selectedShipment.id));
                        setSelectedShipment(null);
                      }}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white"
                    >
                      Execute AI Reroute
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ReactLenis>
  );
}

