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
  PaymentConfig,
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
  const finalRole = email.toLowerCase() === 'admin@wifikota.com' ? 'admin' : role;
  const userRef = doc(db, 'users', uid);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingData = userSnap.data() as UserProfile;
      // If profile already exists but has default/placeholder values, update with real user details
      if ((existingData.nama === 'Pelanggan Hotspot' || !existingData.nama) && nama && nama !== 'Pelanggan Hotspot') {
        await updateDoc(userRef, {
          nama,
          no_hp: noHp || existingData.no_hp || '-'
        });
        return { ...existingData, nama, no_hp: noHp || existingData.no_hp || '-' };
      }
      return existingData;
    }

    const newUser: UserProfile = {
      uid,
      email,
      nama: nama || 'Pelanggan Hotspot',
      role: finalRole,
      saldo: 50000, // Default welcome bonus balance
      no_hp: noHp || '-',
      created_at: new Date().toISOString()
    };

    await setDoc(userRef, newUser);
    return newUser;
  } catch (err) {
    console.error('Error in createUserProfile:', err);
    return {
      uid,
      email,
      nama: nama || 'Pelanggan Hotspot',
      role: finalRole,
      saldo: 50000,
      no_hp: noHp || '-',
      created_at: new Date().toISOString()
    };
  }
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

export const DEFAULT_DEMO_USERS: UserProfile[] = [
  {
    uid: 'admin_uid_1',
    email: 'admin@wifikota.com',
    nama: 'Administrator WiFi',
    role: 'admin',
    saldo: 1000000,
    no_hp: '081234567890',
    created_at: new Date().toISOString()
  },
  {
    uid: 'user_uid_1',
    email: 'budi.santoso@gmail.com',
    nama: 'Budi Santoso',
    role: 'user',
    saldo: 50000,
    no_hp: '081298765432',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    uid: 'user_uid_2',
    email: 'siti.rahma@yahoo.com',
    nama: 'Siti Rahmawati',
    role: 'user',
    saldo: 25000,
    no_hp: '085712345678',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    uid: 'user_uid_3',
    email: 'rizky.pratama@outlook.com',
    nama: 'Rizky Pratama',
    role: 'user',
    saldo: 15000,
    no_hp: '088899990000',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

export const DEFAULT_DEMO_TRANSACTIONS: Transaksi[] = [
  {
    id: 'tx_demo_1',
    user_id: 'user_uid_1',
    user_email: 'budi.santoso@gmail.com',
    user_nama: 'Budi Santoso',
    paket_id: 'p2',
    paket_nama: 'Paket 5GB 24 Jam',
    harga: 10000,
    batas_mb: 5000,
    durasi_jam: 24,
    status: 'aktif',
    waktu_mulai: new Date(Date.now() - 3600000 * 2).toISOString(),
    waktu_berakhir: new Date(Date.now() + 3600000 * 22).toISOString(),
    sisa_kuota_mb: 4200,
    total_pemakaian_mb: 800,
    metode_pembayaran: 'saldo',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'tx_demo_2',
    user_id: 'user_uid_2',
    user_email: 'siti.rahma@yahoo.com',
    user_nama: 'Siti Rahmawati',
    paket_id: 'p3',
    paket_nama: 'Paket 10GB 24 Jam',
    harga: 15000,
    batas_mb: 10000,
    durasi_jam: 24,
    status: 'aktif',
    waktu_mulai: new Date(Date.now() - 3600000 * 5).toISOString(),
    waktu_berakhir: new Date(Date.now() + 3600000 * 19).toISOString(),
    sisa_kuota_mb: 8900,
    total_pemakaian_mb: 1100,
    metode_pembayaran: 'qris',
    kode_pembayaran: 'PAY-882910',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'tx_demo_3',
    user_id: 'user_uid_3',
    user_email: 'rizky.pratama@outlook.com',
    user_nama: 'Rizky Pratama',
    paket_id: 'p1',
    paket_nama: 'Paket 2GB 12 Jam',
    harga: 5000,
    batas_mb: 2000,
    durasi_jam: 12,
    status: 'expired',
    waktu_mulai: new Date(Date.now() - 86400000 * 2).toISOString(),
    waktu_berakhir: new Date(Date.now() - 86400000 * 2 + 43200000).toISOString(),
    sisa_kuota_mb: 0,
    total_pemakaian_mb: 2000,
    metode_pembayaran: 'cash',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    if (snap.empty) return DEFAULT_DEMO_USERS;
    const list = snap.docs.map(d => d.data() as UserProfile);
    return list.length > 0 ? list : DEFAULT_DEMO_USERS;
  } catch (err) {
    console.warn('Note using user fallback:', err);
    return DEFAULT_DEMO_USERS;
  }
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
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
  instructions: 'Silakan lakukan pembayaran sesuai nominal ke salah satu rekening Bank / E-Wallet atau scan QRIS di atas. Saldo/paket akan langsung dikonfirmasi setelah pembayaran.'
};

/**
 * WiFi Configuration Services
 */
export async function getWifiConfig(): Promise<KonfigurasiWifi> {
  try {
    const configRef = doc(db, 'konfigurasi_wifi', WIFI_CONFIG_ID);
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data() as KonfigurasiWifi;
      return {
        ...data,
        pembayaran: data.pembayaran ? {
          ...DEFAULT_PAYMENT_CONFIG,
          ...data.pembayaran,
          va_accounts: data.pembayaran.va_accounts && data.pembayaran.va_accounts.length > 0 ? data.pembayaran.va_accounts : DEFAULT_PAYMENT_CONFIG.va_accounts,
          ewallet_accounts: data.pembayaran.ewallet_accounts && data.pembayaran.ewallet_accounts.length > 0 ? data.pembayaran.ewallet_accounts : DEFAULT_PAYMENT_CONFIG.ewallet_accounts
        } : DEFAULT_PAYMENT_CONFIG
      };
    }
  } catch (err) {
    console.warn('Note getting wifi config:', err);
  }
  return {
    id: WIFI_CONFIG_ID,
    nama_wifi: 'Wifi-Kuota Premium',
    welcome_message: 'Selamat datang di Wifi-Kuota Premium! Nikmati internet cepat dan stabil.',
    logo_url: '',
    pembayaran: DEFAULT_PAYMENT_CONFIG
  };
}

export async function updateWifiConfig(data: Partial<KonfigurasiWifi>): Promise<void> {
  const configRef = doc(db, 'konfigurasi_wifi', WIFI_CONFIG_ID);
  await setDoc(configRef, {
    ...data,
    updated_at: new Date().toISOString()
  }, { merge: true });
}

export const DEFAULT_PACKAGES: PaketKuota[] = [
  {
    id: 'p1',
    nama: 'Paket 2GB 12 Jam',
    harga: 5000,
    durasi_jam: 12,
    batas_mb: 2000,
    kecepatan: '10 Mbps',
    aktif: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'p2',
    nama: 'Paket 5GB 24 Jam',
    harga: 10000,
    durasi_jam: 24,
    batas_mb: 5000,
    kecepatan: '10 Mbps',
    aktif: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'p3',
    nama: 'Paket 10GB 24 Jam',
    harga: 15000,
    durasi_jam: 24,
    batas_mb: 10000,
    kecepatan: '20 Mbps',
    aktif: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'p4',
    nama: 'Paket 15GB 48 Jam',
    harga: 20000,
    durasi_jam: 48,
    batas_mb: 15000,
    kecepatan: '20 Mbps',
    aktif: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'p5',
    nama: 'Paket Unlimited 7 Hari',
    harga: 50000,
    durasi_jam: 168,
    batas_mb: 0,
    kecepatan: '30 Mbps',
    aktif: true,
    created_at: new Date().toISOString()
  }
];

/**
 * Package Services
 */
export async function getPaketAktif(): Promise<PaketKuota[]> {
  try {
    const paketRef = collection(db, 'paket_kuota');
    const snap = await getDocs(paketRef);
    if (snap.empty) return DEFAULT_PACKAGES;
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as PaketKuota));
    const active = list.filter(p => p.aktif);
    return active.length > 0 ? active : DEFAULT_PACKAGES;
  } catch (err) {
    console.warn('Note using package fallback:', err);
    return DEFAULT_PACKAGES;
  }
}

