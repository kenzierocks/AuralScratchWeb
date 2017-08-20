import "./shims";
import $ from "jquery";
import {createNavbar} from "./navbar";
import ReactDOM from "react-dom";
import {Route, Router} from "./router/router";
import React from "react";
import {mainPage} from "./routes/mainPage";
import {songs as songsRoute} from "./routes/songs";
import {firebaseDb} from "./firebase/firebaseSetup";
import {ApiAccess, songListDisplaySettings, songLists, songs, tagCategories} from "./datatypes/api";
import {REDUX_STORE} from "./datatypes/redux";
import {
    addSong,
    addSongList,
    addSongListDisplaySettings,
    addTagCategory,
    authStateChanged,
    MapAddition,
    removeSong,
    removeSongList,
    removeSongListDisplaySettings,
    removeTagCategory,
    setLibraryId,
    SimpleAction,
    SimpleActionCreator
} from "./datatypes/actions";
import {Provider} from "react-redux";
import {standardTagCategories} from "./idConstants";
import {checkNotNull} from "./preconditions";

function getRoutes() {
    const routes = new Map<string, Route>();
    routes.set('', mainPage);
    routes.set('songs', songsRoute);
    return routes;
}

function refReduxHooks<F, P extends MapAddition<any>>(api: ApiAccess<F, any>,
                                                      childSet: SimpleActionCreator<P, SimpleAction<P>>,
                                                      childRemoved: SimpleActionCreator<string, SimpleAction<string>>) {
    api.ref.on('child_added', snap => {
        if (snap && snap.exists()) {
            REDUX_STORE.dispatch(childSet({
                key: snap.key,
                addition: api.convert(snap)
            }));
        }
    });
    api.ref.on('child_removed', snap => {
        if (snap) {
            REDUX_STORE.dispatch(childRemoved(snap.key));
        }
    });
    api.ref.on('child_changed', snap => {
        if (snap && snap.exists()) {
            REDUX_STORE.dispatch(childSet({
                key: snap.key,
                addition: api.convert(snap)
            }));
        }
    });
}

function setupFirebaseReduxHooks() {
    firebaseDb.ref('/lists/library').on('value', snap => {
        if (snap && snap.exists()) {
            REDUX_STORE.dispatch(setLibraryId(snap.val()));
        }
    });
    refReduxHooks(songs, addSong, removeSong);
    refReduxHooks(songLists, addSongList, removeSongList);
    refReduxHooks(tagCategories, addTagCategory, removeTagCategory);
    refReduxHooks(songListDisplaySettings, addSongListDisplaySettings, removeSongListDisplaySettings);
}

function setupInitializationProcedures() {
    firebaseDb.ref('/lists/library').on('value', snap => {
        if (snap) {
            if (!snap.exists()) {
                const libraryKey = songLists.push({name: 'Library'}).key;
                snap.ref.set(libraryKey);
            }
        }
    });
    Object.entries(standardTagCategories).forEach(([uuid, tc]) => {
        const key = tagCategories.push(tc).key;
        if (key !== uuid) {
            throw new Error("Error, tag-category UUID-derivation mismatch!");
        }
    });
}

type HTMLElementWithValidity = HTMLElement & {
    checkValidity(): boolean
}

const INVALIDITY_CLASS = 'has-danger';

function onRender() {
    console.info("Initializing...");
    $("body").on('change', e => {
        const anyTarget = e.target as any;
        if (typeof anyTarget.checkValidity === "undefined") {
            return;
        }
        const target = anyTarget as HTMLElementWithValidity;
        if (target.checkValidity()) {
            checkNotNull(target.parentElement).classList.remove(INVALIDITY_CLASS)
        }
    });
    const obs = new MutationObserver((records: MutationRecord[]) => {
        for (let rec of records) {
            const forms = $(rec.addedNodes).find('form');
            forms.on('submit', e => {
                $(e.target).find(`.${INVALIDITY_CLASS}`).removeClass(INVALIDITY_CLASS);
            });
            forms.find('input').on('invalid', e => {
                checkNotNull(e.target.parentElement).classList.add(INVALIDITY_CLASS);
            });
        }
    });
    obs.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function initFirebase() {
    setupFirebaseReduxHooks();
    setupInitializationProcedures();
}

$(() => {
    const navbar = createNavbar();
    const routes = getRoutes();
    ReactDOM.render(
        <Provider store={REDUX_STORE}>
            <div>
                {navbar}
                <Router paths={routes}/>
            </div>
        </Provider>,
        document.getElementById("container"),
        () => onRender());
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            initFirebase();
            console.log('Completed sign in!');
        }
        REDUX_STORE.dispatch(authStateChanged(!!user));
    });
});
