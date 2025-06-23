# Push Notification Sistemi

Bu dokümanda personel takip uygulamasına entegre edilen push notification sisteminin nasıl çalıştığı ve nasıl kullanılacağı açıklanmaktadır.

## 🚀 Özellikler

### ✅ Desteklenen Özellikler

- **Uygulama Kapalıyken Bildirim**: Uygulama kapalı olsa bile bildirimler gelir
- **Badge Sayısı**: Okunmamış bildirim sayısı uygulama ikonunda görünür
- **Toplu Bildirim**: Admin'ler tüm kullanıcılara toplu bildirim gönderebilir
- **Otomatik Bildirimler**: İzin onayları, yeni kullanıcı kayıtları otomatik bildirim gönderir
- **Platform Desteği**: iOS, Android ve Web desteklenir

### 📱 Bildirim Türleri

1. **İzin Onayları**: İzin talepleri onaylandığında/reddedildiğinde
2. **Hoş Geldin**: Yeni kullanıcı kaydı yapıldığında
3. **Yeni İzin Talebi**: Admin'lere yeni izin talebi geldiğinde
4. **Geç Giriş Uyarısı**: Kullanıcı geç giriş yaptığında
5. **Duyuru**: Admin'lerin gönderdiği toplu bildirimler
6. **Sistem Bildirimleri**: Genel sistem bildirimleri

## 🛠️ Kurulum

### 1. Gerekli Paketler

```bash
npm install expo-notifications expo-device
```

### 2. App Config Güncellemesi

`app.config.js` dosyasına aşağıdaki ayarları ekleyin:

```javascript
plugins: [
  "expo-router",
  [
    "expo-notifications",
    {
      icon: "./assets/images/notification-icon.png",
      color: "#4c669f",
      sounds: ["./assets/sounds/notification.wav"],
    },
  ],
],
```

### 3. Veritabanı Migration

Supabase'de `user_push_tokens` tablosunu oluşturun:

```sql
-- Push token'ları saklamak için tablo
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    platform TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

## 📋 Kullanım

### Kullanıcı Girişi

Kullanıcı giriş yaptığında otomatik olarak push token alınır ve veritabanına kaydedilir:

```typescript
// Login sayfasında otomatik olarak çalışır
const pushToken = await PushNotificationService.getPushToken();
if (pushToken) {
  await PushNotificationService.savePushToken(userId, pushToken);
}
```

### Bildirim Gönderme

#### Tek Kullanıcıya Bildirim

```typescript
import { NotificationService } from "../lib/notificationService";

await NotificationService.createNotification(
  userId,
  "announcement",
  "Başlık",
  "Mesaj içeriği",
  { screen: "notifications" } // Opsiyonel: Tıklandığında gidilecek sayfa
);
```

#### Toplu Bildirim

```typescript
await NotificationService.createBulkNotification(
  userIds,
  "announcement",
  "Başlık",
  "Mesaj içeriği"
);
```

#### Özel Bildirim Türleri

```typescript
// İzin onayı/reddi
await NotificationService.createLeaveNotification(
  userId,
  leaveRequestId,
  leaveType,
  startDate,
  endDate,
  isApproved
);

// Yeni kullanıcı hoş geldin
await NotificationService.createNewUserNotification(userId, fullName);

// Admin'e yeni izin talebi
await NotificationService.createNewLeaveRequestNotification(
  adminIds,
  userName,
  leaveType,
  startDate,
  endDate
);

// Geç giriş uyarısı
await NotificationService.createLateEntryNotification(userId, entryTime);

// Admin duyurusu
await NotificationService.sendAdminAnnouncement(userIds, title, message);
```

### Admin Paneli - Toplu Bildirim

Admin panelinde "Toplu Bildirim" butonuna tıklayarak tüm kullanıcılara bildirim gönderebilirsiniz.

## 🔧 Konfigürasyon

### EAS Project ID

`pushNotificationService.ts` dosyasında EAS project ID'nizi güncelleyin:

```typescript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: "YOUR_EAS_PROJECT_ID", // Burayı güncelleyin
});
```

### Bildirim İkonu

`assets/images/notification-icon.png` dosyasını ekleyin (24x24px önerilen).

### Bildirim Sesi (Opsiyonel)

`assets/sounds/notification.wav` dosyasını ekleyin.

## 🚀 Production Build

### Android (APK)

```bash
eas build --platform android
```

### iOS (IPA)

```bash
eas build --platform ios
```

### Web

```bash
expo build:web
```

## 📊 Test Etme

### Development

1. Expo Go uygulaması ile test edebilirsiniz
2. Fiziksel cihazda test edin (emülatörde push notification çalışmaz)

### Production

1. APK/IPA build alın
2. Gerçek cihazda test edin
3. Uygulamayı kapatıp bildirim gönderin

## 🔍 Sorun Giderme

### Bildirim Gelmiyor

1. Push token'ın doğru kaydedildiğini kontrol edin
2. Cihaz izinlerini kontrol edin
3. EAS project ID'nin doğru olduğunu kontrol edin
4. Network bağlantısını kontrol edin

### Badge Sayısı Güncellenmiyor

1. `NotificationService.getNotificationCount()` fonksiyonunu kontrol edin
2. `PushNotificationService.setBadgeCount()` çağrısını kontrol edin

### Toplu Bildirim Çalışmıyor

1. Kullanıcı listesinin doğru alındığını kontrol edin
2. Push token'ların mevcut olduğunu kontrol edin
3. Expo push servisinin çalıştığını kontrol edin

## 📱 Platform Özellikleri

### Android

- Firebase Cloud Messaging (FCM) kullanır
- Arka planda çalışır
- Badge desteği var
- Ses ve titreşim desteği

### iOS

- Apple Push Notification Service (APNs) kullanır
- Arka planda çalışır
- Badge desteği var
- Ses desteği var

### Web

- Service Worker kullanır
- Tarayıcı desteği gerekli
- Sınırlı özellikler

## 🔒 Güvenlik

- Push token'lar kullanıcı bazında saklanır
- RLS (Row Level Security) aktif
- Admin'ler sadece gerekli token'lara erişebilir
- Token'lar kullanıcı silindiğinde otomatik silinir

## 📈 Performans

- Toplu bildirimler batch olarak gönderilir
- Token'lar cache'lenir
- Hata durumunda retry mekanizması
- Rate limiting uygulanır

## 🎯 Gelecek Özellikler

- [ ] Zamanlanmış bildirimler
- [ ] Bildirim kategorileri
- [ ] Bildirim tercihleri
- [ ] Ses özelleştirme
- [ ] Bildirim geçmişi
- [ ] Analytics entegrasyonu

## 📞 Destek

Herhangi bir sorun yaşarsanız:

1. Console loglarını kontrol edin
2. Expo dokümantasyonunu inceleyin
3. Supabase loglarını kontrol edin
4. Cihaz ayarlarını kontrol edin
