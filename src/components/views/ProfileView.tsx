import React from 'react';
import { User, Mail, Phone, ShieldCheck, Wallet, Calendar, PlusCircle } from 'lucide-react';
import { UserProfile, PageView } from '../../types';

interface ProfileViewProps {
  currentUser: UserProfile;
  onNavigate: (page: PageView) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-blue-500/20">
          {currentUser.nama.charAt(0).toUpperCase()}
        </div>
        
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold">{currentUser.nama}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-400">{currentUser.email}</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-semibold">Saldo Akun Anda</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              Rp {currentUser.saldo.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('topup')}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Top Up Saldo
        </button>
      </div>

      {/* Profile Information List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold border-b border-slate-800 pb-3">Detail Informasi Pengguna</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <User className="w-3.5 h-3.5 text-blue-400" /> Nama Lengkap
            </span>
            <p className="text-sm font-bold text-white">{currentUser.nama}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Mail className="w-3.5 h-3.5 text-blue-400" /> Alamat Email
            </span>
            <p className="text-sm font-bold text-white">{currentUser.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Phone className="w-3.5 h-3.5 text-blue-400" /> Nomor Handphone / WA
            </span>
            <p className="text-sm font-bold text-white">{currentUser.no_hp || '-'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Tanggal Bergabung
            </span>
            <p className="text-sm font-bold text-white">
              {new Date(currentUser.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
