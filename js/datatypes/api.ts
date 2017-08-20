import {firebaseDb} from "../firebase/firebaseSetup";
import firebase from "firebase";
import uuid5 from "uuid/v5";
import {
    Keyed,
    Named,
    Song,
    SongList,
    SongListDisplaySettings,
    SortDirection,
    StringKeyedObject,
    Tag,
    TagCategory
} from "./main";
import {checkNotNull} from "../preconditions";
import {STC_ALBUM, STC_ARTIST, STC_DATE_MODIFIED, STC_LENGTH, STC_NAME, TAG_CATEGORY, TC_UUID} from "../idConstants";
import Reference = firebase.database.Reference;
import DataSnapshot = firebase.database.DataSnapshot;

const REFS = {
    'songs': firebaseDb.ref('songs'),
    'tagCategories': firebaseDb.ref('tagCategories'),
    'songLists': firebaseDb.ref('songLists'),
    'displaySettings': firebaseDb.ref('songListDisplaySettings')
};

interface FBSong extends Named {
    audioStorageRef: string
    tags: StringKeyedObject<Tag>
    sortingTags: StringKeyedObject<string>
}

type InitSong = Pick<Song, 'audioStorageRef'>;

type InitTagCategory = Pick<TagCategory, 'name' | 'type'>;

type InitSongList = Pick<SongList, 'name'>;

type InitSongListDisplaySettings = Pick<SongListDisplaySettings, 'sortDirection'>;

function get<T>(ref: Reference, key: string, converter: DataSnapshotDeserializer<T>): Promise<T> {
    return Promise.resolve(ref.child(key).once('value')).then(converter);
}

type DataSnapshotDeserializer<T> = (data: DataSnapshot) => T;

function convertToList<T>(snap: DataSnapshot, conversionFunction: DataSnapshotDeserializer<T> = (val => val.val())) {
    const list = new Array<T>(snap.numChildren());
    let i = 0;
    snap.forEach(tSnap => {
        list[i] = conversionFunction(tSnap);
        i++;
        return false;
    });
    return list;
}

export interface ApiAccess<T, I> {
    ref: Reference

    once(key: string): Promise<T>

    convert(fbData: DataSnapshot): T

    push(data: I): Reference

    getAll(): Promise<T[]>
}

function apiAccess<K extends Keyed, I>(ref: Reference, {getter, initializer}: {
    getter: DataSnapshotDeserializer<K>, initializer: (initData: I) => any
}): ApiAccess<K, I> {
    return {
        ref: ref,
        once(key: string) {
            return get(ref, key, getter);
        },
        convert(fbData) {
            return getter(fbData);
        },
        push(initData: I) {
            return ref.push(initializer(initData));
        },
        getAll() {
            return Promise.resolve(ref.once('value'))
                .then(snap => convertToList<K>(snap, getter));
        }
    }
}

export const songs = apiAccess<Song, InitSong>(REFS.songs,
    {
        getter(snap) {
            return {
                key: checkNotNull(snap.key),
                name: snap.child('name').val(),
                audioStorageRef: snap.child('audioStorageRef').val(),
                tags: convertToList<Tag>(snap.child('tags')),
                sortingTags: snap.child('sortingTags').val() || {}
            };
        },
        initializer(data): FBSong {
            return {
                name: '',
                audioStorageRef: data.audioStorageRef,
                tags: {},
                sortingTags: {}
            };
        }
    }
);

export const tagCategories: ApiAccess<TagCategory, InitTagCategory> = {
    ref: REFS.tagCategories,
    once(key) {
        return get(REFS.tagCategories, key, snap => snap.val());
    },
    convert(fbData) {
        return fbData.val();
    },
    push(data) {
        const key = uuid5(data.name, TAG_CATEGORY);
        const ref = REFS.tagCategories.child(key);
        ref.set(data);
        return ref;
    },
    getAll() {
        return Promise.resolve(REFS.tagCategories.once('value'))
            .then(snap => convertToList<TagCategory>(snap, childSnap => childSnap.val()));
    }
};

export const songLists = apiAccess<SongList, InitSongList>(REFS.songLists,
    {
        getter(snap) {
            return {
                key: checkNotNull(snap.key),
                name: snap.child('name').val(),
                songs: convertToList<string>(snap.child('songs')),
                displaySettings: snap.child('displaySettings').val()
            };
        },
        initializer(data) {
            return {...data, displaySettings: createDefaultDisplaySettings().key};
        }
    }
);

const defaultTagOrder = [
    TC_UUID(STC_NAME),
    TC_UUID(STC_ARTIST),
    TC_UUID(STC_ALBUM),
    TC_UUID(STC_DATE_MODIFIED),
    TC_UUID(STC_LENGTH)
];

const defaultSortingTag: string = TC_UUID(STC_NAME);
const defaultSortDirection = SortDirection.ASCENDING;

export function createDefaultDisplaySettings(): Reference {
    const ref = songListDisplaySettings.push({
        sortDirection: defaultSortDirection
    });
    const cats = ref.child('tagCategories');
    defaultTagOrder.forEach(v => cats.push(v));
    ref.child('sortingTagCategory').set(defaultSortingTag);
    return ref;
}

export const songListDisplaySettings = apiAccess<SongListDisplaySettings, InitSongListDisplaySettings>(REFS.displaySettings,
    {
        getter(snap) {
            return {
                key: checkNotNull(snap.key),
                tagCategories: convertToList<string>(snap.child('tagCategories')),
                sortingTagCategory: snap.child('sortingTagCategory').val(),
                sortDirection: snap.child('sortDirection').val()
            };
        },
        initializer(data) {
            return {
                sortDirection: data.sortDirection
            };
        }
    }
);
