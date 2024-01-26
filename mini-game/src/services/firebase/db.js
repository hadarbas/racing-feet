import {getFirestore, doc, getDoc, setDoc, collection, getDocs} from "firebase/firestore";
import {app} from "./app";

export const db = getFirestore(app);

export const getDocument = (...path) => getDoc(doc(db, ...path));
export const setDocument = (data, ...path) => setDoc(doc(db, ...path), data);

export const getDocuments = (...path) => getDocs(collection(db, ...path));