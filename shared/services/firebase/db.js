import {getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc} from "firebase/firestore";
export {serverTimestamp} from "firebase/firestore";
import {app} from "./app";

export const db = getFirestore(app);

export const getDocument = (...path) => getDoc(doc(db, ...path));
export const setDocument = (data, ...path) => setDoc(doc(db, ...path), data);
export const deleteDocument = (...path) => deleteDoc(doc(db, ...path));

export const getDocuments = (...path) => getDocs(collection(db, ...path));
