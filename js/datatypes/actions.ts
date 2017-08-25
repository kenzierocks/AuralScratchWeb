import {Action, ActionCreator, Reducer} from "redux";
import {Song, SongList, SongListDisplaySettings, TagCategory} from "./main";

export interface SimpleAction<P> extends Action {
    payload: P
}

interface SACReducerFunction<T, A> {
    (previousState: T, action: A): T
}

interface SACReducer<T, A> extends SACReducerFunction<T, A> {
    type: string
}

export interface SimpleActionCreator<P, A extends SimpleAction<P>> extends ActionCreator<A> {
    (payload: P): A
    type: string
    reducer<T>(reducer: SACReducerFunction<T, A>): SACReducer<T, A>
}

export function ac<P>(type: string): SimpleActionCreator<P, SimpleAction<P>> {
    const ac = ((payload: P) => {
        return {
            type: type,
            payload: payload
        };
    }) as SimpleActionCreator<P, SimpleAction<P>>;
    ac.type = type;
    ac.reducer = function reducer<T>(sac: SACReducerFunction<T, SimpleAction<P>>) {
        Object.defineProperty(sac, 'name', {value: type, configurable: true});
        Object.defineProperty(sac, 'type', {value: type, writable: false});
        return sac as SACReducer<T, SimpleAction<P>>;
    };
    return ac;
}

type SACReducerMap<S, A> = {[v in keyof S]?: SACReducer<S[v], A>[]}

export function combineReducerSlices<S extends { [k: string]: any }>(initialState: S, reducersMap: SACReducerMap<S, any>): Reducer<S> {
    const entries = Object.entries(reducersMap as any as {[key: string]: SACReducer<S, any>[]});
    return (previousState = initialState, action) => {
        let state = previousState;
        entries.forEach(([sliceKey, reducers]) => {
            const originalSlice = state[sliceKey];
            let currentSlice = originalSlice;
            reducers.forEach(reducer => {
                if (reducer.type !== action.type) {
                    return;
                }
                currentSlice = reducer(currentSlice, action);
            });
            if (currentSlice === originalSlice) {
                // no need to update/copy
                return;
            }
            // copy state if changed
            if (state === previousState) {
                state = Object.assign({}, previousState);
            }
            state[sliceKey] = currentSlice;
        });
        return state;
    };
}

export interface MapAddition<T> {
    key: string
    addition: T
}

export interface SongAddition extends MapAddition<Song> {
}

export interface SongListAddition extends MapAddition<SongList> {
}

export interface TagCategoryAddition extends MapAddition<TagCategory> {
}

export interface SongListDisplaySettingAddition extends MapAddition<SongListDisplaySettings> {
}

export const authStateChanged = ac<boolean>('AUTH_STATE_CHANGED');

export const setLibraryId = ac<string>('SET_LIBRARY_ID');
export const addSong = ac<SongAddition>('ADD_SONG');
export const removeSong = ac<string>('REMOVE_SONG');
export const addSongList = ac<SongListAddition>('ADD_SONG_LIST');
export const removeSongList = ac<string>('REMOVE_SONG_LIST');
export const addTagCategory = ac<TagCategoryAddition>('ADD_TAG_CATEGORY');
export const removeTagCategory = ac<string>('REMOVE_TAG_CATEGORY');
export const addSongListDisplaySettings = ac<SongListDisplaySettingAddition>('ADD_SONG_LIST_DISPLAY_SETTINGS');
export const removeSongListDisplaySettings = ac<string>('REMOVE_SONG_LIST_DISPLAY_SETTINGS');

export const playSong = ac<string>('PLAY_SONG');
export const setPlayingSong = ac<string | undefined>('SET_PLAYING_SONG');
export const pauseSong = ac<string>('PAUSE_SONG');
