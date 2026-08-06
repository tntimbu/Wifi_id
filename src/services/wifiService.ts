import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  UserProfile,
  PaketKuota,
  Transaksi,
  PemakaianLog,
  NotifikasiItem,
  KonfigurasiWifi,
  RealtimeUsageState,
  MetodePembayaran,
  StatusTransaksi
} from '../types';

// Default WiFi Config ID
export const WIFI_CONFIG_ID = 'wifi_config';

/**
 * Inisialisasi Data Awal (Seed Data)
 * Membuat konfigurasi wifi default dan 5 paket kuota default jika belum ada
 */
export async function initDefaultSeedData() {
  // 1. Check or Create Wifi Config
  try {
    const configRef = doc(db, 'konfigurasi_wifi', WIFI_CONFIG_ID);
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      const defaultConfig: KonfigurasiWifi = {
        id: WIFI_CONFIG_ID,
        nama_wifi: 'Wifi-Kuota Premium',
        welcome_message: 'Selamat datang di Wifi-Kuota Premium! Nikmati internet cepat dan stabil. Silakan pilih paket yang sesuai dengan kebutuhan Anda.',
        logo_url: '',
        updated_at: new Date().toISOString()
      };
      await setDoc(configRef, defaultConfig);
    }
  } catch (err) {
    console.warn('Note on wifi config initialization:', err);
  }

  // 2. Check or Create Default Packages
  try {
    const paketRef = collection(db, 'paket_kuota');
    const paketSnap = await getDocs(paketRef);
    if (paketSnap.empty) {
      const defaultPackages: Omit<PaketKuota, 'id'>[] = [
        {
          nama: 'Paket 2GB 12 Jam',
          harga: 5000,
          durasi_jam: 12,
          batas_mb: 2000,
          kecepatan: '10 Mbps',
          aktif: true,
          created_at: new Date().toISOString()
        },
        {
          nama: 'Paket 5GB 24 Jam',
          harga: 10000,
          durasi_jam: 24,
          batas_mb: 5000,
          kecepatan: '10 Mbps',
          aktif: true,
          created_at: new Date().toISOString()
        },
        {
          nama: 'Paket 10GB 24 Jam',
          harga: 15000,
          durasi_jam: 24,
          batas_mb: 10000,
          kecepatan: '20 Mbps',
          aktif: true,
          created_at: new Date().toISOString()
        },
        {
          nama: 'Paket 15GB 48 Jam',
          harga: 20000,
          durasi_jam: 48,
          batas_mb: 15000,
          kecepatan: '20 Mbps',
          aktif: true,
          created_at: new Date().toISOString()
        },
        {
          nama: 'Paket Unlimited 24 Jam',
          harga: 30000,
          durasi_jam: 24,
          batas_mb: 0, // 0 = Unlimited
          kecepatan: '10 Mbps',
          aktif: true,
          created_at: new Date().toISOString()
        }
      ];

      for (const pkg of defaultPackages) {
        await addDoc(paketRef, pkg);
      }
    }
  } catch (err) {
    console.warn('Note on default packages initialization:', err);
  }
}

/**
 * User Profile Services
 */
export async function createUserProfile(uid: string, email: string, nama: string, noHp: string, role: 'admin' | 'user' = 'user'): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  // Force admin role if email is admin@wifikota.com
  const finalRole = email.toLowerCase() === 'admin@wifikota.com' ? 'admin' : role;

  const newUser: UserProfile = {
    uid,
    email,
    nama,
    role: finalRole,
    saldo: 50000, // Default welcome bonus balance
    no_hp: noHp || '-',
    created_at: new Date().toISOString()
  };

  await setDoc(userRef, newUser);
  return newUser;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

export async function updateUserBalance(uid: string, deltaAmount: number): Promise<number> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    saldo: increment(deltaAmount)
  });
  const updatedSnap = await getDoc(userRef);
  return updatedSnap.data()?.saldo || 0;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  return snap.docs.map(d => d.data() as UserProfile);
}

/**
 * WiFi Configuration Services
 */
