import {Store} from "redux";
import {InternalState} from "./redux";
import {observeStoreSlice} from "./reduxObserve";
import SongPlayer from "../audiostorm/SongPlayer";

type ExpectedStore = Store<InternalState>;

const songPlayer = new SongPlayer();

export function subscribeAll(store: ExpectedStore) {
    observeStoreSlice(store, 'songToPlay', () => songPlayer.storeHook(store));
}
