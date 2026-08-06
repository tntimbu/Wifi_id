import React, { useState } from 'react';
import { Wallet, PlusCircle, QrCode, Building2, Check, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types';

interface TopUpViewProps {
  currentUser: UserProfile;
  onTopUp: (amount: number) => Promise<void>;
}

export const TopUpView: React.FC<TopUpViewProps> = ({ currentUser, onTopUp }) => {
  const [amount, setAmount] = useState<number>(20000);
  const [method, setMethod] = useState<'qris' | 'bank' | 'instant'>('instant');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const nominalOptions = [10000, 20000, 50000, 100000, 200000];

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsLoading(true);
    setSuccessMsg('');
    await onTopUp(amount);
    setIsLoading(false);
    setSuccessMsg(`Top Up sebesar Rp ${amount.toLocaleString('id-ID')} berhasil ditambahkan ke saldo Anda! 🎉`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Top Up Saldo Hotspot</h1>
            <p className="text-xs text-slate-400">Isi saldo akun untuk kemudahan pembelian paket kuota</p>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[10px] text-slate-400 font-semibold">Saldo Saat Ini</span>
          <span className="text-xl font-extrabold text-emerald-400">
            Rp {currentUser.saldo.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold text-center">
          {successMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleTopUpSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        
        {/* Nominal Quick Buttons */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Pilih Nominal Top Up</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {nominalOptions.map((nom) => (
              <button
                type="button"
                key={nom}
                onClick={() => setAmount(nom)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  amount === nom
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                Rp {nom.toLocaleString('id-ID')}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Nominal Kustom (Rp)</label>
          <input
            type="number"
            min={5000}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Metode Pembayaran Top Up</label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMethod('instant')}
              className={`p-4 rounded-xl border text-left transition-all ${
                method === 'instant' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <PlusCircle className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="block text-xs font-bold text-white">Instan (Simulasi Direct)</span>
              <span className="text-[10px] text-slate-400">Saldo langsung masuk detik ini</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('qris')}
              className={`p-4 rounded-xl border text-left transition-all ${
                method === 'qris' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <QrCode className="w-5 h-5 text-blue-400 mb-2" />
              <span className="block text-xs font-bold text-white">QRIS All Payment</span>
              <span className="text-[10px] text-slate-400">Scan QRIS dari E-Wallet / Mobile Banking</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('bank')}
              className={`p-4 rounded-xl border text-left transition-all ${
                method === 'bank' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <Building2 className="w-5 h-5 text-indigo-400 mb-2" />
              <span className="block text-xs font-bold text-white">Transfer Virtual Account</span>
              <span className="text-[10px] text-slate-400">BCA, Mandiri, BRI, BNI</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || amount <= 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Proses Top Up Rp {amount.toLocaleString('id-ID')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>

    </div>
  );
};