export async function getWifiConfig(): Promise<KonfigurasiWifi> {
  const configRef = doc(db, 'konfigurasi_wifi', WIFI_CONFIG_ID);
  const snap = await getDoc(configRef);
  if (snap.exists()) {
    return snap.data() as KonfigurasiWifi;
  }
  return {
    id: WIFI_CONFIG_ID,
    nama_wifi: 'Wifi-Kuota Premium',
    welcome_message: 'Selamat datang di Wifi-Kuota Premium! Nikmati internet cepat dan stabil.',
    logo_url: ''
  };
}

export async function updateWifiConfig(data: Partial<KonfigurasiWifi>): Promise<void> {
  const configRef = doc(db, 'konfigurasi_wifi', WIFI_CONFIG_ID);
  await setDoc(configRef, {
    ...data,
    updated_at: new Date().toISOString()
  }, { merge: true });
}

/**
 * Package Services
 */
export async function getPaketAktif(): Promise<PaketKuota[]> {
  const paketRef = collection(db, 'paket_kuota');
  const snap = await getDocs(paketRef);
  const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as PaketKuota));
  return list.filter(p => p.aktif);
}

export async function getAllPaket(): Promise<PaketKuota[]> {
  const paketRef = collection(db, 'paket_kuota');
  const snap = await getDocs(paketRef);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as PaketKuota));
}

export async function tambahPaket(data: Omit<PaketKuota, 'id'>): Promise<string> {
  const paketRef = collection(db, 'paket_kuota');
  const docRef = await addDoc(paketRef, {
    ...data,
    created_at: new Date().toISOString()
  });
  return docRef.id;
}

export async function editPaket(id: string, data: Partial<PaketKuota>): Promise<void> {
  const docRef = doc(db, 'paket_kuota', id);
  await updateDoc(docRef, data);
}

export async function hapusPaket(id: string): Promise<void> {
  const docRef = doc(db, 'paket_kuota', id);
  await deleteDoc(docRef);
}

export async function togglePaket(id: string, currentStatus: boolean): Promise<void> {
  const docRef = doc(db, 'paket_kuota', id);
  await updateDoc(docRef, { aktif: !currentStatus });
}

/**
 * Rate Limiting Check (Rp 10.000 / Jam safeguard)
 */
export async function cekBatasPerJam(userId: string, harga: number): Promise<{ isExceeded: boolean; totalSpentLastHour: number }> {
  try {
    const q = query(
      collection(db, 'transaksi'),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).getTime();
    
    let totalSpent = 0;
    snap.docs.forEach(d => {
      const data = d.data() as Transaksi;
      const createdAtTime = new Date(data.created_at).getTime();
      if (createdAtTime >= oneHourAgo && data.status !== 'expired') {
        totalSpent += data.harga;
      }
    });

    const newTotal = totalSpent + harga;
    return {
      isExceeded: newTotal > 50000, // Safe threshold, e.g. Rp 50.000/jam limit
      totalSpentLastHour: totalSpent
    };
  } catch (err) {
    console.error('Error checking rate limit:', err);
    return { isExceeded: false, totalSpentLastHour: 0 };
  }
}

/**
 * Transaction & Quota Purchase
 */
