import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signOut,
} from 'firebase/auth';

import {
    doc,
    getDoc,
    setDoc,
    getFirestore
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID
}

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const createUserDocumentFromAuth = async (userAuth) => {
    if (!userAuth) return;
    const userDocRef = doc(db, 'users', userAuth.uid);
    const userSnapShot = await getDoc(userDocRef);

    if (!userSnapShot.exists()) {
        const { displayName, email, phoneNumber, emailVerified } = userAuth;
        const createdAt = new Date();
        try {
            await setDoc(userDocRef, {
                displayName,
                email,
                createdAt,
                phoneNumber,
                emailVerified
            })
        } catch (error) {
            console.log('error creating user', error.message);
        }
    }
    else{
        console.log("User already exists")
    }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);

const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({ display: 'popup' });
facebookProvider.addScope('user_birthday');
export const signInWithFacebookPopup = () => signInWithPopup(auth, facebookProvider);


export const signOutUser = async () => await signOut(auth);