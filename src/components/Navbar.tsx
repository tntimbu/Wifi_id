import React, { useState } from 'react';
import { Wifi, LayoutDashboard, ShoppingCart, History, User, Wallet, ShieldAlert, LogOut, Menu, X, PlusCircle } from 'lucide-react';
import { UserProfile, PageView } from '../types';

interface NavbarProps {
  currentUser: UserProfile | null;
  activePage: PageView;
  wifiName: string;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activePage,
  wifiName,
  onNavigate,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: PageView) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & WiFi Indicator */}
        <div 
          onClick={() => handleNavClick(currentUser ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              {wifiName || 'Wifi-Kuota'}
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Hotspot Portal
            </span>
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-1">
          {currentUser ? (
            <>
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'dashboard' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => handleNavClick('marketplace')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'marketplace' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Beli Kuota
              </button>

              <button
                onClick={() => handleNavClick('riwayat')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'riwayat' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <History className="w-4 h-4" />
                Riwayat
              </button>

              <button
                onClick={() => handleNavClick('profil')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'profil' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <User className="w-4 h-4" />
                Profil
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePage === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick('landing')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'landing' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Captive Portal
              </button>
              <button
                onClick={() => handleNavClick('login-register')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
              >
                Masuk / Daftar
              </button>
            </>
          )}
        </nav>

        {/* User Balance & Actions */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-3">
            <div 
              onClick={() => handleNavClick('topup')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-blue-500/50 cursor-pointer transition-all group"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <div className="text-right">
                <span className="block text-[10px] text-slate-400">Saldo</span>
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                  Rp {currentUser.saldo.toLocaleString('id-ID')}
                </span>
              </div>
              <PlusCircle className="w-3.5 h-3.5 text-blue-400 ml-1 group-hover:scale-110 transition-transform" />
            </div>

            <button
              onClick={onLogout}
              title="Keluar"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          {currentUser && (
            <div 
              onClick={() => handleNavClick('topup')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-300"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              Rp {currentUser.saldo.toLocaleString('id-ID')}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2">
          {currentUser ? (
            <>
              <button
                onClick={() => handleNavClick('dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" /> Dashboard
              </button>
              <button
                onClick={() => handleNavClick('marketplace')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                <ShoppingCart className="w-4 h-4 text-blue-400" /> Beli Kuota
              </button>
              <button
                onClick={() => handleNavClick('riwayat')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                <History className="w-4 h-4 text-blue-400" /> Riwayat
              </button>
              <button
                onClick={() => handleNavClick('topup')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-emerald-300 hover:bg-slate-800"
              >
                <Wallet className="w-4 h-4 text-emerald-400" /> Top Up Saldo
              </button>
              <button
                onClick={() => handleNavClick('profil')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                <User className="w-4 h-4 text-blue-400" /> Profil Saya
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-amber-300 hover:bg-slate-800"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Admin Panel
                </button>
              )}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick('landing')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                Captive Portal
              </button>
              <button
                onClick={() => handleNavClick('login-register')}
                className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white"
              >
                Masuk / Daftar
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
