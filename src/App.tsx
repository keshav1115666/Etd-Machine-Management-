/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  LogOut, 
  Shield, 
  Plane, 
  DoorOpen, 
  Cpu, 
  Users as UsersIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Machine, LogEntry, Personnel } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'history' | 'admin' | 'reports'>('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  // App State
  const [machines, setMachines] = useState<Machine[]>([]);
  const [activeLogs, setActiveLogs] = useState<LogEntry[]>([]);
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();

      // Setup WebSocket for real-time updates
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'LOG_UPDATED' || message.type === 'MACHINE_ADDED') {
            fetchData();
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      socket.onclose = () => {
        console.log('WS connection closed. Reconnecting...');
        // Simple reconnection logic could go here if needed
      };

      return () => {
        socket.close();
      };
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, alRes, hRes, pRes] = await Promise.all([
        fetch('/api/machines'),
        fetch('/api/logs/active'),
        fetch('/api/logs/all'),
        fetch('/api/personnel')
      ]);
      
      setMachines(await mRes.json());
      setActiveLogs(await alRes.json());
      setAllLogs(await hRes.json());
      setPersonnel(await pRes.json());

      if (user?.role === 'admin') {
        const uRes = await fetch('/api/users');
        setAllUsers(await uRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginData({ username: '', password: '' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">ETD Logbook</h1>
            <p className="text-neutral-400 text-sm mt-1">Dubai International Airport</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 ml-1">Username</label>
              <input 
                type="text" 
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="Enter username"
                value={loginData.username}
                onChange={e => setLoginData({...loginData, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 mt-2"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">ETD Manager</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">DXB Airport</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeTab === 'log'} 
            onClick={() => setActiveTab('log')} 
            icon={<PlusCircle className="w-5 h-5" />} 
            label="New Entry" 
          />
          <NavItem 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History className="w-5 h-5" />} 
            label="Log History" 
          />
          {user.role === 'admin' && (
            <>
              <NavItem 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
                icon={<FileText className="w-5 h-5" />} 
                label="Reports" 
              />
              <NavItem 
                active={activeTab === 'admin'} 
                onClick={() => setActiveTab('admin')} 
                icon={<Settings className="w-5 h-5" />} 
                label="Admin Panel" 
              />
            </>
          )}
          
          <div className="pt-4 mt-4 border-t border-neutral-800">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              <Activity className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="text-sm font-medium">Sync Data</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl mb-3">
            <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center text-white font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.username}</p>
              <p className="text-xs text-neutral-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-3 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <Dashboard 
              logs={activeLogs} 
              machines={machines}
              personnel={personnel}
              user={user}
              onRemove={async (id, removedBy) => {
                await fetch('/api/logs/remove', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ log_id: id, removed_by: removedBy })
                });
                fetchData();
              }}
            />
          )}
          {activeTab === 'log' && (
            <LogEntryForm 
              machines={machines.filter(m => m.status === 'available')} 
              personnel={personnel}
              user={user}
              onSuccess={() => {
                setActiveTab('dashboard');
                fetchData();
              }}
            />
          )}
          {activeTab === 'history' && (
            <LogHistory logs={allLogs} />
          )}
          {activeTab === 'reports' && (
            <Reports logs={allLogs} />
          )}
          {activeTab === 'admin' && (
            <AdminPanel 
              machines={machines} 
              users={allUsers}
              personnel={personnel}
              onUpdate={fetchData}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function Dashboard({ logs, machines, personnel, user, onRemove }: { logs: LogEntry[], machines: Machine[], personnel: Personnel[], user: User, onRemove: (id: number, removedBy: string) => void }) {
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removedBy, setRemovedBy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (removingId === null) {
      setRemovedBy('');
    } else {
      setRemovedBy(user.username);
    }
  }, [removingId, user.username]);

  const formatTime = (timeStr: string) => {
    try {
      // Handle SQLite format YYYY-MM-DD HH:MM:SS
      const isoStr = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T') + 'Z';
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return 'Invalid Time';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Error';
    }
  };

  const filteredLogs = logs.filter(log => {
    const mNum = log.machine_number || '';
    const fNum = log.flight_number || '';
    const gNum = log.gate_number || '';
    const instBy = log.installed_by || '';
    const query = searchQuery.toLowerCase();
    
    return mNum.toLowerCase().includes(query) ||
           fNum.toLowerCase().includes(query) ||
           gNum.toLowerCase().includes(query) ||
           instBy.toLowerCase().includes(query);
  });

  const stats = {
    total: machines.length,
    available: machines.filter(m => m.status === 'available').length,
    deployed: machines.filter(m => m.status === 'deployed').length,
    faulty: machines.filter(m => m.printer_status === 'not_working').length
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Active Deployments</h1>
          <p className="text-neutral-500">Real-time status of ETD machines at gates</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text"
              placeholder="Quick search..."
              className="bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all w-full sm:w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-neutral-300">{logs.length} Active</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Machines" value={stats.total} icon={<Cpu className="w-4 h-4 text-neutral-400" />} />
        <StatCard label="Available" value={stats.available} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
        <StatCard label="Deployed" value={stats.deployed} icon={<Plane className="w-4 h-4 text-blue-500" />} />
        <StatCard label="Printer Faults" value={stats.faulty} icon={<AlertCircle className="w-4 h-4 text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLogs.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-neutral-800 rounded-3xl">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">{searchQuery ? 'No matching deployments' : 'No machines currently deployed'}</p>
            <p className="text-sm">{searchQuery ? 'Try a different search term' : "Use the 'New Entry' tab to deploy a machine"}</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <motion.div 
              layout
              key={log.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                    <Cpu className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{log.machine_number}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">Active</p>
                      {log.printer_status && (
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          log.printer_status === 'working' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-400 bg-red-400/10'
                        }`}>
                          Printer: {log.printer_status === 'working' ? 'OK' : 'Faulty'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-800 px-3 py-1 rounded-full text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Gate {log.gate_number}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Plane className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-400">Flight:</span>
                  <span className="text-white font-medium">{log.flight_number}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UsersIcon className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-400">Personnel:</span>
                  <span className="text-white font-medium">{log.guards_count} Deployed</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-400">Installed:</span>
                  <span className="text-white font-medium">{formatTime(log.installation_time)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 mt-2">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Assigned Team</p>
                  <p className="text-xs text-neutral-300 line-clamp-1">{log.installed_by}</p>
                </div>
              </div>

              {removingId === log.id ? (
                <div className="space-y-3">
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Removing Team / Personnel"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-red-500/50"
                    value={removedBy}
                    onChange={e => setRemovedBy(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onRemove(log.id, removedBy)}
                      disabled={!removedBy.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm transition-all"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setRemovingId(null)}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-bold py-2 rounded-xl text-sm transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setRemovingId(log.id)}
                  className="w-full bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Mark as Removed
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function LogEntryForm({ machines, personnel, user, onSuccess }: { machines: Machine[], personnel: Personnel[], user: User, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    flight_number: '',
    gate_number: '',
    selected_machine_ids: [] as number[],
    manual_machine_number: '',
    use_manual_machine: false,
    guards_count: '2',
    installed_by: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleMachine = (id: number) => {
    setFormData(prev => {
      const isSelected = prev.selected_machine_ids.includes(id);
      if (isSelected) {
        return { ...prev, selected_machine_ids: prev.selected_machine_ids.filter(mid => mid !== id) };
      } else {
        return { ...prev, selected_machine_ids: [...prev.selected_machine_ids, id] };
      }
    });
  };

  const addPersonnelToTeam = (p: Personnel) => {
    const entry = p.phone_code ? `${p.name}-${p.phone_code}` : p.name;
    const current = formData.installed_by.trim();
    if (current === '') {
      setFormData({ ...formData, installed_by: entry });
    } else if (!current.includes(entry)) {
      setFormData({ ...formData, installed_by: `${current}, ${entry}` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.use_manual_machine && formData.selected_machine_ids.length === 0) {
      alert("Please select at least one machine");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/logs/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight_number: formData.flight_number,
          gate_number: formData.gate_number,
          machine_ids: formData.use_manual_machine ? null : formData.selected_machine_ids,
          manual_machine_number: formData.use_manual_machine ? formData.manual_machine_number : null,
          guards_count: formData.guards_count,
          installed_by: formData.installed_by
        })
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">New Deployment</h1>
        <p className="text-neutral-500">Record new ETD machine installations</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Plane className="w-3 h-3" /> Flight Number
            </label>
            <input 
              type="text" 
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="e.g. EK201"
              value={formData.flight_number}
              onChange={e => setFormData({...formData, flight_number: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <DoorOpen className="w-3 h-3" /> Boarding Gate
            </label>
            <input 
              type="text" 
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="e.g. B12"
              value={formData.gate_number}
              onChange={e => setFormData({...formData, gate_number: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-3 h-3" /> ETD Machines
            </label>
            <button 
              type="button"
              onClick={() => setFormData({...formData, use_manual_machine: !formData.use_manual_machine, selected_machine_ids: [], manual_machine_number: ''})}
              className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider"
            >
              {formData.use_manual_machine ? 'Select from list' : 'Enter manually'}
            </button>
          </div>
          
          {formData.use_manual_machine ? (
            <input 
              type="text" 
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="Enter Machine Number (e.g. ETD-999)"
              value={formData.manual_machine_number}
              onChange={e => setFormData({...formData, manual_machine_number: e.target.value})}
            />
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <select 
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all appearance-none pr-10"
                  value=""
                  onChange={e => {
                    const id = parseInt(e.target.value);
                    if (id) toggleMachine(id);
                  }}
                >
                  <option value="">+ Click to add machine(s)...</option>
                  {machines
                    .filter(m => !formData.selected_machine_ids.includes(m.id))
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.machine_number} {m.printer_status === 'not_working' ? '(PRINTER FAULTY)' : ''}
                      </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                  <PlusCircle className="w-4 h-4" />
                </div>
              </div>

              {formData.selected_machine_ids.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800">
                  {formData.selected_machine_ids.map(id => {
                    const m = machines.find(mach => mach.id === id);
                    if (!m) return null;
                    return (
                      <div 
                        key={id} 
                        className="flex items-center gap-2 bg-emerald-600 border border-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 animate-in zoom-in duration-200"
                      >
                        <span>{m.machine_number}</span>
                        <button 
                          type="button"
                          onClick={() => toggleMachine(id)}
                          className="hover:bg-white/20 p-0.5 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-600 italic ml-1">No machines selected yet. Pick one from the list above.</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <UsersIcon className="w-3 h-3" /> Personnel / Team
          </label>
          <input 
            type="text" 
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            placeholder="Name of person(s) at gate"
            value={formData.installed_by}
            onChange={e => setFormData({...formData, installed_by: e.target.value})}
          />
          
          {personnel.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2 ml-1">Quick Add from Directory</p>
              <div className="flex flex-wrap gap-2">
                {personnel.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPersonnelToTeam(p)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-300 transition-all flex items-center gap-2"
                  >
                    <span>{p.name}</span>
                    {p.phone_code && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">{p.phone_code}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <UsersIcon className="w-3 h-3" /> Personnel Count
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setFormData({...formData, guards_count: num.toString()})}
                className={`py-3 rounded-xl font-bold transition-all ${
                  formData.guards_count === num.toString()
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 text-lg"
          >
            {submitting ? 'Processing...' : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Confirm Deployment
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function LogHistory({ logs }: { logs: LogEntry[] }) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof LogEntry, direction: 'asc' | 'desc' }>({ key: 'installation_time', direction: 'desc' });
  
  const sortedLogs = [...logs].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filtered = sortedLogs.filter(l => {
    const fNum = l.flight_number || '';
    const gNum = l.gate_number || '';
    const mNum = l.machine_number || '';
    const query = search.toLowerCase();
    
    return fNum.toLowerCase().includes(query) ||
           gNum.toLowerCase().includes(query) ||
           mNum.toLowerCase().includes(query);
  });

  const requestSort = (key: keyof LogEntry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToExcel = () => {
    const headers = ['Flight', 'Gate', 'Machine', 'Personnel Count', 'Personnel / Team', 'Installation Time', 'Removed By', 'Removal Time', 'Status'];
    const rows = filtered.map(l => [
      l.flight_number, l.gate_number, l.machine_number, l.guards_count, l.installed_by, l.installation_time, l.removed_by || '', l.removal_time || '', l.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ETD_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Log History</h1>
          <p className="text-neutral-500">Complete archive of all machine movements</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search flight, gate, or machine..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            <Download className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-800/50">
                <th 
                  className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('flight_number')}
                >
                  Flight / Gate {sortConfig.key === 'flight_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('machine_number')}
                >
                  Machine / Guards {sortConfig.key === 'machine_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('installation_time')}
                >
                  Installation {sortConfig.key === 'installation_time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('removal_time')}
                >
                  Removal {sortConfig.key === 'removal_time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('status')}
                >
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{log.flight_number}</div>
                    <div className="text-xs text-neutral-500">Gate {log.gate_number}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3 h-3 text-emerald-500" />
                      <span className="text-neutral-300 font-medium">{log.machine_number}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1">
                      {log.guards_count} Personnel
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-neutral-300">{new Date(log.installation_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold">By {log.installed_by}</div>
                  </td>
                  <td className="p-4">
                    {log.removal_time ? (
                      <>
                        <div className="text-sm text-neutral-300">{new Date(log.removal_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold">By {log.removed_by}</div>
                      </>
                    ) : (
                      <span className="text-neutral-600 text-xs italic">Still active</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'installed' 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function Reports({ logs }: { logs: LogEntry[] }) {
  const stats = {
    total: logs.length,
    active: logs.filter(l => l.status === 'installed').length,
    completed: logs.filter(l => l.status === 'removed').length,
    avgGuards: (logs.reduce((acc, l) => acc + l.guards_count, 0) / logs.length || 0).toFixed(1)
  };

  const exportCSV = () => {
    const headers = ['ID', 'Flight', 'Gate', 'Machine', 'Personnel Count', 'Personnel / Team', 'Installation Time', 'Removed By', 'Removal Time', 'Status'];
    const rows = logs.map(l => [
      l.id, l.flight_number, l.gate_number, l.machine_number, l.guards_count, l.installed_by, l.installation_time, l.removed_by || '', l.removal_time || '', l.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ETD_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Operational Reports</h1>
          <p className="text-neutral-500">Analytics and data export for management</p>
        </div>
        <button 
          onClick={exportCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Deployments" value={stats.total} icon={<History className="text-blue-400" />} />
        <StatCard label="Active Now" value={stats.active} icon={<AlertCircle className="text-emerald-400" />} />
        <StatCard label="Completed Tasks" value={stats.completed} icon={<CheckCircle2 className="text-neutral-400" />} />
        <StatCard label="Avg Personnel/Gate" value={stats.avgGuards} icon={<UsersIcon className="text-purple-400" />} />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
        <h3 className="text-lg font-bold text-white mb-6">Recent Activity Trend</h3>
        <div className="h-64 flex items-end gap-2">
          {/* Simple visual representation of activity */}
          {Array.from({ length: 14 }).map((_, i) => {
            const height = Math.random() * 100 + 10;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 rounded-t-lg transition-all" 
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-neutral-600 font-bold uppercase">Day {i+1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-neutral-800 rounded-lg">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function AdminPanel({ machines, users, personnel, onUpdate }: { machines: Machine[], users: User[], personnel: Personnel[], onUpdate: () => void }) {
  const [newMachine, setNewMachine] = useState({
    machine_number: '',
    model: '',
    serial_number: '',
    manufacturer: '',
    printer_status: 'working'
  });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [newPersonnel, setNewPersonnel] = useState({ name: '', phone_code: '' });
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const addMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMachine)
    });
    setNewMachine({
      machine_number: '',
      model: '',
      serial_number: '',
      manufacturer: '',
      printer_status: 'working'
    });
    onUpdate();
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    setNewUser({ username: '', password: '', role: 'user' });
    onUpdate();
  };

  const addPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/personnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPersonnel)
    });
    setNewPersonnel({ name: '', phone_code: '' });
    onUpdate();
  };

  const updateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine) return;
    await fetch(`/api/machines/${editingMachine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingMachine)
    });
    setEditingMachine(null);
    onUpdate();
  };

  const updatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersonnel) return;
    await fetch(`/api/personnel/${editingPersonnel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingPersonnel)
    });
    setEditingPersonnel(null);
    onUpdate();
  };

  const deleteMachine = async (id: number) => {
    if (!confirm('Are you sure you want to delete this machine?')) return;
    const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
    if (res.ok) onUpdate();
    else {
      const data = await res.json();
      alert(data.error || 'Failed to delete machine');
    }
  };

  const togglePrinterStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'working' ? 'not_working' : 'working';
    await fetch(`/api/machines/${id}/printer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_status: newStatus })
    });
    onUpdate();
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) onUpdate();
  };

  const deletePersonnel = async (id: number) => {
    if (!confirm('Are you sure you want to delete this personnel?')) return;
    const res = await fetch(`/api/personnel/${id}`, { method: 'DELETE' });
    if (res.ok) onUpdate();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
        <p className="text-neutral-500">Manage infrastructure and personnel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Machine Management */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-500" /> Machine Inventory
          </h2>
          
          <form onSubmit={addMachine} className="space-y-3">
            <input 
              type="text" 
              placeholder="Machine ID (e.g. ETD-021)"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
              value={newMachine.machine_number}
              onChange={e => setNewMachine({...newMachine, machine_number: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Model"
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newMachine.model}
                onChange={e => setNewMachine({...newMachine, model: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Serial Number"
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newMachine.serial_number}
                onChange={e => setNewMachine({...newMachine, serial_number: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Manufacturer"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newMachine.manufacturer}
                onChange={e => setNewMachine({...newMachine, manufacturer: e.target.value})}
              />
              <select
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newMachine.printer_status}
                onChange={e => setNewMachine({...newMachine, printer_status: e.target.value})}
              >
                <option value="working">Printer OK</option>
                <option value="not_working">Printer Faulty</option>
              </select>
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all">
                Add
              </button>
            </div>
          </form>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {machines.map(m => (
              <div key={m.id} className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 group">
                {editingMachine?.id === m.id ? (
                  <form onSubmit={updateMachine} className="space-y-2">
                    <input 
                      type="text" 
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white"
                      value={editingMachine.machine_number}
                      onChange={e => setEditingMachine({...editingMachine, machine_number: e.target.value})}
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Model"
                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={editingMachine.model || ''}
                        onChange={e => setEditingMachine({...editingMachine, model: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Serial"
                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={editingMachine.serial_number || ''}
                        onChange={e => setEditingMachine({...editingMachine, serial_number: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Manufacturer"
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={editingMachine.manufacturer || ''}
                        onChange={e => setEditingMachine({...editingMachine, manufacturer: e.target.value})}
                      />
                      <button type="submit" className="p-1.5 bg-emerald-600 rounded-lg text-white">
                        <Check className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditingMachine(null)} className="p-1.5 bg-neutral-700 rounded-lg text-neutral-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{m.machine_number}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          m.status === 'available' ? 'text-emerald-500 bg-emerald-500/10' : 'text-blue-400 bg-blue-400/10'
                        }`}>
                          {m.status}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          m.printer_status === 'working' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-400 bg-red-400/10'
                        }`}>
                          Printer: {m.printer_status === 'working' ? 'OK' : 'Faulty'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => setEditingMachine(m)}
                          className="p-1.5 text-neutral-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Edit Machine"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => togglePrinterStatus(m.id, m.printer_status)}
                          className={`p-1.5 rounded-lg transition-all ${
                            m.printer_status === 'working' ? 'text-neutral-500 hover:text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          title={m.printer_status === 'working' ? 'Mark Printer as Faulty' : 'Mark Printer as Working'}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteMachine(m.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Machine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {(m.model || m.manufacturer) && (
                      <div className="text-[10px] text-neutral-500 flex gap-2">
                        {m.model && <span>Model: {m.model}</span>}
                        {m.manufacturer && <span>By: {m.manufacturer}</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Management */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-emerald-500" /> Staff Accounts
          </h2>

          <form onSubmit={addUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Username"
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newUser.username}
                onChange={e => setNewUser({...newUser, username: e.target.value})}
              />
              <input 
                type="password" 
                placeholder="Password"
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as any})}
              >
                <option value="user">Operator (User)</option>
                <option value="admin">Supervisor (Admin)</option>
              </select>
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-xl transition-all">
                Create
              </button>
            </div>
          </form>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {users.map(u => (
              <div key={u.id} className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-300">{u.username}</span>
                    <span className="text-[10px] font-bold uppercase text-neutral-500">
                      {u.role}
                    </span>
                  </div>
                </div>
                {u.username !== 'admin' && (
                  <button 
                    onClick={() => deleteUser(u.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Personnel Directory */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" /> Personnel Directory
          </h2>

          <form onSubmit={addPersonnel} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Guard Name"
                required
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newPersonnel.name}
                onChange={e => setNewPersonnel({...newPersonnel, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Phone Code (e.g. Atl)"
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={newPersonnel.phone_code}
                onChange={e => setNewPersonnel({...newPersonnel, phone_code: e.target.value})}
              />
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-xl transition-all">
              Add to Directory
            </button>
          </form>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {personnel.map(p => (
              <div key={p.id} className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 group">
                {editingPersonnel?.id === p.id ? (
                  <form onSubmit={updatePersonnel} className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1 text-sm text-white"
                      value={editingPersonnel.name}
                      onChange={e => setEditingPersonnel({...editingPersonnel, name: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      className="w-24 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1 text-sm text-white"
                      value={editingPersonnel.phone_code || ''}
                      onChange={e => setEditingPersonnel({...editingPersonnel, phone_code: e.target.value})}
                      placeholder="Code"
                    />
                    <button type="submit" className="p-1.5 bg-emerald-600 rounded-lg text-white">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setEditingPersonnel(null)} className="p-1.5 bg-neutral-700 rounded-lg text-neutral-300">
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-300">{p.name}</span>
                        {p.phone_code && (
                          <span className="text-[10px] font-bold uppercase text-emerald-500">
                            Code: {p.phone_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setEditingPersonnel(p)}
                        className="p-1.5 text-neutral-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                        title="Edit Personnel"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deletePersonnel(p.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Personnel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
