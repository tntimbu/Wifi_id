import React, { useState } from 'react';
import { Wifi, Mail, Lock, User, Phone, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { PageView } from '../../types';

interface LoginRegisterProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  onRegister: (email: string, pass: string, nama: string, noHp: string) => Promise<{ success: boolean; message?: string }>;
  onNavigate: (page: PageView) => void;
  isLoading: boolean;
}

export const LoginRegisterView: React.FC<LoginRegisterProps> = ({
  onLogin,
  onRegister,
  onNavigate,
  isLoading
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegister) {
      if (!nama || !email || !password || !noHp) {
        setErrorMsg('Semua kolom harus diisi.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal harus 6 karakter.');
        return;
      }
      const res = await onRegister(email, password, nama, noHp);
      if (!res.success) {
        setErrorMsg(res.message || 'Pendaftaran gagal.');
      }
    } else {
      if (!email || !password) {
        setErrorMsg('Email dan Password wajib diisi.');
        return;
      }
      const res = await onLogin(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Login gagal.');
      }
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@wifikota.com');
    setPassword('Admin123!');
    setIsRegister(false);
  };

  const fillDemoUser = () => {
    setEmail('customer@wifikota.com');
    setPassword('Customer123!');
    setIsRegister(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-4">
            <Wifi className="w-8 h-8 animate-bounce" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
            Wifi-Kuota Premium
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isRegister ? 'Buat akun baru untuk membeli paket internet' : 'Masuk ke portal hotspot wifi untuk mengaktifkan kuota'}
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              !isRegister ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              isRegister ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp / HP</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? 'Buat Akun Sekarang' : 'Masuk ke Portal'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Fill Buttons for Testing */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-center text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">
            Akses Cepat Pengujian Demo
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-xs font-medium rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Login Admin
            </button>
            <button
              type="button"
              onClick={fillDemoUser}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-300 text-xs font-medium rounded-lg transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" /> Login Customer
            </button>
          </div>
        </div>

        {/* Back to Landing Page */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
          >
            ← Kembali ke Captive Portal (Halaman Awal WiFi)
          </button>
        </div>

      </div>
    </div>
  );
};
