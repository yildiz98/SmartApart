// EMFE 3 SmartApart Firebase Ayarları
// 1) Firebase Console > Project settings > Web app config bilgilerini aşağıya yapıştır.
// 2) enabled değerini true yap.
// 3) Firestore Database'i oluştur.
// 4) Authentication > Sign-in method > Anonymous veya Email/Password aç.
//
// Not: adminEmail/adminPassword boş kalırsa anonim giriş kullanılır.

window.EMFE3_FIREBASE = {
  enabled: false,

  config: {
    apiKey: "BURAYA_API_KEY",
    authDomain: "BURAYA_PROJECT.firebaseapp.com",
    projectId: "BURAYA_PROJECT_ID",
    storageBucket: "BURAYA_PROJECT.appspot.com",
    messagingSenderId: "BURAYA_SENDER_ID",
    appId: "BURAYA_APP_ID"
  },

  // Firestore konumu: smartapart / emfe3
  collection: "smartapart",
  docId: "emfe3",

  // İstersen yönetici e-posta/şifre girişi kullan.
  // Boş bırakırsan anonim giriş dener.
  adminEmail: "",
  adminPassword: ""
};