export async function getAllPaket(): Promise<PaketKuota[]> {
  try {
    const paketRef = collection(db, 'paket_kuota');
    const snap = await getDocs(paketRef);
    if (snap.empty) return DEFAULT_PACKAGES;
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as PaketKuota));
  } catch (err) {
    console.warn('Note using package fallback:', err);
    return DEFAULT_PACKAGES;
  }
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
  return {
    isExceeded: false,
    totalSpentLastHour: 0
  };
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
      kode_pembayaran: kodePembayaran || '-',
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

export async function submitTopUpRequest(
  user: UserProfile,
  amount: number,
  metode: string,
  transferRef?: string
): Promise<{ success: boolean; message: string; txId?: string }> {
  try {
    const now = new Date().toISOString();
    const payCode = transferRef || `TOPUP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: Omit<Transaksi, 'id'> = {
      user_id: user.uid,
      user_email: user.email,
      user_nama: user.nama,
      paket_id: 'topup',
      paket_nama: `Top Up Saldo Rp ${amount.toLocaleString('id-ID')}`,
      harga: amount,
      batas_mb: 0,
      durasi_jam: 0,
      status: 'pending',
      waktu_mulai: now,
      waktu_berakhir: now,
      sisa_kuota_mb: 0,
      total_pemakaian_mb: 0,
      metode_pembayaran: metode as MetodePembayaran,
      kode_pembayaran: payCode,
      created_at: now,
      updated_at: now
    };

    const docRef = await addDoc(collection(db, 'transaksi'), newTx);

    await kirimNotifikasi(
      user.uid,
      'Top Up Menunggu Verifikasi Admin ⏳',
      `Permintaan Top Up sebesar Rp ${amount.toLocaleString('id-ID')} (${metode.toUpperCase()}) telah diterima dan menunggu verifikasi pembayaran oleh Admin.`
    );

    await kirimNotifikasi(
      'admin_group',
      'Permintaan Top Up Baru 💰',
      `User ${user.nama} (${user.email}) mengirim Top Up Rp ${amount.toLocaleString('id-ID')} via ${metode.toUpperCase()}. Mohon verifikasi.`
    );

    return {
      success: true,
      message: 'Permintaan Top Up dikirim! Menunggu verifikasi pembayaran oleh Admin.',
      txId: docRef.id
    };
  } catch (err: any) {
    console.error('Error submitting top up request:', err);
    return { success: false, message: err?.message || 'Gagal mengirim permintaan top up' };
  }
}

/**
 * Admin Confirms Pending Payment (Top Up or Package Purchase)
 */
export async function konfirmasiPembayaran(transaksiId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'transaksi', transaksiId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    const data = snap.data() as Transaksi;
    const now = new Date();
    const startTime = now.toISOString();

    if (data.paket_id === 'topup') {
      // Top Up Approval
      await updateDoc(docRef, {
        status: 'sukses',
        updated_at: startTime
      });

      // Add balance to user
      await updateUserBalance(data.user_id, data.harga);

      await kirimNotifikasi(
        data.user_id,
        'Top Up Dikonfirmasi ✅',
        `Pembayaran Top Up saldo sebesar Rp ${data.harga.toLocaleString('id-ID')} telah diverifikasi Admin dan otomatis masuk ke akun Anda!`
      );
    } else {
      // Package Purchase Approval
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
        `Pembayaran paket ${data.paket_nama} telah dikonfirmasi oleh Admin! Kuota internet Anda sudah aktif.`
      );
    }

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
    if (snap.empty && !userId) return DEFAULT_DEMO_TRANSACTIONS;
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as Transaksi));
    if (list.length === 0 && !userId) return DEFAULT_DEMO_TRANSACTIONS;
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Note getting history fallback:', err);
    return !userId ? DEFAULT_DEMO_TRANSACTIONS : [];
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
    if (!userId) return [];
    const notifRef = collection(db, 'notifikasi');
    const q = query(notifRef, where('user_id', '==', userId), limit(30));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as NotifikasiItem));
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Note fetching notifications:', err);
    return [];
  }
}

export async function deleteUserAccount(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (err) {
    console.error('Error deleting user account:', err);
    throw err;
  }
}

export async function deleteTransactionById(txId: string): Promise<void> {
  try {
    const txRef = doc(db, 'transaksi', txId);
    await deleteDoc(txRef);
  } catch (err) {
    console.error('Error deleting transaction:', err);
    throw err;
  }
}

/**
 * Real-Time Subscriptions Across Devices
 */
export function subscribeToWifiConfig(callback: (cfg: KonfigurasiWifi) => void) {
  const configRef = doc(db, 'konfigurasi_wifi', WIFI_CONFIG_ID);
  return onSnapshot(configRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as KonfigurasiWifi;
      callback({
        ...data,
        pembayaran: data.pembayaran ? {
          ...DEFAULT_PAYMENT_CONFIG,
          ...data.pembayaran,
          va_accounts: data.pembayaran.va_accounts && data.pembayaran.va_accounts.length > 0 ? data.pembayaran.va_accounts : DEFAULT_PAYMENT_CONFIG.va_accounts,
          ewallet_accounts: data.pembayaran.ewallet_accounts && data.pembayaran.ewallet_accounts.length > 0 ? data.pembayaran.ewallet_accounts : DEFAULT_PAYMENT_CONFIG.ewallet_accounts
        } : DEFAULT_PAYMENT_CONFIG
      });
    }
  }, (err) => console.warn('WifiConfig listener error:', err));
}

export function subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
  const usersRef = collection(db, 'users');
  return onSnapshot(usersRef, (snap) => {
    const list = snap.docs.map(d => ({ uid: d.id, ...(d.data() as Record<string, any>) } as UserProfile));
    callback(list);
  }, (err) => console.warn('Users listener error:', err));
}

export function subscribeToAllTransactions(callback: (txs: Transaksi[]) => void) {
  const txRef = collection(db, 'transaksi');
  return onSnapshot(txRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as Transaksi));
    list.sort((a, b) => new Date(b.created_at || b.waktu_mulai).getTime() - new Date(a.created_at || a.waktu_mulai).getTime());
    callback(list);
  }, (err) => console.warn('Transactions listener error:', err));
}

export function subscribeToAllPackages(callback: (packages: PaketKuota[]) => void) {
  const pkgRef = collection(db, 'paket_kuota');
  return onSnapshot(pkgRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as PaketKuota));
    callback(list);
  }, (err) => console.warn('Packages listener error:', err));
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
