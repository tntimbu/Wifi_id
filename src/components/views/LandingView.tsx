import React, { useState } from 'react';
import { Wifi, Zap, Clock, HardDrive, Check, ArrowRight, Shield, Wallet, Sparkles, AlertCircle } from 'lucide-react';
import { PaketKuota, KonfigurasiWifi, UserProfile, MetodePembayaran, PageView } from '../../types';

interface LandingViewProps {
  wifiConfig: KonfigurasiWifi;
  packages: PaketKuota[];
  currentUser: UserProfile | null;
  onSelectPackage: (paket: PaketKuota, metode: MetodePembayaran) => Promise<void>;
  onNavigate: (page: PageView) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  wifiConfig,
  packages,
  currentUser,
  onSelectPackage,
  onNavigate
}) => {
  const [selectedPaket, setSelectedPaket] = useState<PaketKuota | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [loginRequiredModalOpen, setLoginRequiredModalOpen] = useState(false);
  const [selectedMetode, setSelectedMetode] = useState<MetodePembayaran>('saldo');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardClick = (paket: PaketKuota) => {
    setSelectedPaket(paket);
    if (!currentUser) {
      setLoginRequiredModalOpen(true);
    } else {
      setPaymentModalOpen(true);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPaket) return;
    setIsProcessing(true);
    await onSelectPackage(selectedPaket, selectedMetode);
    setIsProcessing(false);
    setPaymentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      
      {/* Hero Banner (Captive Portal Header) */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-center border-b border-slate-800">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Wifi className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Terhubung ke WiFi: <strong>{wifiConfig.nama_wifi}</strong></span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Akses Internet Cepat <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Tanpa Registrasi Ribet
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {wifiConfig.welcome_message}
          </p>

          {/* User Status Bar if Logged In */}
          {currentUser && (
            <div className="pt-2">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
                <span>Halo, <strong>{currentUser.nama}</strong></span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Wallet className="w-3.5 h-3.5" /> Rp {currentUser.saldo.toLocaleString('id-ID')}
                </span>
                <button
                  onClick={() => onNavigate('topup')}
                  className="ml-2 text-blue-400 hover:underline text-xs font-semibold"
                >
                  + Top Up
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Main Quota Packages Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Pilih Paket Kuota Internet
            </h2>
            <p className="text-xs text-slate-400">Pilih paket sesuai durasi dan kuota yang Anda butuhkan</p>
          </div>

          {!currentUser && (
            <button
              onClick={() => onNavigate('login-register')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
            >
              Sudah Memiliki Akun? Login
            </button>
          )}
        </div>

        {packages.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            Belum ada paket kuota aktif. Silakan hubungi admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {packages.map((pkg) => {
              const isUnlimited = pkg.batas_mb === 0;
              return (
                <div
                  key={pkg.id}
                  className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        {pkg.kecepatan}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {pkg.durasi_jam} Jam
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                      {pkg.nama}
                    </h3>

                    {/* Quota Highlight */}
                    <div className="my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                      <span className="block text-2xl font-black text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text">
                        {isUnlimited ? 'UNLIMITED' : `${(pkg.batas_mb / 1000).toFixed(0)} GB`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isUnlimited ? 'Akses Tanpa Batas Kuota' : `Kuota Utama ${pkg.batas_mb.toLocaleString('id-ID')} MB`}
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2 text-xs text-slate-300 mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Speed s/d {pkg.kecepatan}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Masa aktif {pkg.durasi_jam} jam penuh
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Auto connect & tanpa lag
                      </li>
                    </ul>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 block">Harga Paket</span>
                      <span className="text-xl font-extrabold text-white">
                        Rp {pkg.harga.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCardClick(pkg)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Pilih Paket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Login Required Modal for Guests */}
      {loginRequiredModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Masuk / Daftar Terlebih Dahulu</h3>
            <p className="text-xs text-slate-300">
              Untuk mengaktifkan paket <strong className="text-blue-400">{selectedPaket?.nama}</strong>, Anda perlu masuk ke akun Anda.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setLoginRequiredModalOpen(false);
                  onNavigate('login-register');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
              >
                Lanjut Login / Register
              </button>
              <button
                onClick={() => setLoginRequiredModalOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal for Logged In Customers */}
      {paymentModalOpen && selectedPaket && currentUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-5">
            
            <div>
              <h3 className="text-lg font-bold">Konfirmasi Pembelian Kuota</h3>
              <p className="text-xs text-slate-400">Rincian transaksi paket internet Anda</p>
            </div>

            {/* Package Summary Box */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Nama Paket:</span>
                <span className="font-bold text-white">{selectedPaket.nama}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Durasi:</span>
                <span className="font-semibold text-slate-200">{selectedPaket.durasi_jam} Jam</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Kuota Data:</span>
                <span className="font-semibold text-slate-200">
                  {selectedPaket.batas_mb === 0 ? 'Unlimited' : `${(selectedPaket.batas_mb / 1000).toFixed(0)} GB`}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-800 text-base">
                <span className="font-bold text-slate-300">Total Harga:</span>
                <span className="font-extrabold text-emerald-400">Rp {selectedPaket.harga.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Pilih Metode Pembayaran</label>
              
              <div className="space-y-2">
                {/* Method 1: Saldo Internal */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'saldo' ? 'bg-blue-600/10 border-blue-500/80 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value="saldo"
                      checked={selectedMetode === 'saldo'}
                      onChange={() => setSelectedMetode('saldo')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="block text-xs font-bold">Saldo Internal</span>
                      <span className="text-[10px] text-slate-400">
                        Saldo Anda: Rp {currentUser.saldo.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  {currentUser.saldo < selectedPaket.harga && (
                    <span className="text-[10px] text-rose-400 font-bold">Saldo kurang</span>
                  )}
                </label>

                {/* Method 2: QRIS / E-Wallet */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'qris' ? 'bg-blue-600/10 border-blue-500/80 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value="qris"
                      checked={selectedMetode === 'qris'}
                      onChange={() => setSelectedMetode('qris')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="block text-xs font-bold">QRIS / E-Wallet (Simulasi)</span>
                      <span className="text-[10px] text-slate-400">Gopay, OVO, ShopeePay, Dana</span>
                    </div>
                  </div>
                </label>

                {/* Method 3: Transfer Bank */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'transfer' ? 'bg-blue-600/10 border-blue-500/80 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value="transfer"
                      checked={selectedMetode === 'transfer'}
                      onChange={() => setSelectedMetode('transfer')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="block text-xs font-bold">Transfer Bank (Simulasi)</span>
                      <span className="text-[10px] text-slate-400">BCA, Mandiri, BRI, BNI</span>
                    </div>
                  </div>
                </label>

                {/* Method 4: Cash */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'cash' ? 'bg-blue-600/10 border-blue-500/80 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={selectedMetode === 'cash'}
                      onChange={() => setSelectedMetode('cash')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="block text-xs font-bold">Tunai (Cash ke Admin)</span>
                      <span className="text-[10px] text-slate-400">Bayar langsung di kasir/admin</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Bayar & Aktifkan'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
