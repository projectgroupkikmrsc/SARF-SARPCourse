# Kalkulator Vektor Navigasi Nautika (Web App)

Aplikasi web interaktif khas untuk pembelajaran navigasi maritim dan pelayaran nautika. Diterjemah dan dinaik taraf daripada kod MATLAB asal kepada aplikasi web moden yang boleh diakses melalui pelayar web komputer riba mahupun telefon pintar.

---

## 🌟 Ciri-Ciri Utama

1. **Carta Navigasi Interaktif (HTML5 Canvas 60 FPS)**:
   - Paparan kompas maritim 360° dengan tanda arah kardinal (Utara, Timur, Selatan, Barat).
   - Fungsi **Pan** (seret tetikus / sentuhan jari) dan **Zoom** (skrol tetikus / pinch-to-zoom).
   - Garis grid marin berskala dinamik dalam unit **Batu Nautika (NM)**.
   - Titik mula di Origin $(0,0)$, titik-titik laluan (*Waypoints*), dan anak panah penunjuk haluan.
   - Vektor paduan (*Resultant*) dipaparkan dengan garis putus-putus merah tebal dan anak panah berganda.

2. **Pengurusan Vektor Fleksibel**:
   - Tambah berbilang vektor secara berantai (*head-to-tail*).
   - Senarai jadual vektor lengkap dengan nilai $\Delta X$ (Timur) dan $\Delta Y$ (Utara).
   - Butang **Padam Vektor** individu tanpa perlu *reset* keseluruhan plot (penambahbaikan utama berbanding MATLAB).

3. **Formula & Skala Carta Kertas A4**:
   - Pengiraan **Haluan Paduan (Bearing)** dalam format maritim rasmi 3-digit (cth: $045^\circ$, $278.4^\circ$).
   - Pengiraan **Jarak Terus (Resultant Distance)** dan jumlah keseluruhan jarak pelayaran (*Total Track*).
   - Pengiraan automatik **Skala Kertas Plotting A4** (format standard $18 \times 26\text{ cm}$):
     - $1\text{ cm} = X\text{ NM}$
     - $2\text{ cm} = Y\text{ NM}$
   - Kotak **Langkah & Formula Pengiraan** interaktif untuk rujukan dan semakan jalan kerja pelajar.

4. **Fasiliti Pengajaran & Tugasan Pelajar**:
   - **Butang Contoh Latihan**: Memuatkan contoh senario SAR / pelayaran 3-leg dengan satu klik.
   - **Simpan Imej (PNG)**: Muat turun carta terus ke fail imej untuk laporan.
   - **Cetak A4**: Susun atur mesra cetakan (*print-ready*) untuk pelajar mencetak lembaran kerja.

---

## 📐 Konvensyen Matematik Maritim yang Digunakan

* **Bearing Maritim ($B$)**:
  - $000^\circ$ = Utara (Paksi $+Y$)
  - $090^\circ$ = Timur (Paksi $+X$)
  - $180^\circ$ = Selatan (Paksi $-Y$)
  - $270^\circ$ = Barat (Paksi $-X$)

* **Penukaran ke Sudut Matematik ($\theta$)**:
  $$\theta = 90^\circ - B$$

* **Komponen Koordinat**:
  $$\Delta X = L \times \cos(\theta)$$
  $$\Delta Y = L \times \sin(\theta)$$

* **Jarak Paduan ($R$)**:
  $$R = \sqrt{(\sum \Delta X)^2 + (\sum \Delta Y)^2}$$

* **Haluan Paduan**:
  $$\text{Bearing Paduan} = (90^\circ - \text{atan2d}(\sum \Delta Y, \sum \Delta X) + 360^\circ) \pmod{360^\circ}$$

---

## 🚀 Cara Menjalankan Secara Tempatan (Offline)

Aplikasi ini dibina dengan Web Standard tanpa sebarang perisian tambahan:
1. Masuk ke folder `Vector Calculator`.
2. Klik dua kali (*double-click*) pada fail **`index.html`**.
3. Aplikasi akan terus dibuka dalam Google Chrome, Microsoft Edge, atau pelayar web pilihan anda.

---

## 🌐 Cara Publish Percuma ke Vercel (Online untuk Pelajar)

Anda boleh *publish* laman web ini secara percuma supaya pelajar boleh buka link web tersebut di mana-mana sahaja.

### Kaedah 1: Menggunakan GitHub + Vercel (Paling Disyorkan)
1. Cipta akaun percuma di [vercel.com](https://vercel.com) (Log masuk guna akaun GitHub atau emel).
2. Muat naik (push) folder `Vector Calculator` ini ke repositori baharu di GitHub anda.
3. Di dashboard Vercel, klik **"Add New..."** $\rightarrow$ **"Project"**.
4. Pilih repositori GitHub tadi dan klik **"Deploy"**.
5. Dalam masa beberapa saat, anda akan mendapat pautan web (cth: `https://vector-calculator.vercel.app`) yang sedia untuk dikongsikan kepada pelajar!

### Kaedah 2: Menggunakan Vercel CLI (Terus dari Terminal)
1. Buka Terminal / PowerShell di folder ini.
2. Jalankan arahan:
   ```bash
   npx vercel
   ```
3. Ikuti arahan pada skrin (tekan Enter untuk pilihan default).
4. Link online sedia untuk digunakan.

