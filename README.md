# WhatsApp Quotes Bot

Bot Node.js yang mengirim satu kutipan ke setiap penerima WhatsApp setiap hari. Jadwalnya diatur cron, sumber kutipannya berlapis (API utama, API cadangan, daftar lokal), teksnya diterjemahkan ke bahasa Indonesia sebelum dikirim, dan seluruh proses berjalan di atas Twilio.

## Cara kerja

1. `src/index.js` menyalakan server Express (untuk health check) lalu memanggil `startScheduler()`.
2. `schedulerService` membaca `src/data/recipients.json`, mengambil penerima dengan `active: true`, lalu memproses satu per satu.
3. `quotesService` mengambil kutipan sesuai `preferences` penerima dengan urutan cadangan:
   - API utama (`QUOTES_API_URL`)
   - API cadangan (`BACKUP_API_URL`)
   - daftar lokal `src/data/quotes.json`, difilter per kategori
   - kutipan darurat yang ditulis di kode
4. Teks kutipan diterjemahkan ke bahasa Indonesia lewat endpoint Google Translate publik sebelum dikirim.
5. `twilioService` mengirim pesan berformat `"<kutipan>"` diikuti baris `- <penulis>`.

Setiap langkah dicatat oleh `src/utils/logger.js` (winston) ke konsol dan ke berkas harian di `logs/`.

## Prasyarat

- Node.js 18 atau lebih baru (proyek memakai ES module)
- Akun Twilio dengan pengirim WhatsApp, baik sandbox maupun nomor produksi

## Instalasi

```bash
git clone https://github.com/kandarlubis31/whatsapp-quotes-bot.git
cd whatsapp-quotes-bot
npm install
```

Buat berkas `.env` di root proyek (berkas ini sudah diabaikan git) dan isi variabel berikut:

| Variabel | Wajib | Default | Keterangan |
| --- | --- | --- | --- |
| `TWILIO_ACCOUNT_SID` | ya | - | Account SID dari konsol Twilio |
| `TWILIO_AUTH_TOKEN` | ya | - | Auth token Twilio |
| `TWILIO_WHATSAPP_NUMBER` | ya | - | Nomor pengirim, format `whatsapp:+14155238886` |
| `QUOTES_API_URL` | tidak | - | API kutipan utama, lihat format respons di bawah |
| `BACKUP_API_URL` | tidak | - | API cadangan bila API utama gagal |
| `CRON_SCHEDULE` | tidak | `0 8 * * *` | Ekspresi cron, default setiap pukul 08.00 |
| `TIMEZONE` | tidak | `Asia/Jakarta` | Zona waktu penjadwal |
| `PORT` | tidak | `3000` | Port server health check |
| `LOG_LEVEL` | tidak | `info` | Level log winston |
| `LOG_FILE_MAX_SIZE` | tidak | `10m` | Ukuran maksimum satu berkas log |
| `LOG_MAX_FILES` | tidak | `7d` | Lama berkas log disimpan |
| `MAX_RETRY_ATTEMPTS` | tidak | `3` | Sudah dibaca konfigurasi, belum dipakai alur kirim |
| `RETRY_DELAY_MS` | tidak | `5000` | Idem, belum dipakai alur kirim |

## Menjalankan

```bash
npm start
```

Server berjalan di `PORT` dan langsung memasang jadwal cron. Untuk memastikan proses hidup:

```bash
curl http://localhost:3000/health
# {"status":"UP","timestamp":"..."}
```

## Format data

`src/data/recipients.json` menentukan siapa yang menerima kutipan:

```json
{
  "recipients": [
    {
      "id": "user_001",
      "name": "Nama Penerima",
      "phone": "whatsapp:+62812xxxxxxx",
      "timezone": "Asia/Jakarta",
      "active": true,
      "preferences": ["motivation", "wisdom"],
      "lastSent": null
    }
  ]
}
```

Hanya entri dengan `active: true` yang diproses. `preferences` berisi kategori yang dipakai untuk menyaring daftar lokal; bila tidak ada yang cocok, seluruh daftar dipakai.

`src/data/quotes.json` menyimpan kutipan cadangan:

```json
{
  "quotes": [
    {
      "text": "Isi kutipan.",
      "author": "Nama Penulis",
      "category": "motivation"
    }
  ]
}
```

API kutipan boleh mengembalikan salah satu dari dua bentuk: objek `{ "content": "...", "author": "..." }` atau array dengan `q` dan `a` pada elemen pertama.

## Catatan

- Kegagalan mengirim pesan hanya dicatat di log; pesan tidak dikirim ulang karena opsi retry belum diimplementasikan.
- Bila terjemahan gagal, kutipan asli tetap dikirim apa adanya.
- Pengambilan kutipan memakai `https.Agent` dengan `rejectUnauthorized: false`, sehingga verifikasi sertifikat dilewati. Sebaiknya opsi ini dihapus sebelum dipakai di lingkungan produksi.
- Berkas `.env`, `node_modules/`, dan `logs/` tidak ikut di-commit.

## English

A scheduled WhatsApp bot: once a day it picks a quote for each active recipient and sends it through Twilio.

- **Stack**: Node.js (ES modules), Express, node-cron, Twilio, axios, winston with daily rotating logs.
- **Quote sources**, tried in order: primary API, backup API, the local `src/data/quotes.json` list filtered by the recipient's `preferences`, then a hardcoded emergency quote. The chosen text is translated to Indonesian through a public Google Translate endpoint.
- **Recipients** live in `src/data/recipients.json`; entries with `active: false` are skipped.
- **Setup**: `npm install`, create a `.env` with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, optionally `QUOTES_API_URL`, `BACKUP_API_URL`, `CRON_SCHEDULE` (default `0 8 * * *`), `TIMEZONE` (default `Asia/Jakarta`), and `PORT` (default `3000`), then `npm start`.
- **Health check**: `GET /health` returns `{"status":"UP","timestamp":"..."}`.
- **Limitations**: failed sends are only logged (the retry settings in the config are not used yet), and quote fetching skips TLS certificate verification.

## Lisensi

ISC, sesuai `package.json`.
