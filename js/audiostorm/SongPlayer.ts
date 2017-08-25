import {Clip} from "./Clip";
import {InternalState} from "../datatypes/redux";
import {Store} from "redux";
import {setPlayingSong} from "../datatypes/actions";
import {optional} from "../optional";
import {Song, SongMap} from "../datatypes/main";
import firebase from "firebase";

const songsStorageRef = firebase.storage().ref('/songs');

function findFirebaseStorageUrl(ref: string): Promise<string> {
    return Promise.resolve(songsStorageRef.child(ref).getDownloadURL());
}

export default class SongPlayer {
    private currentSong: string | undefined;
    private currentClip: Clip | undefined;

    private resolveClipPromise(state: InternalState, song: string): Promise<Clip> | undefined {
        if (this.currentClip) {
            if (this.currentSong === song) {
                // just play it
                return Promise.resolve(this.currentClip);
            }
            this.currentClip.pause();
        }
        // reset
        const urlPromise = optional(state.songs)
            .map((songs: SongMap) => songs.get(song))
            .map<string>((songRef: Song) => songRef.audioStorageRef)
            .map(findFirebaseStorageUrl)
            .orElseUndefined();
        if (typeof urlPromise === "undefined") {
            return undefined;
        }
        return urlPromise.then(url => Clip.fromUrl(url));
    }

    storeHook(store: Store<InternalState>) {
        const state = store.getState();
        const song = state.songToPlay;
        if (typeof song === "undefined") {
            if (this.currentClip) {
                this.currentClip.pause();
            }
            store.dispatch(setPlayingSong(undefined));
            return;
        }
        const clipPromise = this.resolveClipPromise(state, song);
        if (typeof clipPromise === "undefined") {
            return;
        }
        clipPromise
            .then(clip => {
                this.currentClip = clip;
                this.currentSong = song;
                return this.currentClip.play();
            })
            .then(() => store.dispatch(setPlayingSong(song)))
            .catch(e => console.error(e));
    }
}
