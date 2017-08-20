import {SongListDisplaySettingsMap, SongListMap, SongMap, TagCategoryMap} from "./main";
import {createStore, Store} from "redux";
import {
    ac,
    addSong,
    addSongList,
    addSongListDisplaySettings,
    addTagCategory, authStateChanged,
    combineReducerSlices,
    MapAddition,
    removeSongList,
    removeSongListDisplaySettings,
    removeTagCategory,
    setLibraryId,
    SimpleAction,
    SimpleActionCreator
} from "./actions";
import {valuesEqual} from "../objectEquality";
import {checkNotNull} from "../preconditions";


/**
 * Redux state interface.
 */
export interface InternalState {
    signedIn: boolean
    librarySongList?: string
    songs?: SongMap
    songLists?: SongListMap
    tagCategories?: TagCategoryMap
    songListDisplaySettings?: SongListDisplaySettingsMap
}

function setReducer<S>(initialState: S, sac: SimpleActionCreator<S, SimpleAction<S>>) {
    return sac.reducer((state: S = initialState, action: SimpleAction<S>) => {
        const stateEmptyMap = state instanceof Map && state.size === 0;
        const payloadEmptyMap = action.payload instanceof Map && action.payload.size === 0;
        if (stateEmptyMap && payloadEmptyMap) {
            return checkNotNull(state);
        }
        return checkNotNull(action.payload);
    });
}

function addReducer<V, S extends Map<string, V>, M extends MapAddition<V>>(initialState: S, sac: SimpleActionCreator<M, SimpleAction<M>>) {
    return sac.reducer((state: S = initialState, action: SimpleAction<M>) => {
        const current = state.get(action.payload.key);
        if (current && valuesEqual(current, action.payload.addition)) {
            return state;
        }
        const copy = new Map(state) as S;
        copy.set(action.payload.key, action.payload.addition);
        return copy;
    });
}

function removeReducer<S extends Map<string, any>>(initialState: S, sac: SimpleActionCreator<string, SimpleAction<string>>) {
    return sac.reducer((state: S = initialState, action: SimpleAction<string>) => {
        if (!state.has(action.payload)) {
            return state;
        }
        const copy = new Map(state) as S;
        copy.delete(action.payload);
        return copy;
    });
}

const mainReducer = combineReducerSlices<InternalState>({
    signedIn: false
}, {
    librarySongList: [
        setReducer(undefined, setLibraryId)
    ],
    songs: [
        addReducer(new Map(), addSong),
        removeReducer(new Map(), removeSongList)
    ],
    songLists: [
        addReducer(new Map(), addSongList),
        removeReducer(new Map(), removeSongList)
    ],
    tagCategories: [
        addReducer(new Map(), addTagCategory),
        removeReducer(new Map(), removeTagCategory)
    ],
    songListDisplaySettings: [
        addReducer(new Map(), addSongListDisplaySettings),
        removeReducer(new Map(), removeSongListDisplaySettings)
    ]
});
const signOutReducer = authStateChanged.reducer((state: InternalState, action: SimpleAction<boolean>) => {
    if (action.type !== authStateChanged.type || state.signedIn === action.payload) {
        return state;
    }
    if (!action.payload) {
        return {signedIn: false};
    }
    return {...state, signedIn: action.payload};
});

const reducer = (() => {
    const reducers = [mainReducer, signOutReducer];
    return (state: InternalState, action: SimpleAction<any>) => {
        let cState = state;
        reducers.forEach(r => cState = r(cState, action));
        return cState;
    };
})();

const reduxDevtools: (() => any) | undefined = (window as any)['__REDUX_DEVTOOLS_EXTENSION__'];

export const REDUX_STORE: Store<InternalState> = createStore(reducer, reduxDevtools && reduxDevtools());
