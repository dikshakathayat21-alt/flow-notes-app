/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  LogOut, 
  ArrowRight, 
  StickyNote, 
  CheckSquare,
  ChevronRight,
  Home,
  FileText,
  Settings,
  Search
} from 'lucide-react';
import { supabase } from './supabaseClient';

type ItemType = 'note' | 'todo';

interface Item {
  id: number;
  content: string;
  type: ItemType;
  completed: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
}

type View = 'landing' | 'signup' | 'dashboard' | 'google-auth';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemType, setNewItemType] = useState<ItemType>('todo');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editContent, setEditContent] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const userData = { id: session.user.id, email: session.user.email || '' };
        setUser(userData as any);
        localStorage.setItem('flow_user', JSON.stringify(userData));
        setView('dashboard');
      } else {
        setUser(null);
        localStorage.removeItem('flow_user');
        if (view === 'dashboard') setView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [view]);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Failed to fetch items', err);
    }
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    setError('');
    setSuccessMessage('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      let result;
      if (type === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      const { data, error: authError } = result;

      if (authError) {
        setError(authError.message);
        return;
      }

      if (type === 'signup') {
        if (!data.session) {
          setSuccessMessage('Your account has been created. Please check your email and verify your address before logging in.');
          setPassword('');
          setView('landing');
          return;
        }
      }

      if (data.session && data.user) {
        const userData = { id: data.user.id, email: data.user.email || '' };
        setUser(userData as any);
        localStorage.setItem('flow_user', JSON.stringify(userData));
        setView('dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemContent.trim() || !user || isAdding) return;

    setError('');
    setIsAdding(true);
    try {
      const { data, error: insertError } = await supabase
        .from('items')
        .insert([
          { 
            user_id: user.id, 
            content: newItemContent, 
            type: newItemType,
            completed: false
          }
        ])
        .select();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw insertError;
      }
      
      if (data && data.length > 0) {
        setItems([data[0], ...items]);
        setNewItemContent('');
        if (activeTab === 'home') setActiveTab('notes');
      }
    } catch (err: any) {
      console.error('Failed to add item:', err);
      setError(`failed to add item: ${err.message || 'unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const updateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editContent.trim()) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .update({ content: editContent })
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setItems(items.map(item => item.id === data.id ? data : item));
        setEditingItem(null);
        setEditContent('');
      }
    } catch (err) {
      console.error('Failed to update item', err);
    }
  };

  const toggleComplete = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setItems(items.map(item => item.id === id ? { ...item, completed: !currentStatus } : item));
    } catch (err) {
      console.error('Failed to update item', err);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('flow_user');
    setView('landing');
    setEmail('');
    setPassword('');
  };

  const renderLanding = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 bg-white"
    >
      <div className="w-full max-w-[320px] flex flex-col items-center">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif tracking-tight mb-2">flow</h1>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-4">
            {successMessage && (
              <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl">
                <p className="text-[10px] text-black font-light leading-relaxed text-center tracking-tight">
                  {successMessage}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-light">email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-neutral-100 py-2 focus:border-black outline-none transition-colors text-sm rounded-none font-light"
                placeholder="hello@flow.com"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-light">password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-neutral-100 py-2 focus:border-black outline-none transition-colors text-sm rounded-none font-light"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-[10px] text-red-500 text-center font-light">{error}</p>}

            <button 
              onClick={() => handleAuth('login')}
              className="w-full py-3 bg-black text-white rounded-full text-xs font-light tracking-tight hover:bg-neutral-800 transition-colors"
            >
              sign in
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-neutral-50"></div>
            <span className="relative px-4 bg-white text-[10px] text-neutral-300 font-light">or</span>
          </div>

          <button 
            onClick={() => setView('google-auth')}
            className="w-full flex items-center justify-center gap-3 py-3 border border-black rounded-full hover:bg-black hover:text-white transition-all duration-300 group"
          >
            <svg className="w-4 h-4 group-hover:invert" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-xs font-light tracking-tight">continue with google</span>
          </button>

          <div className="text-center">
            <p className="text-[10px] text-neutral-400 font-light">
              don't have account? it's ok.{" "}
              <button 
                onClick={() => {
                  setView('signup');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-black font-light hover:underline"
              >
                create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderGoogleAuth = () => {
    const handleSelect = (email: string) => {
      const mockUser = { id: String(Math.floor(Math.random() * 1000)), email };
      setUser(mockUser);
      localStorage.setItem('flow_user', JSON.stringify(mockUser));
      setView('dashboard');
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-screen px-6 bg-neutral-50"
      >
        <div className="w-full max-w-[340px] bg-white p-8 rounded-[32px] shadow-sm border border-neutral-100 text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          
          <h2 className="text-lg font-light mb-1">sign in with google</h2>
          <p className="text-xs text-neutral-400 mb-8 font-light">to continue to flow</p>
          
          <div className="space-y-2 mb-8">
            <button 
              onClick={() => handleSelect('google.user@gmail.com')}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 border border-neutral-50 transition-colors text-left group"
            >
              <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-[10px] font-light">g</div>
              <div className="flex-1">
                <p className="text-xs font-light">google user</p>
                <p className="text-[10px] text-neutral-400 font-light">google.user@gmail.com</p>
              </div>
              <ChevronRight size={14} className="text-neutral-300 group-hover:text-black transition-colors" />
            </button>
          </div>

          <button 
            onClick={() => setView('landing')}
            className="text-[10px] text-neutral-400 hover:text-black transition-colors font-light"
          >
            cancel
          </button>
        </div>
      </motion.div>
    );
  };

  const renderAuthForm = (type: 'signup') => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 bg-white"
    >
      <button 
        onClick={() => setView('landing')}
        className="absolute top-8 left-8 text-neutral-400 hover:text-black transition-colors"
      >
        <ArrowRight className="rotate-180" size={24} />
      </button>

      <div className="max-w-[320px] w-full mx-auto">
        <h2 className="text-2xl font-serif tracking-tight mb-8 text-center">
          join flow
        </h2>
        
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] text-neutral-400 font-light">email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-neutral-100 py-2 focus:border-black outline-none transition-colors text-sm rounded-none font-light"
              placeholder="hello@flow.com"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-neutral-400 font-light">password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-neutral-100 py-2 focus:border-black outline-none transition-colors text-sm rounded-none font-light"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[10px] text-red-500 text-center font-light">{error}</p>}

          <button 
            onClick={() => handleAuth('signup')}
            className="w-full py-3 bg-black text-white rounded-full text-xs font-light tracking-tight hover:bg-neutral-800 transition-colors"
          >
            create account
          </button>

          <p className="text-center text-[10px] text-neutral-400 font-light">
            already have an account?{" "}
            <button 
              onClick={() => {
                setView('landing');
                setError('');
                setSuccessMessage('');
              }}
              className="text-black font-light hover:underline"
            >
              log in
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );

  const [activeTab, setActiveTab] = useState<'home' | 'notes' | 'settings'>('home');

  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [activeTab]);

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white text-black flex flex-col md:flex-row"
    >
      <aside className="hidden md:flex w-64 border-r border-neutral-100 flex-col p-8 fixed h-full">
        <div className="mb-12">
          <h1 className="text-2xl font-serif tracking-tight">flow</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: 'home', label: 'home', icon: <Home size={18} /> },
            { id: 'notes', label: 'my content', icon: <FileText size={18} /> },
            { id: 'settings', label: 'account', icon: <Settings size={18} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-light transition-all ${
                activeTab === item.id 
                  ? 'bg-black text-white' 
                  : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-neutral-100">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-light text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            sign out
          </button>
        </div>
      </aside>

      <header className="md:hidden px-4 py-3 flex justify-between items-center border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-lg font-serif tracking-tight">flow</h1>
        <div className="flex gap-1">
          <button onClick={() => setActiveTab('home')} className={`p-2 rounded-lg transition-colors ${activeTab === 'home' ? 'bg-black text-white' : 'text-neutral-400 hover:bg-neutral-50'}`}><Home size={18} /></button>
          <button onClick={() => setActiveTab('notes')} className={`p-2 rounded-lg transition-colors ${activeTab === 'notes' ? 'bg-black text-white' : 'text-neutral-400 hover:bg-neutral-50'}`}><FileText size={18} /></button>
          <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-black text-white' : 'text-neutral-400 hover:bg-neutral-50'}`}><Settings size={18} /></button>
        </div>
      </header>

      <main className="flex-1 md:ml-64 min-h-screen bg-neutral-50/30">
        <div className="hidden md:flex px-10 py-6 items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-neutral-50">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
            <input 
              type="text" 
              placeholder="search your thoughts..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-neutral-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-light"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-light">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-neutral-400 font-light">pro member</p>
            </div>
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-xs font-light">
              {user?.email?.[0]}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-10 py-4 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto space-y-4"
              >
                <div className="bg-white border border-neutral-100 rounded-[24px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                      <CheckSquare size={24} className="text-black" />
                    </div>
                    <h3 className="text-xl font-light mb-2">manage content</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed font-light">
                      access your full library, organize your thoughts, and track your progress.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('notes')}
                    className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full text-sm font-light hover:scale-105 transition-all shadow-lg shadow-black/5"
                  >
                    view all content
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Dashed Space - Updated to Black Bordered & Static */}
                <button 
                  onClick={() => setActiveTab('notes')}
                  className="w-full py-12 bg-white border border-dashed border-black rounded-[24px] flex flex-col items-center justify-center gap-4 text-black transition-all"
                >
                  <div className="w-16 h-16 rounded-full border border-black flex items-center justify-center bg-white">
                    <Plus size={32} />
                  </div>
                  <span className="text-sm font-light">create something new</span>
                </button>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-serif tracking-tight">my content</h2>
                  <p className="text-xs text-neutral-400 font-light mt-1">capture everything</p>
                </div>

                <form onSubmit={addItem} className="mb-8 space-y-3">
                  <div className="flex gap-2 mb-2">
                    <button 
                      type="button"
                      onClick={() => setNewItemType('todo')}
                      className={`flex-1 py-1.5 text-[10px] font-light border rounded-full transition-all ${newItemType === 'todo' ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'}`}
                    >
                      to-do
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewItemType('note')}
                      className={`flex-1 py-1.5 text-[10px] font-light border rounded-full transition-all ${newItemType === 'note' ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'}`}
                    >
                      note
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      value={newItemContent}
                      onChange={(e) => setNewItemContent(e.target.value)}
                      placeholder={newItemType === 'todo' ? "what needs to be done?" : "jot something down..."}
                      className="w-full py-3 px-5 bg-white border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-black text-sm transition-all shadow-sm font-light"
                    />
                    <button 
                      type="submit"
                      disabled={isAdding}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black text-white rounded-lg transition-all ${isAdding ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                    >
                      {isAdding ? (
                        <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                  </div>
                </form>

                <div className="relative space-y-3">
                  <AnimatePresence mode="popLayout">
                    {items.filter(item => item.type === newItemType).length === 0 ? (
                      <motion.div className="text-center py-16 text-neutral-300">
                        <p className="text-sm italic font-light">empty space. add something.</p>
                      </motion.div>
                    ) : (
                      items.filter(item => item.type === newItemType).map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          className="group relative flex items-start gap-3 p-4 bg-white border border-neutral-100 rounded-xl hover:shadow-sm transition-all"
                        >
                          {item.type === 'todo' ? (
                            <button onClick={() => toggleComplete(item.id, item.completed)} className="mt-0.5 text-neutral-400 hover:text-black transition-colors bg-white z-10">
                              {item.completed ? <CheckCircle2 size={18} className="text-black" /> : <Circle size={18} />}
                            </button>
                          ) : (
                            <div className="mt-0.5 text-neutral-400 bg-white z-10">
                              <StickyNote size={18} />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed font-light ${item.completed ? 'text-neutral-300 line-through' : 'text-black'}`}>
                              {item.content}
                            </p>
                          </div>
                          <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-red-500 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto"
              >
                <h2 className="text-2xl font-serif tracking-tight mb-6">account</h2>
                <div className="bg-white border border-neutral-100 rounded-[24px] p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-xl font-light">
                      {user?.email?.[0]}
                    </div>
                    <div>
                      <p className="text-lg font-light">{user?.email}</p>
                      <p className="text-xs text-neutral-400 font-light">member since march 2026</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {view === 'landing' && renderLanding()}
        {view === 'signup' && renderAuthForm('signup')}
        {view === 'google-auth' && renderGoogleAuth()}
        {view === 'dashboard' && renderDashboard()}
      </AnimatePresence>
    </div>
  );
}