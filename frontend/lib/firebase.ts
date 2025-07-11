import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDnHRaeWEjuUwT9P6WscIw22Nng7HBGUQg",
  authDomain: "social-network-9595f.firebaseapp.com",
  projectId: "social-network-9595f",
  storageBucket: "social-network-9595f.firebasestorage.app",
  messagingSenderId: "1049757706944",
  appId: "1:1049757706944:web:376a38be93c20beb06db25"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };