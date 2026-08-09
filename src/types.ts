export type Role = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  nama: string;
  role: Role;
  saldo: number;
  no_hp: string;
  created_at: string;
}

export interface PaketKuota {
  id: string;
  nama: string;
  harga: number;
  durasi_jam: number;
  batas_mb: number; // 0 for unlimited
  kecepatan: string;
  aktif: boolean;
  created_at?: string;
}

export type StatusTransaksi = 'aktif' | 'habis' | 'expired' | 'pending';
export type MetodePembayaran = 'saldo' | 'qris' | 'transfer' | 'cash';

export interface Transaksi {
  id: string;
  user_id: string;
  user_email: string;
  user_nama?: string;
  paket_id: string;
  paket_nama: string;
  harga: number;
  batas_mb: number;
  durasi_jam: number;
  status: StatusTransaksi;
  waktu_mulai: string;
  waktu_berakhir: string;
  sisa_kuota_mb: number;
  total_pemakaian_mb: number;
  metode_pembayaran: MetodePembayaran;
  kode_pembayaran?: string;
  created_at: string;
  updated_at: string;
}

export interface PemakaianLog {
  id: string;
  transaksi_id: string;
  user_id: string;
  pemakaian_mb: number;
  waktu: string;
  keterangan: string;
}

export interface NotifikasiItem {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  dibaca: boolean;
  created_at: string;
}

export interface VaAccountConfig {
  bank: string;
  account_number: string;
  account_name: string;
  enabled: boolean;
}

export interface EwalletAccountConfig {
  provider: string;
  phone_number: string;
  account_name: string;
  enabled: boolean;
}

export interface PaymentConfig {
  qris_url: string;
  qris_merchant_name: string;
  qris_nmid: string;
  va_accounts: VaAccountConfig[];
  ewallet_accounts: EwalletAccountConfig[];
  instructions: string;
}

export interface KonfigurasiWifi {
  id: string;
  nama_wifi: string;
  welcome_message: string;
  logo_url: string;
  pembayaran?: PaymentConfig;
  updated_at?: string;
}

export interface RealtimeUsageState {
  user_id: string;
  transaksi_aktif: {
    id: string;
    sisa_kuota_mb: number;
    waktu_berakhir: string;
    persentase: number;
    kecepatan: string;
    nama_paket: string;
  } | null;
  last_update: string;
  online_status?: boolean;
}

export type PageView = 
  | 'login-register'
  | 'landing'
  | 'dashboard'
  | 'marketplace'
  | 'riwayat'
  | 'profil'
  | 'admin'
  | 'topup';

export type AdminTab = 
  | 'dashboard'
  | 'paket'
  | 'user'
  | 'transaksi'
  | 'konfigurasi';
