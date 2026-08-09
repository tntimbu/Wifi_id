import React, { useState } from 'react';
import {
  Wallet, QrCode, Building2, Smartphone, Copy, Check, ArrowRight,
  ShieldCheck, Info, CheckCircle2, Receipt
} from 'lucide-react';
import { UserProfile, KonfigurasiWifi } from '../../types';
import { DEFAULT_PAYMENT_CONFIG } from '../../services/wifiService';

interface TopUpViewProps {
  currentUser: UserProfile;
  wifiConfig: KonfigurasiWifi;
  onTopUp: (amount: number) => Promise<void>;
}

export const TopUpView: React.FC<TopUpViewProps> = ({ currentUser, wifiConfig, onTopUp }) => {
  const [amount, setAmount] = useState<number>(20000);
  const [method, setMethod] = useState<'qris' | 'va' | 'ewallet'>('qris');
  
  // Selected Sub-Category
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [selectedEwallet, setSelectedEwallet] = useState<string>('GoPay');
  
  const [transferRef, setTransferRef] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTxId, setLastTxId] = useState('');

  const paymentConfig = wifiConfig.pembayaran || DEFAULT_PAYMENT_CONFIG;

  const nominalOptions = [10000, 20000, 50000, 100000, 200000];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsLoading(true);
    await onTopUp(amount);
    setIsLoading(false);

    const generatedId = `TOPUP-${Math.floor(100000 + Math.random() * 900000)}`;
    setLastTxId(generatedId);
    setShowReceipt(true);
  };

  // Get active VA Account
  const activeVa = paymentConfig.va_accounts.find(v => v.bank === selectedBank) || paymentConfig.va_accounts[0];
  // Get active E-Wallet Account
  const activeEwallet = paymentConfig.ewallet_accounts.find(e => e.provider === selectedEwallet) || paymentConfig.ewallet_accounts[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Isi Saldo Hotspot (Top Up)</h1>
            <p className="text-xs text-slate-400">Pilih metode pembayaran via QRIS, Virtual Account, atau E-Wallet</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right w-full sm:w-auto">
          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Saldo Anda Saat Ini</span>
          <span className="text-2xl font-black text-emerald-400">
            Rp {currentUser.saldo.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Main Top Up Form */}
      <form onSubmit={handleTopUpSubmit} className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-8 shadow-xl">
        
        {/* Step 1: Nominal Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <label className="text-sm font-bold text-slate-200">Pilih Nominal Top Up</label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {nominalOptions.map((nom) => (
              <button
                type="button"
                key={nom}
                onClick={() => setAmount(nom)}
                className={`py-3 px-3 rounded-xl border text-xs font-extrabold transition-all duration-200 ${
                  amount === nom
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                Rp {nom.toLocaleString('id-ID')}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Atau Masukkan Nominal Kustom (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min={5000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-base font-extrabold text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Nominal..."
              />
            </div>
          </div>
        </div>

        {/* Step 2: Payment Method Category */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            <label className="text-sm font-bold text-slate-200">Pilih Metode Pembayaran</label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* QRIS Category */}
            <button
              type="button"
              onClick={() => setMethod('qris')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                method === 'qris'
                  ? 'bg-gradient-to-b from-blue-950/80 to-slate-900 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="block text-sm font-bold text-white mb-1">QRIS All Payment</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                GoPay, DANA, OVO, ShopeePay, LinkAja & Semua Mobile Banking
              </p>
            </button>

            {/* Virtual Account Category */}
            <button
              type="button"
              onClick={() => setMethod('va')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                method === 'va'
                  ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="block text-sm font-bold text-white mb-1">Virtual Account</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Transfer via Bank BCA, Mandiri, BRI, BNI
              </p>
            </button>

            {/* E-Wallet Category */}
            <button
              type="button"
              onClick={() => setMethod('ewallet')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                method === 'ewallet'
                  ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit mb-3">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="block text-sm font-bold text-white mb-1">E-Wallet Direct</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Transfer ke GoPay, DANA, ShopeePay, OVO
              </p>
            </button>

          </div>
        </div>

        {/* Step 3: Display Detailed Payment Card & Instructions */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6">
          
          {/* QRIS DETAILS */}
          {method === 'qris' && (
            <div className="space-y-5 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    {paymentConfig.qris_merchant_name}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">NMID: <strong className="text-slate-200">{paymentConfig.qris_nmid}</strong></p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Nominal Transfer</span>
                  <span className="text-2xl font-black text-emerald-400">Rp {amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-white rounded-2xl shadow-xl shrink-0">
                  <img
                    src={paymentConfig.qris_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=QRIS_WIFI_KOTA_${amount}`}
                    alt="QRIS Barcode"
                    className="w-48 h-48 object-contain"
                  />
                  <span className="block text-center text-[10px] font-bold text-slate-900 mt-2">SCAN QRIS DISINI</span>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" /> Cara Pembayaran QRIS:
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-400">
                    <li>Buka aplikasi E-Wallet (GoPay, DANA, OVO, ShopeePay) atau m-Banking Anda.</li>
                    <li>Pilih menu <strong>Scan / Bayar QRIS</strong> dan arahkan kamera ke barcode di samping.</li>
                    <li>Pastikan total pembayaran tepat <strong>Rp {amount.toLocaleString('id-ID')}</strong>.</li>
                    <li>Selesaikan transaksi dan tekan tombol <strong>Konfirmasi Pembayaran</strong> di bawah.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* VIRTUAL ACCOUNT DETAILS */}
          {method === 'va' && (
            <div className="space-y-5">
              
              {/* Bank Selector Tabs */}
              <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-800">
                {paymentConfig.va_accounts.map((va) => (
                  <button
                    type="button"
                    key={va.bank}
                    onClick={() => setSelectedBank(va.bank)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedBank === va.bank
                        ? 'bg-indigo-600 text-white border border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    Bank {va.bank}
                  </button>
                ))}
              </div>

              {/* Active VA Account Card */}
              {activeVa ? (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nomor Virtual Account {activeVa.bank}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xl font-mono font-black text-indigo-300 tracking-wider">
                          {activeVa.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeVa.account_number, 'va')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          {copiedField === 'va' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'va' ? 'Tersalin!' : 'Salin Nomor'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block">Nama Pemilik (a.n)</span>
                      <span className="text-sm font-bold text-white">{activeVa.account_name}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Pembayaran:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-400 text-base">Rp {amount.toLocaleString('id-ID')}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(amount.toString(), 'amount')}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Salin Nominal"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-400">Metode Virtual Account belum dikonfigurasi admin.</p>
              )}

            </div>
          )}

          {/* E-WALLET DETAILS */}
          {method === 'ewallet' && (
            <div className="space-y-5">
              
              {/* E-Wallet Provider Tabs */}
              <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-800">
                {paymentConfig.ewallet_accounts.map((ew) => (
                  <button
                    type="button"
                    key={ew.provider}
                    onClick={() => setSelectedEwallet(ew.provider)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedEwallet === ew.provider
                        ? 'bg-cyan-600 text-white border border-cyan-400 shadow-md shadow-cyan-600/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {ew.provider}
                  </button>
                ))}
              </div>

              {/* Active E-Wallet Card */}
              {activeEwallet ? (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nomor Akun {activeEwallet.provider}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xl font-mono font-black text-cyan-300 tracking-wider">
                          {activeEwallet.phone_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeEwallet.phone_number, 'ewallet')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          {copiedField === 'ewallet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'ewallet' ? 'Tersalin!' : 'Salin Nomor'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block">Nama Akun (a.n)</span>
                      <span className="text-sm font-bold text-white">{activeEwallet.account_name}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Nominal Transfer:</span>
                    <span className="font-extrabold text-emerald-400 text-base">Rp {amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-400">E-Wallet belum dikonfigurasi admin.</p>
              )}

            </div>
          )}

          {/* Notes / Instructions */}
          {paymentConfig.instructions && (
            <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
              💡 <strong>Catatan Admin:</strong> {paymentConfig.instructions}
            </p>
          )}

        </div>

        {/* Step 4: Transfer Reference & Submit */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan Pengirim / ID Referensi (Opsional)
            </label>
            <input
              type="text"
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              placeholder="Contoh: Transfer dari DANA A.N Budi / No Ref 882910"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || amount <= 0}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Saya Sudah Transfer — Konfirmasi Top Up Rp {amount.toLocaleString('id-ID')}</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Success Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-6 shadow-2xl relative">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white">Top Up Saldo Berhasil!</h3>
              <p className="text-xs text-slate-400">
                Pembayaran Anda telah diterima dan saldo sebesar <strong className="text-emerald-400">Rp {amount.toLocaleString('id-ID')}</strong> telah ditambahkan ke akun Anda.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">ID Transaksi Top Up:</span>
                <span className="font-mono font-bold text-blue-400">{lastTxId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Metode Pembayaran:</span>
                <span className="font-bold text-white uppercase">{method === 'qris' ? 'QRIS' : method === 'va' ? `VA ${selectedBank}` : selectedEwallet}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Nominal Top Up:</span>
                <span className="font-extrabold text-emerald-400">Rp {amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Saldo Sekarang:</span>
                <span className="font-black text-white text-sm">Rp {currentUser.saldo.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              Tutup & Kembali
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
