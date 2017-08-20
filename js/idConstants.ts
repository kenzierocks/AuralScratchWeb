import uuid5 from "uuid/v5";
import {TagCategory, TCType} from "./datatypes/main";

export const NAMESPACE = 'e12ed951-7897-4e48-b247-5c272a2e0438';
export const TAG_CATEGORY = uuid5('Tag Category', NAMESPACE);

export function TC_UUID(name: string | { name: string }) {
    if (typeof name !== "string") {
        name = name.name;
    }
    return uuid5(name, TAG_CATEGORY);
}

function newTagCat(name: string, type: TCType): TagCategory {
    return {
        name: name,
        type: type
    };
}

export const STC_NAME = newTagCat('Name', TCType.STRING);
export const STC_ARTIST = newTagCat('Artist', TCType.STRING);
export const STC_ALBUM = newTagCat('Album', TCType.STRING);
export const STC_DATE_MODIFIED = newTagCat('Date Modified', TCType.DATE);
export const STC_LENGTH = newTagCat('Length', TCType.NUMBER);

export const standardTagCategories = {
    [TC_UUID(STC_NAME)]: STC_NAME,
    [TC_UUID(STC_ARTIST)]: STC_ARTIST,
    [TC_UUID(STC_ALBUM)]: STC_ALBUM,
    [TC_UUID(STC_DATE_MODIFIED)]: STC_DATE_MODIFIED,
    [TC_UUID(STC_LENGTH)]: STC_LENGTH
};
