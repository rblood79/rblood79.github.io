import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

export default firebase.initializeApp(firebaseConfig);


/*const firebaseConfig = {
    apiKey: "AIzaSyD4lFYlGsKryHvQUF5CT3wUdhnU_uQBVUA",
    authDomain: "army-c3fb4.firebaseapp.com",
    projectId: "army-c3fb4",
    storageBucket: "army-c3fb4.appspot.com",
    messagingSenderId: "806478232160",
    appId: "1:806478232160:web:893774803a8773caa12105",
    measurementId: "G-SX7YFMRCJZ"
}

export default firebase.initializeApp(firebaseConfig);*/