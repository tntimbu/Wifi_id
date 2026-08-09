import React, { useState } from 'react';
import { ShoppingCart, Zap, Clock, Check, ArrowRight, ShieldCheck, Wallet, Sparkles } from 'lucide-react';
import { PaketKuota, UserProfile, MetodePembayaran } from '../../types';

interface MarketplaceViewProps {
  packages: PaketKuota[];
  currentUser: UserProfile;
  onSelectPackage: (paket: PaketKuota, metode: MetodePembayaran) => Promise<void>;
  onNavigateTopUp: () => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  packages,
  currentUser,
  onSelectPackage,
  onNavigateTopUp
}) => {
  const [selectedPaket, setSelectedPaket] = useState<PaketKuota | null>(null);
  const [selectedMetode, setSelectedMetode] = useState<MetodePembayaran>('saldo');
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChoose = (paket: PaketKuota) => {
    setSelectedPaket(paket);
    setModalOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPaket) return;
    setIsProcessing(true);
    await onSelectPackage(selectedPaket, selectedMetode);
    setIsProcessing(false);
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-400" /> Beli Paket Kuota Internet
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Pilih paket kuota hotspot sesuai kebutuhan Anda. Langsung aktif setelah pembayaran dikonfirmasi!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="block text-[10px] text-slate-400 font-semibold">Saldo Anda</span>
            <span className="text-base font-bold text-emerald-400">
              Rp {currentUser.saldo.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={onNavigateTopUp}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
          >
            + Top Up Saldo
          </button>
        </div>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {packages.map((pkg) => {
          const isUnlimited = pkg.batas_mb === 0;
          return (
            <div
              key={pkg.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    {pkg.kecepatan}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {pkg.durasi_jam} Jam
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{pkg.nama}</h3>

                <div className="my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="block text-2xl font-black text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text">
                    {isUnlimited ? 'UNLIMITED' : `${(pkg.batas_mb / 1000).toFixed(0)} GB`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isUnlimited ? 'Bebas Streaming & Download' : `${pkg.batas_mb.toLocaleString('id-ID')} MB Kuota`}
                  </span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Speed Up to {pkg.kecepatan}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Masa Aktif {pkg.durasi_jam} Jam
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="mb-3">
                  <span className="text-[10px] text-slate-400 block">Harga Paket</span>
                  <span className="text-xl font-extrabold text-white">
                    Rp {pkg.harga.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => handleChoose(pkg)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Beli Paket Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Checkout Modal */}
      {modalOpen && selectedPaket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-5">
            
            <div>
              <h3 className="text-lg font-bold">Pilih Metode Pembayaran</h3>
              <p className="text-xs text-slate-400">Proses aktivasi paket {selectedPaket.nama}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Paket:</span>
                <span className="font-bold text-white">{selectedPaket.nama}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Harga:</span>
                <span className="font-extrabold text-emerald-400">Rp {selectedPaket.harga.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Pilihan Pembayaran</label>
              
              <div className="space-y-2">
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'saldo' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="m_p"
                      value="saldo"
                      checked={selectedMetode === 'saldo'}
                      onChange={() => setSelectedMetode('saldo')}
                    />
                    <div>
                      <span className="block text-xs font-bold">Saldo Internal</span>
                      <span className="text-[10px] text-slate-400">Saldo: Rp {currentUser.saldo.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'qris' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="m_p"
                      value="qris"
                      checked={selectedMetode === 'qris'}
                      onChange={() => setSelectedMetode('qris')}
                    />
                    <div>
                      <span className="block text-xs font-bold">QRIS All Payment</span>
                      <span className="text-[10px] text-slate-400">Scan QRIS dari GoPay, DANA, OVO, ShopeePay, atau m-Banking</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'transfer' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="m_p"
                      value="transfer"
                      checked={selectedMetode === 'transfer'}
                      onChange={() => setSelectedMetode('transfer')}
                    />
                    <div>
                      <span className="block text-xs font-bold">Transfer Virtual Account / Bank</span>
                      <span className="text-[10px] text-slate-400">Transfer ke BCA, Mandiri, BRI, atau BNI</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMetode === 'cash' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="m_p"
                      value="cash"
                      checked={selectedMetode === 'cash'}
                      onChange={() => setSelectedMetode('cash')}
                    />
                    <div>
                      <span className="block text-xs font-bold">Tunai (Cash ke Admin)</span>
                      <span className="text-[10px] text-slate-400">Bayar ke kasir untuk diaktifkan</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
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
                  'Konfirmasi Pembelian'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
