// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyA6Tlb7uro_2pD2lPEOMPEEq8eCSzcV7zo",
//   authDomain: "interview-mate-e61ad.firebaseapp.com",
//   projectId: "interview-mate-e61ad",
//   storageBucket: "interview-mate-e61ad.firebasestorage.app",
//   messagingSenderId: "666572928958",
//   appId: "1:666572928958:web:5c33b3f346828b9d08abef"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// firebase-config.js
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyA6Tlb7uro_2pD2lPEOMPEEq8eCSzcV7zo",
//   authDomain: "interview-mate-e61ad.firebaseapp.com",
//   projectId: "interview-mate-e61ad",
//   storageBucket: "interview-mate-e61ad.appspot.com",
//   messagingSenderId: "666572928958",
//   appId: "1:666572928958:web:5c33b3f346828b9d08abef"
// };

// // Initialize Firebase
// export const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6Tlb7uro_2pD2lPEOMPEEq8eCSzcV7zo",
  authDomain: "interview-mate-e61ad.firebaseapp.com",
  projectId: "interview-mate-e61ad",
  storageBucket: "interview-mate-e61ad.appspot.com",
  messagingSenderId: "666572928958",
  appId: "1:666572928958:web:5c33b3f346828b9d08abef"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
