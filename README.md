# 📲 StaffApp - Personel Giriş/Çıkış ve İzin Takip Sistemi


![StaffApp Logo](./assets/images/appicon.png)

**StaffApp**, kurum personelinin günlük giriş/çıkış işlemlerini QR kod ile dijital olarak kayıt altına alan ve izin/ders doldurma taleplerini yöneten mobil uygulamadır. Hem kullanıcılar (personeller) hem de yöneticiler (admin) için optimize edilmiş iki ayrı panel içerir.

---

## 🧱 Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![EAS Build](https://img.shields.io/badge/EAS_Build-4630EB?style=for-the-badge&logo=expo&logoColor=white)

---

## 🚀 Özellikler

- ✅ **QR Kod ile Giriş/Çıkış Takibi**
  - Her gün yöneticinin oluşturduğu QR kod ile personel, giriş/çıkış yapar.
  - Tüm loglar tarih ve saat bilgisiyle kaydedilir.

- 📅 **İzin ve Ders Doldurma Modülü**
  - Personel izin talebi gönderir.
  - Yönetici, izin saatinde dersi kimin devralacağını manuel girer.

- 🔒 **Gerçek Zamanlı Supabase Entegrasyonu**
  - Tüm veriler Supabase Postgres veritabanında tutulur.
  - Gerçek zamanlı kayıt ve admin panelinde anında görüntüleme.

- 🌗 **Modern ve Şık Arayüz**
  - React Native + Expo ile geliştirildi.
  - iOS ve Android desteği.

---

## 🛠️ Teknolojiler

| Katman       | Teknoloji                     |
|--------------|-------------------------------|
| Mobil        | React Native + Expo           |
| Backend      | Supabase (Auth, DB, Storage)  |
| State        | React Hooks + Context         |
| Build        | EAS Build / OTA Updates       |
| Veritabanı   | PostgreSQL (Supabase)         |
| QR / Kamera  | Expo Camera & QR Scanner      |

---

## 🏗️ Proje Yapısı (YAML Formatında)

```
staffapp/
  app/: # Sayfa ve yönlendirme sistemi (expo-router)
  assets/: # Uygulama ikonları, splash ekranı, arka plan görselleri
  lib/:
    supabase.ts: # Supabase client ve auth yapılandırması
  components/: # Özel oluşturulmuş component'lar
  .env: # Supabase URL ve Anon Key ortam değişkenleri
  app.config.js: # Expo yapılandırması, EAS için ortam değişkenleri okunur
  eas.json: # Build ortamları (development, preview, production) yapılandırması
```

## 🔐 Güvenlik

- Supabase projesinde **Row Level Security (RLS)** aktif .
- Giriş/çıkış ve izin loglarında **yalnızca yetkili kullanıcılar** işlem yapabilir.
- `.env` dosyası build'e **gömülmez**, yalnızca `EXPO_PUBLIC_` prefix'li environment değişkenleri uygulamaya alınır.

---

## 👥 Katkı Sağlamak

✨ Pull request ve katkılara açığız!

- Öneri, hata bildirimi veya geliştirme için **issue açabilirsin**.
- Lütfen açıklayıcı commit mesajları kullan ve mümkünse ekran görüntüsü ekle.

---
## 📸 Ekran Görüntüleri

Aşağıda uygulamanın bazı temel ekran görüntüleri yer almaktadır:

### 🔐 Giriş Ekranı
Kullanıcıların uygulamaya erişim sağladığı basit ve güvenli giriş arayüzü.

![Giriş Ekranı](./assets/screenshots/login.png)

---

### 📷 Ana Sayfa
Admin'in bütün istatistikleri görebildiği ve yönetimlere erişebildiği arayüz.

![Ana Sayfa](./assets/screenshots/admin.png)

---

### 🧑‍💼 Admin Paneli
Yöneticilerin günlük QR kod oluşturduğu, giriş/çıkışları ve izinleri görüntülediği panel.

![Admin Panel](./assets/screenshots/ap1.png)

---

### 📝 İzin Talep Formu
Personellerin ders saati ve neden belirterek izin başvurusunda bulunduğu ekran.

![İzin Talep Ekranı](./assets/screenshots/izin.png)

---

### 📊 Kayıt Listesi
Tarih ve personele göre filtrelenmiş giriş/çıkış kayıtlarının görüntülendiği log ekranı.

![Kayıt Listesi](./assets/screenshots/kayıt.png)

---

### 📊 Kullanıcı Ekranı
Kullanıcıların izin durumlarını görüntülediği ve karekodlarını okutabildiği arayüz.

![Kullanıcı Ekranı](./assets/screenshots/userhome.png)


