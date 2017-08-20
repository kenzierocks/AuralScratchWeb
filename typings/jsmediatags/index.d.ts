declare module "jsmediatags" {

    export function read(source: string | Blob, callbacks: JMTCallbacks): any

    export interface JMTCallbacks {
        onSuccess(tag: TagData): void

        onError(error: any): void
    }

    export interface TagData {
        type: string
        version: string
        major: number
        revision: number
        flags: { [k: string]: boolean }
        size: number
        tags: TagObject
    }

    export interface TagObject {
        title?: string
        artist?: string
        album?: string

        [k: string]: Tag | string | undefined
    }

    export interface Tag {
        id: string
        size: number
        description: string
        data: string
    }

}
