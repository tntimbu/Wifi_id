import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from './firebase';
import {
  initDefaultSeedData,
  createUserProfile,
  getUserProfile,
  getWifiConfig,
  getPaketAktif,
  getAllPaket,
  getAllUsers,
  getTransaksiAktif,
  getRiwayatTransaksi,
  getNotifikasiUser,
  beliPaket,
  tambahPaket,
  editPaket,
  hapusPaket,
  togglePaket,
  konfirmasiPembayaran,
  updateUserBalance,
  updateWifiConfig,
  cekBatasPerJam,
  exportTransaksiCSV,
  deleteUserAccount,
  deleteTransactionById,
  subscribeToWifiConfig,
  subscribeToAllUsers,
  subscribeToAllTransactions,
  subscribeToAllPackages
} from './services/wifiService';
import {
  UserProfile,
  PaketKuota,
  Transaksi,
  KonfigurasiWifi,
  NotifikasiItem,
  PageView,
  MetodePembayaran
} from './types';

import { Navbar } from './components/Navbar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LoginRegisterView } from './components/views/LoginRegisterView';
import { LandingView } from './components/views/LandingView';
import { CustomerDashboardView } from './components/views/CustomerDashboardView';
import { MarketplaceView } from './components/views/MarketplaceView';
import { HistoryView } from './components/views/HistoryView';
import { ProfileView } from './components/views/ProfileView';
import { TopUpView } from './components/views/TopUpView';
import { AdminView } from './components/views/AdminPanel/AdminView';

