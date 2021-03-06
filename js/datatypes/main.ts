import moment from "moment";

export interface StringKeyedObject<T> {
    [key: string]: T | undefined
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
                return value !== 'false';
            case TCType.DATE:
                return undefined;
        }
    }
    export function getTagValue(type: TCType, value: any): any {
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
    export function formatTag(type: TCType, name: string, value: any): any {
        switch (type) {
            case TCType.STRING:
            case TCType.NUMBER:
                return `${name}: ${value}`;
            case TCType.BOOLEAN:
                return name;
            case TCType.DATE:
                return `${name}: ${moment(value).format('lll')}`;
        }
    }
}

export interface TagCategory extends Named {
    type: TCType
    maximumTags?: number
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
     * Map from TagCategory id to index in tags, pointing to the Tag representing it.
     */
    sortingTags: StringKeyedObject<number>
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
    tagCategories: TagCategoryMap
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
