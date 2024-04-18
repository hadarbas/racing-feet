// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzhAhyFEEksf3SVOClUPqC2WYVs93Chk8",
  authDomain: "racing-feet.firebaseapp.com",
  projectId: "racing-feet",
  storageBucket: "racing-feet.appspot.com",
  messagingSenderId: "261012468331",
  appId: "1:261012468331:web:d5ef1ca6167099f37a772e",
  measurementId: "G-D3K8FBWHHW"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);