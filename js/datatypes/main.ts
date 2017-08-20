export interface StringKeyedObject<T> {
    [key: string]: T
}

export interface Keyed {
    key: string
}

export interface Named {
    name: string
}

export enum TCType {
    STRING,
    NUMBER,
    BOOLEAN,
    DATE
}

export type FormType = 'text' | 'datetime' | 'number' | 'checkbox' | undefined;

// static member decls for TCType
export module TCType {
    export function getFormType(type: TCType): FormType {
        switch (type) {
            case TCType.STRING:
                return "text";
            case TCType.NUMBER:
                return "number";
            case TCType.BOOLEAN:
                return "checkbox";
            case TCType.DATE:
                return undefined;
        }
    }
    export function getFormValue(type: TCType, value: any): any {
        switch (type) {
            case TCType.STRING:
            case TCType.NUMBER:
                return value;
            case TCType.BOOLEAN:
                return !!value;
            case TCType.DATE:
                return undefined;
        }
    }
}

export interface TagCategory extends Named {
    type: TCType
}

export interface Tag {
    /**
     * Internal use.
     */
    _key?: string
    category: string
    value: any
}

export interface Song extends Keyed {
    audioStorageRef: string
    tags: Tag[]
    /**
     * Map from TagCategory id to Tag representing it.
     */
    sortingTags: StringKeyedObject<string>
}

export interface SongList extends Named, Keyed {
    songs: string[]
    displaySettings: string
}

export enum SortDirection {
    ASCENDING = 'ascending',
    DESCENDING = 'descending'
}

export interface SongListDisplaySettings extends Keyed {
    tagCategories: string[]
    sortingTagCategory: string
    sortDirection: SortDirection
}

export interface FilledSLDisplaySettings extends Keyed {
    tagCategories: TagCategory[]
    /**
     * index into tagCategories
     */
    sortingTagCategory: number
    sortDirection: SortDirection
}

export type SongMap = Map<string, Song>;
export type SongListMap = Map<string, SongList>;
export type TagCategoryMap = Map<string, TagCategory>;
export type SongListDisplaySettingsMap = Map<string, SongListDisplaySettings>;