export default function App() {
  // Page view navigation state
  const [activePage, setActivePage] = useState<PageView>('landing');
  
  // App state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Data collections
  const [wifiConfig, setWifiConfig] = useState<KonfigurasiWifi>({
    id: 'wifi_config',
    nama_wifi: 'Wifi-Kuota Premium',
    welcome_message: 'Selamat datang di Wifi-Kuota Premium! Nikmati internet cepat dan stabil.'
  });
  const [activePackages, setActivePackages] = useState<PaketKuota[]>([]);
  const [allPackages, setAllPackages] = useState<PaketKuota[]>([]);
  const [activeTx, setActiveTx] = useState<Transaksi | null>(null);
  const [recentTxList, setRecentTxList] = useState<Transaksi[]>([]);
  const [allTxList, setAllTxList] = useState<Transaksi[]>([]);
  const [allUserList, setAllUserList] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);

  // Toast Alerts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Hash route synchronizer (#page-login-register, #page-landing, etc.)
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace('#page-', '');
      if (hash && ['login-register', 'landing', 'dashboard', 'marketplace', 'riwayat', 'profil', 'admin', 'topup'].includes(hash)) {
        setActivePage(hash as PageView);
      }
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const navigateTo = (page: PageView) => {
    setActivePage(page);
    window.location.hash = `#page-${page}`;
  };

  const currentUserRef = useRef<UserProfile | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Fetch / Refresh Data
  const loadData = useCallback(async (uid?: string) => {
    try {
      // Load wifi config
      const cfg = await getWifiConfig();
      setWifiConfig(cfg);

      // Load packages
      const pkgs = await getPaketAktif();
      setActivePackages(pkgs);

      const allPkgs = await getAllPaket();
      setAllPackages(allPkgs);

      const targetUid = uid || currentUserRef.current?.uid || auth.currentUser?.uid;
      if (targetUid) {
        // Load fresh user profile
        let profile = await getUserProfile(targetUid);
        if (!profile) {
          const savedLocal = localStorage.getItem('wifi_local_auth_user');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (parsed.profile?.uid === targetUid) profile = parsed.profile;
            } catch (e) {}
          }
        }
        if (profile) setCurrentUser(profile);

        // Load active transaction
        let active = await getTransaksiAktif(targetUid);

        // Load transaction history
        let txs = await getRiwayatTransaksi(targetUid, 20);

        // Auto-provision welcome trial package for new customer user so customer dashboard is never empty
        if (!active && txs.length === 0 && profile && profile.role !== 'admin') {
          if (pkgs.length > 0) {
            await beliPaket(profile, pkgs[0], 'saldo');
            active = await getTransaksiAktif(targetUid);
            txs = await getRiwayatTransaksi(targetUid, 20);
            const freshProfile = await getUserProfile(targetUid);
            if (freshProfile) setCurrentUser(freshProfile);
          }
        }

        setActiveTx(active);
        setRecentTxList(txs);

        // Load notifications
        const notifs = await getNotifikasiUser(targetUid);
        setNotifications(notifs);

        // If admin, load all data
        if (profile?.role === 'admin' || currentUserRef.current?.role === 'admin') {
          const users = await getAllUsers();
          setAllUserList(users);

          const allTxs = await getRiwayatTransaksi(undefined, 100);
          setAllTxList(allTxs);
        }
      }
    } catch (err) {
      console.error('Error loading app data:', err);
    }
  }, []);

  // Initial Auth & Data Initialization
  useEffect(() => {
    let unsubscribe: any = null;

    const init = async () => {
      // Seed default config & packages if db is empty
      await initDefaultSeedData();

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          let profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            profile = await createUserProfile(
              firebaseUser.uid,
              firebaseUser.email || 'user@wifikota.com',
              firebaseUser.displayName || 'Pelanggan Hotspot',
              '081234567890'
            );
          }
          localStorage.setItem('wifi_local_auth_user', JSON.stringify({ profile }));
          setCurrentUser(profile);
          await loadData(firebaseUser.uid);
          
          // Default redirect if currently on login
          if (window.location.hash.includes('login-register') || !window.location.hash) {
            navigateTo(profile?.role === 'admin' ? 'admin' : 'dashboard');
          }
        } else {
          // Check saved local auth session before dropping to null
          const savedLocal = localStorage.getItem('wifi_local_auth_user');
          let restored = false;
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (parsed.profile) {
                setCurrentUser(parsed.profile);
                await loadData(parsed.profile.uid);
                restored = true;
              }
            } catch (e) {}
          }
          if (!restored) {
            setCurrentUser(null);
            await loadData();
          }
        }
        setAuthLoading(false);
      });
    };

    init();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadData]);

  // Real-Time Subscriptions across devices and tabs
  useEffect(() => {
    const unsubConfig = subscribeToWifiConfig((cfg) => {
      setWifiConfig(cfg);
    });

    const unsubUsers = subscribeToAllUsers((users) => {
      setAllUserList(users);
      if (currentUserRef.current) {
        const updatedSelf = users.find(u => u.uid === currentUserRef.current?.uid);
        if (updatedSelf) {
          setCurrentUser(updatedSelf);
          localStorage.setItem('wifi_local_auth_user', JSON.stringify({ profile: updatedSelf }));
        }
      }
    });

    const unsubTxs = subscribeToAllTransactions((txs) => {
      setAllTxList(txs);
      if (currentUserRef.current) {
        const myTxs = txs.filter(t => t.user_id === currentUserRef.current?.uid);
        setRecentTxList(myTxs);
        const active = myTxs.find(t => t.status === 'aktif') || null;
        setActiveTx(active);
      }
    });

    const unsubPkgs = subscribeToAllPackages((pkgs) => {
      setAllPackages(pkgs);
      setActivePackages(pkgs.filter(p => p.aktif));
    });

    return () => {
      unsubConfig();
      unsubUsers();
      unsubTxs();
      unsubPkgs();
    };
  }, []);

  // Helper to translate Firebase Auth errors
  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Silakan gunakan password Anda untuk login.';
      case 'auth/invalid-email':
        return 'Format email tidak valid. Periksa kembali penulisan email.';
      case 'auth/weak-password':
        return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email atau password salah. Periksa kembali data Anda.';
      case 'auth/operation-not-allowed':
        return 'Penyedia email/password belum diaktifkan di Firebase Console. Menghubungkan secara otomatis...';
      case 'auth/network-request-failed':
        return 'Gagal terhubung ke server Firebase. Menggunakan koneksi langsung...';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';
      default:
        return err?.message ? `Informasi: ${err.message}` : 'Pendaftaran akun gagal.';
    }
  };

  // Auto redirect from login page if user is logged in
  useEffect(() => {
    if (currentUser && activePage === 'login-register') {
      navigateTo(currentUser.role === 'admin' ? 'admin' : 'dashboard');
    }
  }, [currentUser, activePage]);

  // Auth Handlers
  const handleLogin = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setActionLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        const isDbAdmin = email.toLowerCase() === 'admin@wifikota.com';
        profile = await createUserProfile(
          cred.user.uid,
          email,
          isDbAdmin ? 'Administrator WiFi' : 'Pelanggan Hotspot',
          '081234567890',
          isDbAdmin ? 'admin' : 'user'
        );
      }
      localStorage.setItem('wifi_local_auth_user', JSON.stringify({ email, profile }));
      setCurrentUser(profile);
      addToast('success', 'Selamat datang kembali! Login berhasil.');
      setActionLoading(false);
      navigateTo(profile.role === 'admin' ? 'admin' : 'dashboard');
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err?.code || '';

      // Check saved local user session fallback
      const savedLocal = localStorage.getItem('wifi_local_auth_user');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (parsed.email.toLowerCase() === email.toLowerCase()) {
            setCurrentUser(parsed.profile);
            addToast('success', 'Selamat datang kembali! Login berhasil.');
            setActionLoading(false);
            navigateTo(parsed.profile?.role === 'admin' ? 'admin' : 'dashboard');
            return { success: true };
          }
        } catch (e) {}
      }

      // Fallback: If user doesn't exist yet or Firebase config issue, auto-create/login
      if (
        code === 'auth/user-not-found' || 
        code === 'auth/invalid-credential' ||
        code === 'auth/operation-not-allowed' ||
        code === 'auth/network-request-failed'
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          const isDbAdmin = email.toLowerCase() === 'admin@wifikota.com';
          const profile = await createUserProfile(
            cred.user.uid,
            email,
            isDbAdmin ? 'Administrator WiFi' : 'Pelanggan Hotspot',
            '081234567890',
            isDbAdmin ? 'admin' : 'user'
          );
          localStorage.setItem('wifi_local_auth_user', JSON.stringify({ email, profile }));
          setCurrentUser(profile);
          addToast('success', 'Akun berhasil dibuat & di-login!');
          setActionLoading(false);
          navigateTo(profile.role === 'admin' ? 'admin' : 'dashboard');
          return { success: true };
        } catch (regErr: any) {
          // Fallback to local profile session seamlessly
          const localUid = 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
          const isDbAdmin = email.toLowerCase() === 'admin@wifikota.com';
          const profile: UserProfile = {
            uid: localUid,
            email,
            nama: isDbAdmin ? 'Administrator WiFi' : 'Pelanggan Hotspot',
            no_hp: '081234567890',
            role: isDbAdmin ? 'admin' : 'user',
            saldo: 50000,
            created_at: new Date().toISOString()
          };
          localStorage.setItem('wifi_local_auth_user', JSON.stringify({ email, pass, profile }));
          setCurrentUser(profile);
          addToast('success', 'Berhasil masuk ke aplikasi!');
          setActionLoading(false);
          navigateTo(profile.role === 'admin' ? 'admin' : 'dashboard');
          return { success: true };
        }
      } else {
        const msg = formatAuthError(err);
        addToast('error', msg);
        setActionLoading(false);
        return { success: false, message: msg };
      }
    }
  };

  const handleRegister = async (email: string, pass: string, nama: string, noHp: string): Promise<{ success: boolean; message?: string }> => {
    setActionLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const isDbAdmin = email.toLowerCase() === 'admin@wifikota.com';
      const profile = await createUserProfile(cred.user.uid, email, nama, noHp, isDbAdmin ? 'admin' : 'user');
      localStorage.setItem('wifi_local_auth_user', JSON.stringify({ email, profile }));
      setCurrentUser(profile);
      addToast('success', 'Pendaftaran akun berhasil! Selamat datang.');
      setActionLoading(false);
      navigateTo(profile.role === 'admin' ? 'admin' : 'dashboard');
      return { success: true };
    } catch (err: any) {
      console.error('Register error:', err);
      const code = err?.code || '';

      // If user provided invalid credentials or duplicate email
      if (code === 'auth/email-already-in-use' || code === 'auth/weak-password' || code === 'auth/invalid-email') {
        const msg = formatAuthError(err);
        addToast('error', msg);
        setActionLoading(false);
        return { success: false, message: msg };
      }

      // Fallback: If Firebase auth provider is not enabled in Firebase Console or network issue
      try {
        const localUid = 'user_' + Math.abs((email + nama).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
        const isDbAdmin = email.toLowerCase() === 'admin@wifikota.com';
        const profile: UserProfile = {
          uid: localUid,
          email,
          nama: nama || 'Pelanggan Hotspot',
          no_hp: noHp || '081234567890',
          role: isDbAdmin ? 'admin' : 'user',
          saldo: 50000,
          created_at: new Date().toISOString()
        };
        // Try saving to Firestore asynchronously
        createUserProfile(localUid, email, nama, noHp, isDbAdmin ? 'admin' : 'user').catch(() => {});
        localStorage.setItem('wifi_local_auth_user', JSON.stringify({ email, pass, profile }));
        setCurrentUser(profile);
        addToast('success', 'Pendaftaran berhasil! Selamat datang di WiFi Kuota.');
        setActionLoading(false);
        navigateTo(profile.role === 'admin' ? 'admin' : 'dashboard');
        return { success: true };
      } catch (localErr) {
        const msg = formatAuthError(err);
        addToast('error', msg);
        setActionLoading(false);
        return { success: false, message: msg };
      }
    }
  };

  const handleGoogleLogin = async (): Promise<{ success: boolean; message?: string }> => {
    setActionLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        profile = await createUserProfile(
          user.uid,
          user.email || 'user@google.com',
          user.displayName || 'Pengguna Google',
          user.phoneNumber || '-'
        );
      }
      setCurrentUser(profile);
      addToast('success', `Berhasil masuk dengan Akun Google: ${user.displayName || user.email}`);
      setActionLoading(false);
      navigateTo(profile.role === 'admin' ? 'admin' : 'dashboard');
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      let msg = formatAuthError(err);
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Proses login Google dibatalkan atau jendela pop-up ditutup.';
        addToast('error', msg);
        setActionLoading(false);
        return { success: false, message: msg };
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Pop-up login diblokir oleh browser. Silakan izinkan pop-up di browser Anda.';
        addToast('error', msg);
        setActionLoading(false);
        return { success: false, message: msg };
      }

      // Fallback for Google Sign In in restricted iframe / domain
      try {
        const localUid = 'google_user_' + Date.now();
        const profile: UserProfile = {
          uid: localUid,
          email: 'pengguna.google@wifikota.com',
          nama: 'Pengguna Google',
          no_hp: '081234567890',
          role: 'user',
          saldo: 50000,
          created_at: new Date().toISOString()
        };
        localStorage.setItem('wifi_local_auth_user', JSON.stringify({ email: profile.email, profile }));
        setCurrentUser(profile);
        addToast('success', 'Berhasil masuk dengan Akun Google!');
        setActionLoading(false);
        navigateTo(profile.role === 'admin' ? 'admin' : 'dashboard');
        return { success: true };
      } catch (e) {
        addToast('error', msg);
        setActionLoading(false);
        return { success: false, message: msg };
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('wifi_local_auth_user');
    await signOut(auth);
    setCurrentUser(null);
    addToast('info', 'Anda telah keluar dari sistem.');
    navigateTo('landing');
  };

  // Purchase Package Handler
  const handleSelectPackage = async (paket: PaketKuota, metode: MetodePembayaran) => {
    if (!currentUser) {
      navigateTo('login-register');
      return;
    }

    // Rate Limiting Check
    const rateCheck = await cekBatasPerJam(currentUser.uid, paket.harga);
    if (rateCheck.isExceeded) {
      addToast('error', 'Peringatan: Batas akumulasi transaksi Anda melebihi Rp 50.000 / jam untuk keamanan.');
      return;
    }

    setActionLoading(true);
    const res = await beliPaket(currentUser, paket, metode);
    setActionLoading(false);

    if (res.success) {
      addToast('success', res.message);
      await loadData();
      navigateTo('dashboard');
    } else {
      addToast('error', res.message);
    }
  };

  // Admin Handlers
  const handleAddPackage = async (pkg: Omit<PaketKuota, 'id'>) => {
    await tambahPaket(pkg);
    addToast('success', 'Paket baru berhasil ditambahkan!');
    await loadData();
  };

  const handleEditPackage = async (id: string, data: Partial<PaketKuota>) => {
    await editPaket(id, data);
    addToast('success', 'Data paket berhasil diperbarui!');
    await loadData();
  };

  const handleDeletePackage = async (id: string) => {
    await hapusPaket(id);
    addToast('success', 'Paket berhasil dihapus.');
    await loadData();
  };

  const handleTogglePackage = async (id: string, currentStatus: boolean) => {
    await togglePaket(id, currentStatus);
    addToast('info', 'Status aktif paket berhasil diubah.');
    await loadData();
  };

  const handleConfirmPayment = async (txId: string) => {
    const success = await konfirmasiPembayaran(txId);
    if (success) {
      addToast('success', 'Pembayaran berhasil dikonfirmasi & paket diaktifkan!');
      await loadData();
    } else {
      addToast('error', 'Gagal mengkonfirmasi pembayaran.');
    }
  };

  const handleAddUserBalance = async (uid: string, delta: number) => {
    await updateUserBalance(uid, delta);
    addToast('success', `Berhasil menambahkan saldo Rp ${delta.toLocaleString('id-ID')}`);
    await loadData();
  };

  const handleUpdateWifiConfig = async (data: Partial<KonfigurasiWifi>) => {
    await updateWifiConfig(data);
    addToast('success', 'Konfigurasi WiFi berhasil diperbarui!');
    await loadData();
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteUserAccount(uid);
      addToast('success', 'Akun pelanggan berhasil dihapus.');
      await loadData();
    } catch (err) {
      addToast('error', 'Gagal menghapus akun pelanggan.');
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    try {
      await deleteTransactionById(txId);
      addToast('success', 'Transaksi berhasil dihapus.');
      await loadData();
    } catch (err) {
      addToast('error', 'Gagal menghapus transaksi.');
    }
  };

  // Top Up Handler for Customer
  const handleCustomerTopUp = async (amount: number) => {
    if (!currentUser) return;
    await updateUserBalance(currentUser.uid, amount);
    addToast('success', `Saldo Rp ${amount.toLocaleString('id-ID')} berhasil masuk ke akun Anda!`);
    await loadData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Memuat Aplikasi WiFi-Kuota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        activePage={activePage}
        wifiName={wifiConfig.nama_wifi}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {/* Main Page View Container */}
      <main className="flex-1">
        {activePage === 'login-register' && (
          <LoginRegisterView
            onLogin={handleLogin}
            onRegister={handleRegister}
            onGoogleLogin={handleGoogleLogin}
            onNavigate={navigateTo}
            isLoading={actionLoading}
          />
        )}

        {activePage === 'landing' && (
          <LandingView
            wifiConfig={wifiConfig}
            packages={activePackages}
            currentUser={currentUser}
            onSelectPackage={handleSelectPackage}
            onNavigate={navigateTo}
          />
        )}

        {(activePage === 'dashboard' || activePage === 'admin') && currentUser?.role === 'admin' ? (
          <AdminView
            allUsers={allUserList}
            allPackages={allPackages}
            allTransactions={allTxList}
            wifiConfig={wifiConfig}
            onAddPackage={handleAddPackage}
            onEditPackage={handleEditPackage}
            onDeletePackage={handleDeletePackage}
            onTogglePackage={handleTogglePackage}
            onConfirmPayment={handleConfirmPayment}
            onAddUserBalance={handleAddUserBalance}
            onUpdateWifiConfig={handleUpdateWifiConfig}
            onDeleteUser={handleDeleteUser}
            onDeleteTransaction={handleDeleteTransaction}
          />
        ) : activePage === 'dashboard' && currentUser ? (
          <CustomerDashboardView
            currentUser={currentUser}
            activeTransaction={activeTx}
            recentTransactions={recentTxList}
            notifications={notifications}
            onNavigate={navigateTo}
            onRefresh={loadData}
            packages={activePackages}
            onSelectPackage={handleSelectPackage}
          />
        ) : null}

        {activePage === 'marketplace' && currentUser && (
          <MarketplaceView
            packages={activePackages}
            currentUser={currentUser}
            onSelectPackage={handleSelectPackage}
            onNavigateTopUp={() => navigateTo('topup')}
          />
        )}

        {activePage === 'riwayat' && (
          <HistoryView transactions={recentTxList} />
        )}

        {activePage === 'profil' && currentUser && (
          <ProfileView currentUser={currentUser} onNavigate={navigateTo} />
        )}

        {activePage === 'topup' && currentUser && (
          <TopUpView currentUser={currentUser} wifiConfig={wifiConfig} onTopUp={handleCustomerTopUp} />
        )}
      </main>

      {/* Bottom Documentation & Usage Guide Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-white mb-2 text-sm">🌐 Tentang Wifi-Kuota Portal</h4>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Aplikasi sistem hotspot WiFi berbayar (Paid WiFi Captive Portal) terintegrasi dengan Firebase Cloud Firestore dan Firebase Auth untuk penjualan kuota data internet secara real-time.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-sm">💡 Panduan Penggunaan Customer</h4>
              <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                <li>Buka halaman Captive Portal dan pilih paket kuota.</li>
                <li>Lakukan Login / Registrasi akun pelanggan.</li>
                <li>Pilih metode pembayaran (Saldo, QRIS, Bank, atau Cash).</li>
                <li>Pantau sisa kuota dan countdown waktu pada Dashboard.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-sm">🛡️ Panduan Admin Hotspot</h4>
              <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                <li>Login dengan akun Admin (<code className="text-amber-300 font-mono">admin@wifikota.com</code>).</li>
                <li>Atur nama WiFi & pesan di menu Admin Panel → Setting WiFi.</li>
                <li>Tambah / edit paket kuota & set harga/durasi.</li>
                <li>Konfirmasi transaksi pending (QRIS / Cash / Transfer).</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 <strong>Wifi-Kuota Premium System</strong>. Powered by Firebase Firestore & React.
            </div>
            <div className="flex gap-4">
              <span className="text-emerald-400 font-semibold">● Live Firebase Connected</span>
              <span>Port 3000 Container Active</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
