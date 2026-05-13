import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCh25ldiBE61zE9wiqPGL_bRhyxs5qEzXs",
  authDomain: "shevlo.firebaseapp.com",
  databaseURL: "https://shevlo-default-rtdb.firebaseio.com",
  projectId: "shevlo",
  storageBucket: "shevlo.firebasestorage.app",
  messagingSenderId: "714356282455",
  appId: "1:714356282455:web:3050a7c74c253e41a37f12",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export {
  collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, limit, serverTimestamp, increment,
};
