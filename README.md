# EMFE 3 SmartApart V15

- Sağ üstte profesyonel **Developed by Hüseyin Yıldız** rozeti eklendi.
- Borçlu Daire kartındaki **Listele** yazısı kaldırıldı.
- Borçlu Daire kartının tamamı tıklanabilir kaldı.
- Mevcut V14 özellikleri korunur.
- GitHub Pages / PWA uyumludur.


## V16 Firebase Bulut Kayıt
- `firebase-config.js` dosyası eklendi.
- Firebase aktif edilirse daireler, ödemeler, giderler ve ekstra gelirler Firestore'a kaydedilir.
- Telefon / PC değişiminde aynı Firebase projesiyle veriler geri gelir.
- Firebase kapalıysa sistem eski şekilde localStorage ile çalışır.

### Kurulum
1. Firebase Console'da proje oluştur.
2. Web App config bilgilerini `firebase-config.js` içine yaz.
3. `enabled: false` değerini `enabled: true` yap.
4. Firestore Database'i oluştur.
5. Authentication bölümünden Anonymous veya Email/Password girişini aç.
