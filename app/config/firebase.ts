import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  projectId: "gomygps-b521b",
  storageBucket: "gomygps-b521b.firebasestorage.app",
  apiKey: "AIzaSyBWHH-Pb8BADP0dPrHweqq0Xy3Lc5JAekg",
  appId: "1:625005645490:android:a89af6b2d712b47e68c3ab",
  messagingSenderId: "625005645490"
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;
isSupported().then(supported => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { app, messaging };
