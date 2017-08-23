import {React} from "../routes/rbase";
import RS from "reactstrap";
import {Song, Tag, TagCategory, TagCategoryMap, TCType} from "../datatypes/main";
import {FormEvent, SyntheticEvent} from "react";
import {checkNotNull} from "../preconditions";
import {TC_UUID} from "../idConstants";
import {songLists, songs} from "../datatypes/api";
import {REDUX_STORE} from "../datatypes/redux";
import firebase from "firebase";
import Reference = firebase.database.Reference;
import DataSnapshot = firebase.database.DataSnapshot;

type ESDProps = {
    song: Song
    tagCategories: TagCategoryMap,
    closeDialog: () => void
};

const TAG_UNDEFINED = {
    category: "",
    value: undefined
};

export class EditSongDialog extends React.Component<ESDProps, {}> {

    private tagCatToTagMap = new Map<string, Tag>();

    constructor(props: ESDProps) {
        super(props);
        this.tagCatToTagMap = new Map(props.song.tags.map((t): [string, Tag] => [t.category, t]));
    }

    recoverTagData(elements: HTMLFormControlsCollection): Tag[] {
        return Array.from(this.props.tagCategories.values()).map(tc => {
            const name = tc.name;
            const ident = 'tc' + name.replace(' ', '_');
            const tcItem = elements.namedItem(ident);
            if (tcItem === null) {
                const old = this.tagCatToTagMap.get(TC_UUID(tc));
                if (typeof old !== "undefined") {
                    return old;
                }
                return TAG_UNDEFINED;
            }
            return {
                category: TC_UUID(tc),
                value: TCType.getTagValue(tc.type, (tcItem as HTMLInputElement).value)
            };
        }).filter(t => t !== TAG_UNDEFINED);
    }

    applyEdits = (e: FormEvent<HTMLFormElement>) => {
        try {
            const song: Song = {...this.props.song,
                tags: this.recoverTagData(e.currentTarget.elements)
            };
            song.tags.forEach((t, i) => {
                song.sortingTags[t.category] = i
            });
            songs.set(song)
                .then(() => this.props.closeDialog())
                .catch(e => console.log(e));
        } finally {
            e.preventDefault();
        }
    };

    deleteSong = (e: SyntheticEvent<HTMLButtonElement>) => {
        try {
            const ok = confirm("Are you sure you want to delete this song?");
            if (!ok) {
                return;
            }
            const libraryRef: Reference = songLists.ref.child(checkNotNull(REDUX_STORE.getState().librarySongList));
            const promise = libraryRef.child('songs').once('value').then((snap: DataSnapshot) => {
                return new Promise((resolve, reject) => {
                    const didAny = snap.forEach((a: DataSnapshot) => {
                        if (a.val() === this.props.song.key) {
                            // delete it!
                            a.ref.remove().then(resolve, reject);
                            return true;
                        }
                        return false;
                    });
                    if (!didAny) {
                        resolve(true);
                    }
                });
            });
            promise.then(() => {
                return songs.ref.child(this.props.song.key).remove();
            }).then(() => {
                return firebase.storage().ref('/songs/').child(this.props.song.audioStorageRef).delete();
            }).catch(e => console.error('ESD.deleteSong', e));
            this.props.closeDialog();
        } finally {
            e.preventDefault();
        }
    };

    getSongValue(tc: TagCategory) {
        const matching = this.props.song.tags
            .filter(tag => tag.category === TC_UUID(tc))
            .map(t => t.value);
        return matching.shift();
    }

    render() {
        const formGroups = Array.from(this.props.tagCategories.values()).map((tc) => {
            const name = tc.name;
            const ident = 'tc' + name.replace(' ', '_');
            const type = TCType.getFormType(tc.type);
            const value = TCType.getFormValue(tc.type, this.getSongValue(tc));
            if (typeof type === "undefined") {
                return undefined;
            }
            return <RS.FormGroup key={ident}>
                <RS.Label for={ident}>
                    {name}
                </RS.Label>
                <RS.Input type={type} name={ident} id={ident} defaultValue={value}/>
            </RS.FormGroup>;
        }).filter(tag => tag);
        return <RS.Form onSubmit={this.applyEdits}>
            {formGroups}
            <RS.ButtonToolbar className="justify-content-between">
                <RS.ButtonGroup>
                    <RS.Button className="float-right" color="danger" onClick={this.deleteSong}>Delete Song</RS.Button>
                </RS.ButtonGroup>
                <RS.ButtonGroup>
                    <RS.Button className="float-right" color="success">Submit Edits</RS.Button>
                </RS.ButtonGroup>
            </RS.ButtonToolbar>
        </RS.Form>;
    }

}
