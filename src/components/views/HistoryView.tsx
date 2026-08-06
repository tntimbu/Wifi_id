import React, { useState } from 'react';
import { History, Search, Filter, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Transaksi } from '../../types';

interface HistoryViewProps {
  transactions: Transaksi[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ transactions }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = transactions.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch = t.paket_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.kode_pembayaran && t.kode_pembayaran.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" /> Riwayat Transaksi Kuota
          </h1>
          <p className="text-xs text-slate-400 mt-1">Daftar seluruh transaksi pembelian paket internet Anda</p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari paket / kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-36 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="pending">Pending</option>
            <option value="habis">Habis</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
          Belum ada riwayat transaksi yang cocok.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tx) => (
            <div
              key={tx.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    tx.status === 'aktif'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : tx.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tx.status}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {new Date(tx.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{tx.paket_nama}</h3>
                
                {tx.kode_pembayaran && (
                  <p className="text-[11px] font-mono text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 my-2">
                    Kode Bayar: <strong>{tx.kode_pembayaran}</strong>
                  </p>
                )}

                <div className="space-y-1 text-xs text-slate-300 my-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Harga:</span>
                    <span className="font-bold text-emerald-400">Rp {tx.harga.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Metode Bayar:</span>
                    <span className="uppercase text-[10px] text-slate-200">{tx.metode_pembayaran}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Masa Aktif:</span>
                    <span>{tx.durasi_jam} Jam</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
                Waktu Berakhir: {new Date(tx.waktu_berakhir).toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
