# EMFE 3 SmartApart V17 Firebase

- Firebase Authentication e-posta/şifre girişi eklendi.
- Firestore bulut kayıt sistemi eklendi.
- Daire, ödeme, gider ve ekstra gelir verileri `smartApartData/emfe3-main` dokümanında saklanır.
- Yönetici adı: Turgut Yiğit.
- Demo kayıtlar boş bırakılmıştır.
- GitHub Pages / PWA uyumludur.

## Firebase
Authentication > Users bölümünde yönetici kullanıcısını oluşturun.
Firestore Rules için önerilen başlangıç kuralı:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /smartApartData/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
