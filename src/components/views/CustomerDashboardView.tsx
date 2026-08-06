import React, { useState, useEffect } from 'react';
import { Wifi, Clock, HardDrive, Zap, RefreshCw, ShoppingCart, History, ArrowUpRight, Play, Square, Bell, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaksi, UserProfile, PageView, NotifikasiItem } from '../../types';
import { simulateUsage } from '../../services/wifiService';

interface CustomerDashboardProps {
  currentUser: UserProfile;
  activeTransaction: Transaksi | null;
  recentTransactions: Transaksi[];
  notifications: NotifikasiItem[];
  onNavigate: (page: PageView) => void;
  onRefresh: () => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardProps> = ({
  currentUser,
  activeTransaction,
  recentTransactions,
  notifications,
  onNavigate,
  onRefresh
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [chartData, setChartData] = useState<{ time: string; mb: number }[]>([]);

  // Countdown Timer calculation
  useEffect(() => {
    if (!activeTransaction || activeTransaction.status !== 'aktif') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(activeTransaction.waktu_berakhir).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onRefresh();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTransaction, onRefresh]);

  // Traffic usage simulation ticker (e.g. consumes ~20MB every 5 seconds when active)
  useEffect(() => {
    let interval: any = null;
    if (isSimulating && activeTransaction && activeTransaction.status === 'aktif') {
      interval = setInterval(async () => {
        const consumedMb = Math.floor(10 + Math.random() * 25); // 10-35 MB random consumption
        await simulateUsage(activeTransaction.id, currentUser.uid, consumedMb);
        
        // Add to live usage chart
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setChartData(prev => [...prev.slice(-9), { time: timeStr, mb: consumedMb }]);

        onRefresh();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, activeTransaction, currentUser, onRefresh]);

  // Generate mock chart data if empty
  useEffect(() => {
    if (chartData.length === 0) {
      const mock = [
        { time: '10:00', mb: 12 },
        { time: '10:05', mb: 45 },
        { time: '10:10', mb: 30 },
        { time: '10:15', mb: 85 },
        { time: '10:20', mb: 60 },
        { time: '10:25', mb: 110 },
      ];
      setChartData(mock);
    }
  }, [chartData.length]);

  const isUnlimited = activeTransaction ? activeTransaction.batas_mb === 0 : false;
  const quotaUsedPercent = activeTransaction && !isUnlimited && activeTransaction.batas_mb > 0
    ? Math.min(100, Math.max(0, ((activeTransaction.batas_mb - activeTransaction.sisa_kuota_mb) / activeTransaction.batas_mb) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <Wifi className="w-4 h-4 animate-pulse" />
            <span>Connected Hotspot Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Selamat Datang, <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{currentUser.nama}</span> 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Status koneksi Anda dipantau secara real-time melalui sistem Firebase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Saldo Utama</span>
            <span className="text-lg font-bold text-emerald-400">
              Rp {currentUser.saldo.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={() => onNavigate('topup')}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" /> Top Up
          </button>
        </div>
      </div>

      {/* Main Quota Status Card */}
      {activeTransaction && activeTransaction.status === 'aktif' ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            
            {/* Status & Package Title */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Akses WiFi Aktif
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {activeTransaction.paket_nama}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kecepatan Maksimal: <span className="text-blue-400 font-semibold">{activeTransaction.durasi_jam} Jam ({activeTransaction.batas_mb === 0 ? 'Unlimited' : 'Speed Limit'})</span>
              </p>
            </div>

            {/* Countdown Digital Clock */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center gap-3 shadow-inner">
              <Clock className="w-8 h-8 text-indigo-400 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Sisa Waktu Akses
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-widest text-indigo-300">
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>

          </div>

          {/* Quota Progress Bar & Stats */}
          <div className="py-6 space-y-3">
            <div className="flex justify-between items-end text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <HardDrive className="w-4 h-4 text-blue-400" />
                Sisa Kuota Internet:
              </span>
              <span className="text-base font-extrabold text-white">
                {isUnlimited ? (
                  <span className="text-emerald-400">UNLIMITED</span>
                ) : (
                  <>
                    <strong className="text-blue-400">{(activeTransaction.sisa_kuota_mb / 1000).toFixed(2)} GB</strong> / {(activeTransaction.batas_mb / 1000).toFixed(0)} GB
                  </>
                )}
              </span>
            </div>

            {!isUnlimited && (
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    quotaUsedPercent > 90 ? 'bg-rose-500' : quotaUsedPercent > 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${100 - quotaUsedPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Interactive Simulation Control & Extend Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isSimulating
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isSimulating ? 'Stop Simulasi Pemakaian Data' : 'Simulasi Pakai Kuota (Test Traffic)'}
            </button>

            <button
              onClick={() => onNavigate('marketplace')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Perpanjang Kuota Now
            </button>
          </div>

        </div>
      ) : (
        /* Empty / Expired Quota Card */
        <div className="p-8 sm:p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <Wifi className="w-8 h-8 opacity-60" />
          </div>
          <h2 className="text-xl font-bold text-white">Tidak Ada Paket Kuota Aktif</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Anda belum memiliki paket kuota yang aktif atau masa berlaku paket sebelumnya sudah berakhir. Pilih paket sekarang untuk terhubung ke internet.
          </p>
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 inline-flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Beli Paket Kuota Sekarang
          </button>
        </div>
      )}

      {/* Grid Section: Realtime Usage Chart & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Realtime Usage Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Grafik Pemakaian Data (MB)
              </h3>
              <p className="text-[11px] text-slate-400">Realtime data throughput bandwidth monitoring</p>
            </div>
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="mb" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#usageGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-blue-400" /> Notifikasi Sistem
            </h3>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">Belum ada notifikasi.</p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="block text-xs font-bold text-blue-300">{notif.judul}</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{notif.pesan}</p>
                    <span className="block text-[9px] text-slate-500">
                      {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('riwayat')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
          >
            Lihat Riwayat Transaksi <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" /> 5 Transaksi Terakhir
          </h3>
          <button
            onClick={() => onNavigate('riwayat')}
            className="text-xs font-semibold text-blue-400 hover:underline"
          >
            Lihat Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Paket</th>
                <th className="p-3">Harga</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-xl">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">Belum ada transaksi.</td>
                </tr>
              ) : (
                recentTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{tx.paket_nama}</td>
                    <td className="p-3">Rp {tx.harga.toLocaleString('id-ID')}</td>
                    <td className="p-3 uppercase text-[10px] text-slate-400">{tx.metode_pembayaran}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'aktif'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : tx.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
