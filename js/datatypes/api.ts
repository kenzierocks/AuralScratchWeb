import {firebaseDb} from "../firebase/firebaseSetup";
import firebase from "firebase";
import {
    Keyed,
    Song,
    SongList,
    SongListDisplaySettings,
    SortDirection,
    StringKeyedObject,
    Tag,
    TagCategory
} from "./main";
import {checkNotNull} from "../preconditions";
import {STC_ALBUM, STC_ARTIST, STC_DATE_ADDED, STC_LENGTH, STC_NAME, TC_UUID} from "../idConstants";
import Reference = firebase.database.Reference;
import DataSnapshot = firebase.database.DataSnapshot;

const REFS = {
    'songs': firebaseDb.ref('songs'),
    'tagCategories': firebaseDb.ref('tagCategories'),
    'songLists': firebaseDb.ref('songLists'),
    'displaySettings': firebaseDb.ref('songListDisplaySettings')
};

interface FBSong {
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

function convertToSet<T>(snap: DataSnapshot, conversionFunction: DataSnapshotDeserializer<T> = (val => val.val())) {
    const list = new Set<T>();
    snap.forEach(tSnap => {
        list.add(conversionFunction(tSnap));
        return false;
    });
    return list;
}

export interface ApiAccess<T, I> {
    ref: Reference

    once(key: string): Promise<T>

    convert(fbData: DataSnapshot): T

    push(data: I): Reference

    set(data: T): Promise<void>

    getAll(): Promise<T[]>
}

interface ApiAccessImplData<K extends Keyed, I> {
    getter: DataSnapshotDeserializer<K>
    initializer: (initData: I) => any
    setter: (data: K, ref: Reference) => any[] | Promise<any[]>
}

function apiAccess<K extends Keyed, I>(ref: Reference, impl: ApiAccessImplData<K, I>): ApiAccess<K, I> {
    return {
        ref: ref,
        once(key: string) {
            return get(ref, key, impl.getter);
        },
        convert(fbData) {
            return impl.getter(fbData);
        },
        push(initData: I) {
            return ref.push(impl.initializer(initData));
        },
        set(data: K) {
            const keyRef = ref.child(data.key);
            return Promise.resolve(impl.setter(data, keyRef)).then((array: any[]) => {
                return Promise.all(array);
            }).then(() => {
            });
        },
        getAll() {
            return Promise.resolve(ref.once('value'))
                .then(snap => convertToList<K>(snap, impl.getter));
        }
    }
}

export const songs = apiAccess<Song, InitSong>(REFS.songs,
    {
        getter(snap) {
            return {
                key: checkNotNull(snap.key),
                audioStorageRef: snap.child('audioStorageRef').val(),
                tags: convertToList<Tag>(snap.child('tags'), val => {
                    const tag: Tag = val.val();
                    tag._key = val.key || undefined;
                    return tag;
                }),
                sortingTags: snap.child('sortingTags').val() || {}
            };
        },
        setter(data: Song, ref: Reference) {
            const tagsRef = ref.child('tags');
            return Promise.resolve(tagsRef.set({})).then(() => [
                ref.child('audioStorageRef').set(data.audioStorageRef),
                ref.child('sortingTags').set(data.sortingTags),
                Promise.all(data.tags.map(tag => tagsRef.push(tag)))
            ]);
        },
        initializer(data): FBSong {
            return {
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
        const key = TC_UUID(data);
        const ref = REFS.tagCategories.child(key);
        ref.set(data);
        return ref;
    },
    set(data) {
        return Promise.resolve(REFS.tagCategories.child(TC_UUID(data)).set(data));
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
        setter(data: SongList, ref: Reference) {
            const songsRef = ref.child('songs');
            const existingSongsP = Promise.resolve(songsRef.once('value'))
                .then(snap => convertToSet<string>(snap.val()));
            return [
                ref.child('name').set(data.name),
                ref.child('displaySettings').set(data.displaySettings),
                existingSongsP.then(existingSongs =>
                    Promise.all(data.songs.map((song: string) => {
                        if (!existingSongs.has(song)) {
                            songsRef.push(song);
                        }
                    }))
                )
            ];
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
    TC_UUID(STC_DATE_ADDED),
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
        setter(data: SongListDisplaySettings, ref: Reference) {
            const tagCategoriesRef = ref.child('tagCategories');
            const existingTCP = Promise.resolve(tagCategoriesRef.once('value'))
                .then(snap => convertToSet<string>(snap.val()));
            return [
                ref.child('sortingTagCategory').set(data.sortingTagCategory),
                ref.child('sortDirection').set(data.sortDirection),
                existingTCP.then(existingTC =>
                    Promise.all(data.tagCategories.map((song: string) => {
                        if (!existingTC.has(song)) {
                            tagCategoriesRef.push(song);
                        }
                    }))
                )
            ];
        },
        initializer(data) {
            return {
                sortDirection: data.sortDirection
            };
        }
    }
);
