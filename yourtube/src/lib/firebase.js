// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPUX88K8CVdmnKHa1sNHOb9wKR_K6Svic",
  authDomain: "yourtube-67d90.firebaseapp.com",
  projectId: "yourtube-67d90",
  storageBucket: "yourtube-67d90.firebasestorage.app",
  messagingSenderId: "240619672276",
  appId: "1:240619672276:web:fbcca7f7ca3f7678b5e141"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