export async function beliPaket(
  user: UserProfile,
  paket: PaketKuota,
  metode: MetodePembayaran
): Promise<{ success: boolean; message: string; transaksiId?: string; status?: StatusTransaksi; paymentCode?: string }> {
  try {
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + paket.durasi_jam * 60 * 60 * 1000).toISOString();

    let status: StatusTransaksi = 'aktif';
    let kodePembayaran = '';

    // If internal balance payment
    if (metode === 'saldo') {
      if (user.saldo < paket.harga) {
        return { success: false, message: 'Saldo Anda tidak mencukupi untuk membeli paket ini. Silakan Top Up terlebih dahulu.' };
      }
      // Deduct balance
      await updateUserBalance(user.uid, -paket.harga);
    } else {
      // Virtual Payment or Cash requires Admin confirmation
      status = 'pending';
      kodePembayaran = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const newTransaksi: Omit<Transaksi, 'id'> = {
      user_id: user.uid,
      user_email: user.email,
      user_nama: user.nama,
      paket_id: paket.id,
      paket_nama: paket.nama,
      harga: paket.harga,
      batas_mb: paket.batas_mb,
      durasi_jam: paket.durasi_jam,
      status: status,
      waktu_mulai: startTime,
      waktu_berakhir: endTime,
      sisa_kuota_mb: paket.batas_mb, // 0 if unlimited
      total_pemakaian_mb: 0,
      metode_pembayaran: metode,
      kode_pembayaran: kodePembayaran || undefined,
      created_at: startTime,
      updated_at: startTime
    };

    const docRef = await addDoc(collection(db, 'transaksi'), newTransaksi);

    // Kirim notifikasi
    if (status === 'aktif') {
      await kirimNotifikasi(
        user.uid,
        'Pembelian Berhasil 🎉',
        `Paket ${paket.nama} Anda telah aktif! Nikmati akses internet selama ${paket.durasi_jam} jam.`
      );
      // Admin notification
      await kirimNotifikasi(
        'admin_group',
        'Transaksi Baru 🛒',
        `User ${user.nama} (${user.email}) membeli ${paket.nama} seharga Rp ${paket.harga.toLocaleString('id-ID')}`
      );
    } else {
      await kirimNotifikasi(
        user.uid,
        'Menunggu Pembayaran ⏳',
        `Kode Pembayaran: ${kodePembayaran}. Silakan selesaikan pembayaran untuk mengaktifkan paket ${paket.nama}.`
      );
    }

    return {
      success: true,
      message: status === 'aktif' ? 'Pembelian paket berhasil! Kuota Anda sekarang aktif.' : 'Pesanan dibuat! Silakan bayar dan konfirmasi.',
      transaksiId: docRef.id,
      status,
      paymentCode: kodePembayaran
    };
  } catch (error: any) {
    console.error('Error in beliPaket:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan saat membeli paket' };
  }
}

/**
 * Admin Confirms Pending Payment
 */
export async function konfirmasiPembayaran(transaksiId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'transaksi', transaksiId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    const data = snap.data() as Transaksi;
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + data.durasi_jam * 60 * 60 * 1000).toISOString();

    await updateDoc(docRef, {
      status: 'aktif',
      waktu_mulai: startTime,
      waktu_berakhir: endTime,
      sisa_kuota_mb: data.batas_mb,
      updated_at: startTime
    });

    await kirimNotifikasi(
      data.user_id,
      'Pembayaran Dikonfirmasi ✅',
      `Pembayaran paket ${data.paket_nama} telah dikonfirmasi oleh Admin! Kuota Anda sudah aktif.`
    );

    return true;
  } catch (err) {
    console.error('Error confirming payment:', err);
    return false;
  }
}

/**
 * Get Active Transaction for User
 */
export async function getTransaksiAktif(userId: string): Promise<Transaksi | null> {
  try {
    const q = query(
      collection(db, 'transaksi'),
      where('user_id', '==', userId),
      where('status', '==', 'aktif')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    // Check expiration
    const now = new Date().getTime();
    for (const d of snap.docs) {
      const tx = { id: d.id, ...(d.data() as Record<string, any>) } as Transaksi;
      const endTime = new Date(tx.waktu_berakhir).getTime();
      
      // If time expired or quota exhausted (if limited)
      if (now >= endTime) {
        await updateDoc(doc(db, 'transaksi', tx.id), { status: 'expired', updated_at: new Date().toISOString() });
        await kirimNotifikasi(userId, 'Masa Aktif Habis ⏰', `Masa aktif paket ${tx.paket_nama} Anda telah berakhir.`);
      } else if (tx.batas_mb > 0 && tx.sisa_kuota_mb <= 0) {
        await updateDoc(doc(db, 'transaksi', tx.id), { status: 'habis', updated_at: new Date().toISOString() });
        await kirimNotifikasi(userId, 'Kuota Habis ⚠️', `Kuota data paket ${tx.paket_nama} Anda telah habis.`);
      } else {
        return tx;
      }
    }

    return null;
  } catch (err) {
    console.error('Error getting active transaction:', err);
    return null;
  }
}

/**
 * Get Transaction History
 */
export async function getRiwayatTransaksi(userId?: string, maxItems: number = 20): Promise<Transaksi[]> {
  try {
    const txRef = collection(db, 'transaksi');
    let q;
    if (userId) {
      q = query(txRef, where('user_id', '==', userId), limit(maxItems));
    } else {
      q = query(txRef, limit(maxItems));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as Transaksi));
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error('Error getting history:', err);
    return [];
  }
}

/**
 * Simulate Realtime Traffic Usage (Simulasi Pemakaian Data)
 */
export async function simulateUsage(transaksiId: string, userId: string, mbUsed: number): Promise<void> {
  try {
    const txRef = doc(db, 'transaksi', transaksiId);
    const snap = await getDoc(txRef);
    if (!snap.exists()) return;

    const tx = snap.data() as Transaksi;
    if (tx.status !== 'aktif') return;

    const now = new Date();
    const isUnlimited = tx.batas_mb === 0;

    let newSisa = tx.sisa_kuota_mb;
    let newTotal = (tx.total_pemakaian_mb || 0) + mbUsed;
    let newStatus: StatusTransaksi = 'aktif';

    if (!isUnlimited) {
      newSisa = Math.max(0, tx.sisa_kuota_mb - mbUsed);
      if (newSisa === 0) {
        newStatus = 'habis';
      }
    }

    // Check time expiration
    if (now.getTime() >= new Date(tx.waktu_berakhir).getTime()) {
      newStatus = 'expired';
    }

    await updateDoc(txRef, {
      sisa_kuota_mb: newSisa,
      total_pemakaian_mb: newTotal,
      status: newStatus,
      updated_at: now.toISOString()
    });

    // Log pemakaian
    await addDoc(collection(db, 'pemakaian'), {
      transaksi_id: transaksiId,
      user_id: userId,
      pemakaian_mb: mbUsed,
      waktu: now.toISOString(),
      keterangan: 'Simulasi traffic jaringan'
    });

    // Warning notifications for low quota (<10%)
    if (!isUnlimited && newStatus === 'aktif' && tx.batas_mb > 0) {
      const percentageLeft = (newSisa / tx.batas_mb) * 100;
      const prevPercentage = (tx.sisa_kuota_mb / tx.batas_mb) * 100;
      if (prevPercentage > 10 && percentageLeft <= 10) {
        await kirimNotifikasi(
          userId,
          'Peringatan Kuota ⚠️',
          `Sisa kuota internet Anda tinggal ${percentageLeft.toFixed(1)}% (${newSisa.toFixed(0)} MB). Segera perpanjang agar tetap terhubung!`
        );
      }
    }

    if (newStatus === 'habis') {
      await kirimNotifikasi(userId, 'Kuota Habis 🚫', `Kuota internet paket ${tx.paket_nama} Anda telah habis.`);
    } else if (newStatus === 'expired') {
      await kirimNotifikasi(userId, 'Masa Aktif Habis ⏰', `Masa aktif paket ${tx.paket_nama} Anda telah berakhir.`);
    }
  } catch (err) {
    console.error('Error simulating usage:', err);
  }
}

/**
 * Notifications Services
 */
export async function kirimNotifikasi(userId: string, judul: string, pesan: string): Promise<string> {
  const notifRef = collection(db, 'notifikasi');
  const docRef = await addDoc(notifRef, {
    user_id: userId,
    judul,
    pesan,
    dibaca: false,
    created_at: new Date().toISOString()
  });
  return docRef.id;
}

export async function getNotifikasiUser(userId: string): Promise<NotifikasiItem[]> {
  try {
    const notifRef = collection(db, 'notifikasi');
    const q = query(notifRef, where('user_id', 'in', [userId, 'admin_group']), limit(30));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as NotifikasiItem));
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function tandaiBacaNotifikasi(notifId: string): Promise<void> {
  const docRef = doc(db, 'notifikasi', notifId);
  await updateDoc(docRef, { dibaca: true });
}

/**
 * CSV Export Utility
 */
export function exportTransaksiCSV(transactions: Transaksi[]) {
  const headers = ['ID Transaksi', 'Email User', 'Nama User', 'Nama Paket', 'Harga (Rp)', 'Status', 'Waktu Mulai', 'Waktu Berakhir', 'Total Pemakaian (MB)', 'Metode'];
  const rows = transactions.map(t => [
    t.id,
    t.user_email,
    t.user_nama || '-',
    t.paket_nama,
    t.harga,
    t.status,
    t.waktu_mulai,
    t.waktu_berakhir,
    t.total_pemakaian_mb,
    t.metode_pembayaran
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Transaksi_WifiKuota_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
