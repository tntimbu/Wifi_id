import React, { useState } from 'react';
import {
  ShieldCheck, LayoutDashboard, Package, Users, Receipt, Settings,
  Plus, Trash2, Edit, Check, X, FileSpreadsheet, Wallet, Wifi, Clock, Search, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  PaketKuota, UserProfile, Transaksi, KonfigurasiWifi, AdminTab
} from '../../../types';
import { exportTransaksiCSV } from '../../../services/wifiService';

interface AdminViewProps {
  allUsers: UserProfile[];
  allPackages: PaketKuota[];
  allTransactions: Transaksi[];
  wifiConfig: KonfigurasiWifi;
  onAddPackage: (pkg: Omit<PaketKuota, 'id'>) => Promise<void>;
  onEditPackage: (id: string, data: Partial<PaketKuota>) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onTogglePackage: (id: string, currentStatus: boolean) => Promise<void>;
  onConfirmPayment: (txId: string) => Promise<void>;
  onAddUserBalance: (uid: string, delta: number) => Promise<void>;
  onUpdateWifiConfig: (data: Partial<KonfigurasiWifi>) => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  allUsers,
  allPackages,
  allTransactions,
  wifiConfig,
  onAddPackage,
  onEditPackage,
  onDeletePackage,
  onTogglePackage,
  onConfirmPayment,
  onAddUserBalance,
  onUpdateWifiConfig
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Package Form State
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgNama, setPkgNama] = useState('');
  const [pkgHarga, setPkgHarga] = useState(10000);
  const [pkgDurasi, setPkgDurasi] = useState(24);
  const [pkgKuotaMb, setPkgKuotaMb] = useState(5000);
  const [pkgKecepatan, setPkgKecepatan] = useState('10 Mbps');

  // Balance Modal State
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [balanceDelta, setBalanceDelta] = useState(20000);

  // Wifi & Payment Config Form State
  const [cfgNamaWifi, setCfgNamaWifi] = useState(wifiConfig.nama_wifi);
  const [cfgWelcome, setCfgWelcome] = useState(wifiConfig.welcome_message);
  
  const initialPayment = wifiConfig.pembayaran || {
    qris_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126580014ID.LINKAJA.WWW011893600911002120015204581253033605802ID5910WiFi%20Kota5008JAKARTA6007050000062070703A0163041A2D',
    qris_merchant_name: 'WIFI KOTA PREMIUM (QRIS ALL PAYMENT)',
    qris_nmid: 'ID1020394817263',
    va_accounts: [
      { bank: 'BCA', account_number: '882091823712', account_name: 'WiFi Kota Premium', enabled: true },
      { bank: 'Mandiri', account_number: '137001928374', account_name: 'WiFi Kota Premium', enabled: true },
      { bank: 'BRI', account_number: '021001029384501', account_name: 'WiFi Kota Premium', enabled: true },
      { bank: 'BNI', account_number: '0981238475', account_name: 'WiFi Kota Premium', enabled: true }
    ],
    ewallet_accounts: [
      { provider: 'GoPay', phone_number: '081234567890', account_name: 'WiFi Kota Admin', enabled: true },
      { provider: 'DANA', phone_number: '081234567890', account_name: 'WiFi Kota Admin', enabled: true },
      { provider: 'ShopeePay', phone_number: '081234567890', account_name: 'WiFi Kota Admin', enabled: true },
      { provider: 'OVO', phone_number: '081234567890', account_name: 'WiFi Kota Admin', enabled: true }
    ],
    instructions: 'Silakan transfer sesuai nominal ke salah satu rekening Bank / E-Wallet atau scan QRIS di atas. Saldo/paket akan langsung dikonfirmasi setelah pembayaran.'
  };

  const [qrisUrl, setQrisUrl] = useState(initialPayment.qris_url);
  const [qrisMerchant, setQrisMerchant] = useState(initialPayment.qris_merchant_name);
  const [qrisNmid, setQrisNmid] = useState(initialPayment.qris_nmid);
  const [vaList, setVaList] = useState(initialPayment.va_accounts);
  const [ewalletList, setEwalletList] = useState(initialPayment.ewallet_accounts);
  const [payInstructions, setPayInstructions] = useState(initialPayment.instructions);
  const [cfgSaved, setCfgSaved] = useState(false);

  // Search/Filter Transaction State
  const [txSearch, setTxSearch] = useState('');
  const [txFilterStatus, setTxFilterStatus] = useState('all');

  // Dashboard Metrics
  const totalCustomers = allUsers.filter(u => u.role === 'user').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = allTransactions.filter(t => t.created_at.startsWith(todayStr));
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.status === 'aktif' ? t.harga : 0), 0);

  // 7-day revenue chart
  const revenueChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const dayTxs = allTransactions.filter(t => t.created_at.startsWith(dStr) && t.status === 'aktif');
    const rev = dayTxs.reduce((acc, t) => acc + t.harga, 0);
    return {
      day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      pendapatan: rev
    };
  });

  const openAddPkgModal = () => {
    setEditingPkgId(null);
    setPkgNama('');
    setPkgHarga(10000);
    setPkgDurasi(24);
    setPkgKuotaMb(5000);
    setPkgKecepatan('10 Mbps');
    setPkgModalOpen(true);
  };

  const openEditPkgModal = (pkg: PaketKuota) => {
    setEditingPkgId(pkg.id);
    setPkgNama(pkg.nama);
    setPkgHarga(pkg.harga);
    setPkgDurasi(pkg.durasi_jam);
    setPkgKuotaMb(pkg.batas_mb);
    setPkgKecepatan(pkg.kecepatan);
    setPkgModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkgId) {
      await onEditPackage(editingPkgId, {
        nama: pkgNama,
        harga: Number(pkgHarga),
        durasi_jam: Number(pkgDurasi),
        batas_mb: Number(pkgKuotaMb),
        kecepatan: pkgKecepatan
      });
    } else {
      await onAddPackage({
        nama: pkgNama,
        harga: Number(pkgHarga),
        durasi_jam: Number(pkgDurasi),
        batas_mb: Number(pkgKuotaMb),
        kecepatan: pkgKecepatan,
        aktif: true
      });
    }
    setPkgModalOpen(false);
  };

  const handleSaveWifiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateWifiConfig({
      nama_wifi: cfgNamaWifi,
      welcome_message: cfgWelcome,
      pembayaran: {
        qris_url: qrisUrl,
        qris_merchant_name: qrisMerchant,
        qris_nmid: qrisNmid,
        va_accounts: vaList,
        ewallet_accounts: ewalletList,
        instructions: payInstructions
      }
    });
    setCfgSaved(true);
    setTimeout(() => setCfgSaved(false), 3000);
  };

  const handleSaveUserBalance = async () => {
    if (!targetUser) return;
    await onAddUserBalance(targetUser.uid, balanceDelta);
    setBalanceModalOpen(false);
  };

  // Filtered transactions list
  const filteredTxList = allTransactions.filter(t => {
    const matchesStatus = txFilterStatus === 'all' || t.status === txFilterStatus;
    const matchesQuery = t.user_email.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.paket_nama.toLowerCase().includes(txSearch.toLowerCase()) ||
      (t.kode_pembayaran && t.kode_pembayaran.toLowerCase().includes(txSearch.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Admin Title Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Admin Control Panel</h1>
            <p className="text-xs text-amber-300/80">Manajemen hotspot WiFi, paket kuota, pelanggan, dan transaksi</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Ringkasan
        </button>

        <button
          onClick={() => setActiveTab('paket')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'paket' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" /> Manajemen Paket ({allPackages.length})
        </button>

        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'user' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Pelanggan ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'transaksi' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" /> Transaksi ({allTransactions.length})
        </button>

        <button
          onClick={() => setActiveTab('konfigurasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'konfigurasi' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" /> Setting WiFi
        </button>
      </div>

      {/* Tab 1: Admin Dashboard Summary */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="block text-xs font-semibold text-slate-400">Total Customer Terdaftar</span>
              <span className="text-3xl font-extrabold text-blue-400">{totalCustomers}</span>
              <span className="block text-[10px] text-slate-500">User aktif hotspot</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="block text-xs font-semibold text-slate-400">Transaksi Hari Ini</span>
              <span className="text-3xl font-extrabold text-amber-400">{todayTransactions.length}</span>
              <span className="block text-[10px] text-slate-500">Penjualan paket terbaru</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="block text-xs font-semibold text-slate-400">Pendapatan Hari Ini</span>
              <span className="text-3xl font-extrabold text-emerald-400">
                Rp {todayRevenue.toLocaleString('id-ID')}
              </span>
              <span className="block text-[10px] text-slate-500">Total transaksi terbayar</span>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Grafik Pendapatan 7 Hari Terakhir</h3>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Pendapatan']}
                  />
                  <Bar dataKey="pendapatan" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Package Management */}
      {activeTab === 'paket' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold">Daftar Paket Kuota</h3>
            <button
              onClick={openAddPkgModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Tambah Paket Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPackages.map((pkg) => (
              <div key={pkg.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pkg.aktif ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {pkg.aktif ? 'Aktif' : 'Non-Aktif'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{pkg.kecepatan}</span>
                </div>

                <h4 className="text-lg font-bold text-white">{pkg.nama}</h4>
                <p className="text-sm font-extrabold text-amber-400">Rp {pkg.harga.toLocaleString('id-ID')}</p>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>Durasi: <strong>{pkg.durasi_jam} Jam</strong></div>
                  <div>Kuota: <strong>{pkg.batas_mb === 0 ? 'Unlimited' : `${pkg.batas_mb} MB`}</strong></div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onTogglePackage(pkg.id, pkg.aktif)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                  >
                    {pkg.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => openEditPkgModal(pkg)}
                    className="p-2 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded-lg border border-blue-800/50"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePackage(pkg.id)}
                    className="p-2 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Customer User Management */}
      {activeTab === 'user' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold">Daftar Pelanggan Terdaftar</h3>

          <div className="overflow-x-auto bg-slate-900 rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">No HP</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Saldo</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {allUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{u.nama}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.no_hp || '-'}</td>
                    <td className="p-3 uppercase font-bold text-[10px] text-amber-400">{u.role}</td>
                    <td className="p-3 font-bold text-emerald-400">Rp {u.saldo.toLocaleString('id-ID')}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setTargetUser(u);
                          setBalanceDelta(20000);
                          setBalanceModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-sm"
                      >
                        + Tambah Saldo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Transactions Management */}
      {activeTab === 'transaksi' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-base font-bold">Seluruh Transaksi Penjualan Kuota</h3>

            <div className="flex gap-2">
              <select
                value={txFilterStatus}
                onChange={(e) => setTxFilterStatus(e.target.value)}
                className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="aktif">Aktif</option>
                <option value="habis">Habis</option>
                <option value="expired">Expired</option>
              </select>

              <button
                onClick={() => exportTransaksiCSV(allTransactions)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Paket</th>
                  <th className="p-3">Harga</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3">Kode Bayar</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredTxList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{tx.user_email}</td>
                    <td className="p-3">{tx.paket_nama}</td>
                    <td className="p-3 font-bold text-emerald-400">Rp {tx.harga.toLocaleString('id-ID')}</td>
                    <td className="p-3 uppercase text-[10px]">{tx.metode_pembayaran}</td>
                    <td className="p-3 font-mono text-amber-300">{tx.kode_pembayaran || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'aktif' ? 'bg-emerald-500/20 text-emerald-400' : tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {tx.status === 'pending' && (
                        <button
                          onClick={() => onConfirmPayment(tx.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg shadow"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: WiFi Configuration & Payment Channels */}
      {activeTab === 'konfigurasi' && (
        <form onSubmit={handleSaveWifiConfig} className="space-y-6 max-w-4xl">
          
          {/* Header Alert */}
          {cfgSaved && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Semua Pengaturan & Metode Pembayaran Berhasil Disimpan!</span>
            </div>
          )}

          {/* Section 1: Hotspot Captive Portal */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-blue-400">
              <Wifi className="w-5 h-5" /> Konfigurasi Hotspot & SSID Captive Portal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama WiFi (SSID Name)</label>
                <input
                  type="text"
                  required
                  value={cfgNamaWifi}
                  onChange={(e) => setCfgNamaWifi(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pesan Selamat Datang</label>
                <textarea
                  rows={2}
                  required
                  value={cfgWelcome}
                  onChange={(e) => setCfgWelcome(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: QRIS Configuration */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-emerald-400">
              <Wallet className="w-5 h-5" /> Pengaturan QRIS All Payment (Gopay, DANA, OVO, ShopeePay, Bank)
            </h3>
            <p className="text-xs text-slate-400">Atur rincian merchant QRIS yang akan ditampilkan pada halaman Top Up dan checkout customer.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Merchant QRIS</label>
                <input
                  type="text"
                  value={qrisMerchant}
                  onChange={(e) => setQrisMerchant(e.target.value)}
                  placeholder="Contoh: WIFI KOTA PREMIUM - QRIS"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">NMID / ID Merchant</label>
                <input
                  type="text"
                  value={qrisNmid}
                  onChange={(e) => setQrisNmid(e.target.value)}
                  placeholder="Contoh: ID1020394817263"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Gambar QRIS (Barcode Image URL)</label>
              <input
                type="text"
                value={qrisUrl}
                onChange={(e) => setQrisUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Gunakan link gambar QRIS resmi Anda atau buat QRis statis dari provider pembayaran Anda.</p>
            </div>
          </div>

          {/* Section 3: Virtual Account (Bank Transfer) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-indigo-400">
              <Receipt className="w-5 h-5" /> Pengaturan Rekening Virtual Account (Bank Transfer)
            </h3>
            <p className="text-xs text-slate-400">Konfigurasi nomor rekening/VA untuk Bank BCA, Mandiri, BRI, BNI.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaList.map((va, idx) => (
                <div key={va.bank} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">Bank {va.bank}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-slate-400">{va.enabled ? 'Aktif' : 'Nonaktif'}</span>
                      <input
                        type="checkbox"
                        checked={va.enabled}
                        onChange={(e) => {
                          const updated = [...vaList];
                          updated[idx].enabled = e.target.checked;
                          setVaList(updated);
                        }}
                        className="rounded border-slate-800 text-blue-600 focus:ring-0"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Nomor Rekening / VA</label>
                    <input
                      type="text"
                      value={va.account_number}
                      onChange={(e) => {
                        const updated = [...vaList];
                        updated[idx].account_number = e.target.value;
                        setVaList(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Nama Pemilik Rekening (a.n)</label>
                    <input
                      type="text"
                      value={va.account_name}
                      onChange={(e) => {
                        const updated = [...vaList];
                        updated[idx].account_name = e.target.value;
                        setVaList(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: E-Wallet Direct */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-cyan-400">
              <Users className="w-5 h-5" /> Pengaturan Rekening E-Wallet (GoPay, DANA, ShopeePay, OVO)
            </h3>
            <p className="text-xs text-slate-400">Nomor HP / Akun E-Wallet untuk menerima transfer manual dari pelanggan.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ewalletList.map((ew, idx) => (
                <div key={ew.provider} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">{ew.provider}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-slate-400">{ew.enabled ? 'Aktif' : 'Nonaktif'}</span>
                      <input
                        type="checkbox"
                        checked={ew.enabled}
                        onChange={(e) => {
                          const updated = [...ewalletList];
                          updated[idx].enabled = e.target.checked;
                          setEwalletList(updated);
                        }}
                        className="rounded border-slate-800 text-cyan-600 focus:ring-0"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Nomor HP {ew.provider}</label>
                    <input
                      type="text"
                      value={ew.phone_number}
                      onChange={(e) => {
                        const updated = [...ewalletList];
                        updated[idx].phone_number = e.target.value;
                        setEwalletList(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Nama Akun (a.n)</label>
                    <input
                      type="text"
                      value={ew.account_name}
                      onChange={(e) => {
                        const updated = [...ewalletList];
                        updated[idx].account_name = e.target.value;
                        setEwalletList(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Instructions */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300">Instruksi Catatan Pembayaran Bagi Pelanggan</label>
            <textarea
              rows={3}
              value={payInstructions}
              onChange={(e) => setPayInstructions(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Simpan Semua Pengaturan Konfigurasi & Pembayaran
          </button>

        </form>
      )}

      {/* Package Form Modal */}
      {pkgModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSavePackage} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">{editingPkgId ? 'Edit Paket Kuota' : 'Tambah Paket Baru'}</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Paket</label>
              <input
                type="text"
                required
                placeholder="Contoh: Paket 10GB 24 Jam"
                value={pkgNama}
                onChange={(e) => setPkgNama(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  value={pkgHarga}
                  onChange={(e) => setPkgHarga(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Durasi (Jam)</label>
                <input
                  type="number"
                  required
                  value={pkgDurasi}
                  onChange={(e) => setPkgDurasi(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Batas MB (0 = Unlimited)</label>
                <input
                  type="number"
                  required
                  value={pkgKuotaMb}
                  onChange={(e) => setPkgKuotaMb(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kecepatan</label>
                <input
                  type="text"
                  required
                  value={pkgKecepatan}
                  onChange={(e) => setPkgKecepatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPkgModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Simpan Paket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Balance Modal */}
      {balanceModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Tambah Saldo User</h3>
            <p className="text-xs text-slate-400">User: <strong>{targetUser.nama}</strong> ({targetUser.email})</p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nominal Tambah Saldo (Rp)</label>
              <input
                type="number"
                value={balanceDelta}
                onChange={(e) => setBalanceDelta(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBalanceModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUserBalance}
                className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Tambah Saldo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
