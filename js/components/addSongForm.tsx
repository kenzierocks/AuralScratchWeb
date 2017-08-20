import {React} from "../routes/rbase";
import RS from "reactstrap";
import {ChangeEvent, FormEvent, InputHTMLAttributes} from "react";
import {checkNotNull} from "../preconditions";
import {firebaseDb, firebase} from "../firebase/firebaseSetup";
import UploadTaskSnapshot = firebase.storage.UploadTaskSnapshot;
import UploadTask = firebase.storage.UploadTask;
import TaskState = firebase.storage.TaskState;
import {REDUX_STORE} from "../datatypes/redux";
import {songLists, songs} from "../datatypes/api";
import {STC_ALBUM, STC_ARTIST, STC_DATE_MODIFIED, STC_LENGTH, STC_NAME, TC_UUID} from "../idConstants";
import jsmediatags, {TagObject} from "jsmediatags";
import {Tag, TagCategory} from "../datatypes/main";

const storageArea = firebase.storage().ref('songs');
const nameReserver = firebaseDb.ref('songNameReservation');

export type ASFProps = { closeDialog: () => void };
type ASFState = {
    progress?: number,
    text?: string,
    pause: boolean,
    uploadTask?: UploadTask
};

type WBFFIProps = InputHTMLAttributes<HTMLInputElement>;

class WorldsBestFileFormInput extends React.Component<WBFFIProps, { cfcText: string }> {
    constructor(props: WBFFIProps) {
        super(props);

        this.state = {
            cfcText: "Choose a file..."
        };
    }

    onFileChange(e: ChangeEvent<HTMLInputElement>) {
        const files = e.currentTarget.files;
        let state;
        if (files && files.length > 0) {
            state = {
                cfcText: files.item(0).name
            };
        } else {
            state = {
                cfcText: "Choose a file..."
            };
        }
        this.setState(state);
    }

    render() {
        return <label className="cfc-center">
            <input {...this.props} name="file" type="file" id="add-song-file" className="custom-file-input"
                   accept="audio/*"
                   onChange={e => this.onFileChange(e)}/>
            <span className="btn btn-primary" id="add-song-button">
                {this.state.cfcText}
            </span>
        </label>;
    }
}

function insertSongIntoLibrary(asfRef: string, possibleTags: Tag[]) {
    const libraryUuid = checkNotNull<string>(REDUX_STORE.getState().librarySongList);
    const key = songs.push({
        'audioStorageRef': asfRef
    });
    possibleTags.forEach(tag =>
        key.child('tags').push(tag)
    );
    const library = songLists.ref.child(libraryUuid);
    library.child('songs').push(key.key);
}

const tagMappings: { [k: string]: TagCategory } = {
    title: STC_NAME,
    artist: STC_ARTIST,
    album: STC_ALBUM
};

export class AddSongForm extends React.Component<ASFProps, ASFState> {

    constructor(props: ASFProps) {
        super(props);
        this.state = {
            pause: false
        };
    }

    addSong = (e: FormEvent<HTMLFormElement>) => {
        const asfRef = this;
        try {
            const formElems = e.currentTarget.elements;
            const inputElement = checkNotNull(formElems.namedItem('file')) as HTMLInputElement;
            const file = checkNotNull(inputElement.files).item(0);
            const ref = nameReserver.push(file.name);
            const fileRef = storageArea.child(checkNotNull(ref.key));
            const uploadTask = fileRef.put(file, {
                contentType: file.type,
                customMetadata: {
                    name: file.name
                }
            });
            // start processing of tags
            const foundTagCatPromise = new Promise<Tag[]>(((resolve, reject) => {
                jsmediatags.read(file, {
                    onSuccess({tags}) {
                        resolve(Object.entries(tagMappings).map(([prop, tc]) => {
                            return {
                                category: TC_UUID(tc),
                                value: tags[prop]
                            }
                        }).filter(tag => tag.value));
                    },
                    onError(error) {
                        if (error.type === "tagFormat") {
                            resolve([]);
                            return;
                        }
                        reject(error);
                    }
                });
            })).then(tags => {
                if (tags.length === 0) {
                    tags.push({
                        category: TC_UUID(STC_NAME),
                        value: file.name
                    });
                }
                tags.push({
                    category: TC_UUID(STC_DATE_MODIFIED),
                    value: firebase.database.ServerValue.TIMESTAMP
                });
                tags.push({
                    category: TC_UUID(STC_LENGTH),
                    value: -1
                });
                return tags;
            });
            uploadTask.on('state_changed', {
                next(snapInProgress: UploadTaskSnapshot) {
                    const progress = (snapInProgress.bytesTransferred / snapInProgress.totalBytes) * 100;
                    const percentDone = `${progress.toFixed(2)}% done`;
                    let progressText: string;
                    switch (snapInProgress.state) {
                        case TaskState.PAUSED:
                            progressText = `Upload paused. ${percentDone}.`;
                            break;
                        case TaskState.RUNNING:
                        default:
                            progressText = `Uploading... ${percentDone}.`;
                            break;
                    }
                    asfRef.setState(state => {
                        return {
                            ...state,
                            progress: progress,
                            text: progressText,
                            pause: snapInProgress.state === TaskState.PAUSED
                        };
                    });
                },
                error(error: { message: string, code: string }) {
                    if (uploadTask.snapshot.state === TaskState.CANCELED) {
                        asfRef.props.closeDialog();
                        return;
                    }
                    asfRef.setState(state => {
                        return {
                            ...state,
                            progress: Infinity,
                            text: `Error: ${error.message} (${error.code}).`
                        };
                    });
                    console.error("Error in ASF", error);
                    setTimeout(() => asfRef.props.closeDialog(), 500);
                },
                complete() {
                    foundTagCatPromise.then(tags => {
                        insertSongIntoLibrary(fileRef.name, tags);
                    });
                    asfRef.props.closeDialog();
                    return undefined;
                }
            });
            asfRef.setState(state => {
                return {
                    ...state,
                    uploadTask: uploadTask
                };
            });
        } finally {
            e.preventDefault();
        }
    };

    pause = () => {
        const task: UploadTask = checkNotNull(this.state.uploadTask);
        task.pause();
    };
    unPause = () => {
        const task: UploadTask = checkNotNull(this.state.uploadTask);
        task.resume();
    };
    cancel = () => {
        const task: UploadTask = checkNotNull(this.state.uploadTask);
        task.cancel();
    };

    render() {
        if (typeof this.state.progress === "undefined") {
            return <RS.Form onSubmit={this.addSong}>
                <RS.FormGroup>
                    <WorldsBestFileFormInput required={true}/>
                </RS.FormGroup>
                <RS.Button className="float-right" color="success">Add</RS.Button>
            </RS.Form>
        }
        return <div>
            <div>
                <div className="text-center">{this.state.text}</div>
                <RS.Progress className="m-2" value={this.state.progress} animated={true} color="info" striped={true}/>
            </div>
            <div>
                <RS.ButtonToolbar className="justify-content-between">
                    <RS.ButtonGroup>
                        <RS.Button className="float-right" color="danger" onClick={this.cancel}>Cancel</RS.Button>
                    </RS.ButtonGroup>
                    <RS.ButtonGroup>
                        {!this.state.pause
                            ? <RS.Button className="float-right" color="warning" onClick={this.pause}>Pause</RS.Button>
                            :
                            <RS.Button className="float-right" color="success" onClick={this.unPause}>Resume</RS.Button>
                        }
                    </RS.ButtonGroup>
                </RS.ButtonToolbar>
            </div>
        </div>;
    }
}
