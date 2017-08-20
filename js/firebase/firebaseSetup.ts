import firebase from "firebase";
import firebaseui, {IConfig} from "firebaseui";

export {firebase};

// Initialize Firebase
const config = {
    apiKey: "AIzaSyDKEht-bSepOngD4pdXwJ9vSCA2mhuDhUU",
    authDomain: "auralscratch.firebaseapp.com",
    databaseURL: "https://auralscratch.firebaseio.com",
    projectId: "auralscratch",
    storageBucket: "auralscratch.appspot.com",
    messagingSenderId: "278521017733"
};
firebase.initializeApp(config);

export function checkLogInState() {
    console.log(!!firebase.auth().currentUser);
    return !!firebase.auth().currentUser;
}

export const firebaseDb = firebase.database();

const uiConfig: IConfig = {
    callbacks: {
        signInSuccess(currentUser: firebase.User, credential?: firebase.auth.AuthCredential) {
            for (let cb of signInCallbacks.values()) {
                cb(currentUser, credential);
            }
            // I don't need no, redirection....
            return false;
        }
    },
    signInFlow: 'popup',
    signInSuccessUrl: location.href,
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    tosUrl: 'http://ascratch.kenzierocks.me/#tos'
};

// Initialize the FirebaseUI Widget using Firebase.
const fbAuthUi = new firebaseui.auth.AuthUI(firebase.auth());

type SignInCallback = (currentUser: firebase.User, credential?: firebase.auth.AuthCredential) => void;

let signInCallbacks = new Map<string, SignInCallback>();
export const ui = {
    addSignInCallback(key: string, cb: SignInCallback) {
        signInCallbacks.set(key, cb);
    },
    removeSignInCallback(key: string) {
        signInCallbacks.delete(key);
    },
    startUi() {
        fbAuthUi.start('#firebaseui-auth-container', uiConfig);
    },
    resetUi() {
        fbAuthUi.reset();
    }
};
