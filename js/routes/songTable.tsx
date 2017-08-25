import {React} from "./rbase";
import {
    FilledSLDisplaySettings,
    Song,
    SongListDisplaySettings,
    Tag,
    TagCategory,
    TagCategoryMap,
    TCType
} from "../datatypes/main";
import {connectAdvanced} from "react-redux";
import {InternalState} from "../datatypes/redux";
import createCachedSelector from "re-reselect";
import RS from "reactstrap";
import {SimpleModal} from "../components/simpleModal";
import {EditSongDialog} from "../components/editSongDialog";
import {checkNotNull, isNullOrUndefined} from "../preconditions";
import {hashColor} from "../color";
import {STC_NAME, TC_UUID} from "../idConstants";
import {MouseEvent, MouseEventHandler} from "react";
import {Dispatch} from "redux";
import {pauseSong, playSong} from "../datatypes/actions";


type SongTableRowProps = {
    song: Song,
    tagCategories: TagCategoryMap
    index: number,
    playing: boolean,
    playSong: () => void,
    pauseSong: () => void
};

class SongTableRow extends React.Component<SongTableRowProps, { open: boolean }> {
    constructor(props: SongTableRowProps) {
        super(props);
        this.state = {
            open: false
        };
    }

    toggle = () => {
        this.setState(state => ({
            ...state,
            open: !state.open
        }));
    };

    clickBadge(tag: Tag, tagCategory: TagCategory) {
        return (e: MouseEvent<HTMLElement>) => {
            try {
                console.log(`Searching for ${TCType.formatTag(tagCategory.type, tagCategory.name, tag.value)}...`);
            } finally {
                e.stopPropagation();
            }
        };
    }

    hoverStart: MouseEventHandler<HTMLElement> = e => {
        const tableParent = $(e.currentTarget).closest('.table');
        tableParent.removeClass('table-hover');
    };

    hoverEnd: MouseEventHandler<HTMLElement> = e => {
        const tableParent = $(e.currentTarget).closest('.table');
        tableParent.addClass('table-hover');
    };

    playSong: MouseEventHandler<HTMLElement> = e => {
        try {
            this.props.playSong();
        } finally {
            e.stopPropagation();
        }
    };

    pauseSong: MouseEventHandler<HTMLElement> = e => {
        try {
            this.props.pauseSong();
        } finally {
            e.stopPropagation();
        }
    };

    renderPlayingData() {
        if (this.props.playing) {
            return <span className="fa-stack fa-lg play-button" aria-hidden={true} onClick={this.pauseSong}>
                    <i className="fa fa-circle fa-stack-2x pb-background" aria-hidden={true}/>
                    <i className="fa fa-pause-circle fa-stack-1_5x" aria-hidden={true}/>
                </span>;
        } else {
            return <span className="fa-stack fa-lg play-button" aria-hidden={true} onClick={this.playSong}>
                    <i className="fa fa-circle fa-stack-2x pb-background" aria-hidden={true}/>
                    <i className="fa fa-play-circle fa-stack-1_5x" aria-hidden={true}/>
                </span>;
        }
    }

    render() {
        let nameTag: Tag = {category: '', value: undefined};
        const tags = this.props.song.tags;
        const badges = tags.map((tag, i) => {
            // special NAME handling: we actually use the field in the table
            if (tag.category === TC_UUID(STC_NAME)) {
                nameTag = tag;
                return <span key={i}/>;
            }
            if (typeof tag.value === "undefined" || tag.value === '') {
                return <span key={i}/>;
            }
            const tagCat = checkNotNull(this.props.tagCategories.get(tag.category));
            return <span key={i} className="badge badge-pill m-1 float-left song-tag" style={{
                backgroundColor: '#' + hashColor(tagCat.name)
            }} onClick={this.clickBadge(tag, tagCat)} onMouseEnter={this.hoverStart} onMouseLeave={this.hoverEnd}>
                {TCType.formatTag(tagCat.type, tagCat.name, tag.value)}
            </span>;
        });
        return <tr key={this.props.song.key} onClick={this.toggle} className="cursor-pointer">
            <SimpleModal toggle={this.toggle} open={this.state.open} title="Edit Song" backdrop="static">
                <EditSongDialog song={this.props.song} tagCategories={this.props.tagCategories}
                                closeDialog={this.toggle}/>
            </SimpleModal>
            <td className="p-0">
                {this.renderPlayingData()}
            </td>
            <td>{this.props.index + 1}</td>
            <td style={{whiteSpace: "nowrap"}}>{nameTag.value}</td>
            <td><h4>{badges}</h4></td>
        </tr>;
    }
}


type SongListTableProps = {
    playingSong?: string,
    songs: Song[],
    displaySettings?: FilledSLDisplaySettings,
    playSong: (song: string) => void,
    pauseSong: (song: string) => void
};

function SongListTable(props: SongListTableProps) {
    const displaySettings = props.displaySettings;
    let rows: any[] = [];
    if (displaySettings) {
        rows = props.songs.map((song: Song, index) =>
            <SongTableRow song={song} tagCategories={displaySettings.tagCategories} index={index} key={index}
                          playing={song.key === props.playingSong}
                          playSong={props.playSong.bind(null, song.key)}
                          pauseSong={props.pauseSong.bind(null, song.key)}/>
        );
    }
    return <RS.Table bordered={true} striped={true} hover={true}>
        <thead className="thead-inverse">
        <tr>
            <th className="text-center"/>
            <th className="text-center">#</th>
            <th className="text-center">Name</th>
            <th className="text-center">Tag Cloud</th>
        </tr>
        </thead>
        <tbody>
        {rows}
        </tbody>
    </RS.Table>;
}

function fillDisplaySettings(state: InternalState, displaySettingsFb: SongListDisplaySettings): FilledSLDisplaySettings | undefined {
    const tagCategories: TagCategoryMap = new Map(displaySettingsFb.tagCategories.map((tc): [string, TagCategory] => {
        const tagCat = state.tagCategories && state.tagCategories.get(tc);
        if (isNullOrUndefined(tagCat)) {
            throw new Error("undefined categories");
        }
        return [tc, tagCat];
    }));
    return {
        key: displaySettingsFb.key,
        tagCategories: tagCategories,
        sortingTagCategory: displaySettingsFb.tagCategories.indexOf(displaySettingsFb.sortingTagCategory),
        sortDirection: displaySettingsFb.sortDirection
    };
}

export type SongListProps = { uuid?: string };

export const SongList = (() => {
    const UNDEFINED_SONG_LIST: SongListTableProps = {
        songs: [],
        playSong() {
        },
        pauseSong() {
        }
    };
    const songListSelector = createCachedSelector(
        (state: InternalState) => state,
        (state: InternalState, props: SongListProps) => state.songLists && props.uuid && state.songLists.get(props.uuid),
        (state: InternalState, songList): Pick<SongListTableProps, 'songs' | 'displaySettings' | 'playingSong'> => {
            if (!songList) {
                return UNDEFINED_SONG_LIST;
            }
            const displaySettingsFb = state.songListDisplaySettings && state.songListDisplaySettings.get(songList.displaySettings);
            if (typeof displaySettingsFb === 'undefined') {
                return UNDEFINED_SONG_LIST;
            }
            const displaySettings = fillDisplaySettings(state, displaySettingsFb);
            if (typeof displaySettings === 'undefined') {
                return UNDEFINED_SONG_LIST;
            }
            const songs = new Array<Song>(songList.songs.length);
            let i = 0;
            for (let song of songList.songs) {
                const songObject = state.songs && state.songs.get(song);
                if (typeof songObject === 'undefined') {
                    return UNDEFINED_SONG_LIST;
                }
                songs[i] = songObject;
                i++;
            }
            return {
                playingSong: state.playingSong,
                songs: songs,
                displaySettings: displaySettings
            };
        }
    )((state, props) => props.uuid || '');
    const stateToProps = (dispatch: Dispatch<InternalState>) => {
        return (state: InternalState, ownProps: SongListProps): SongListTableProps => {
            return {
                ...songListSelector(state, ownProps),
                playSong: song => dispatch(playSong(song)),
                pauseSong: song => dispatch(pauseSong(song))
            };
        };
    };

    return connectAdvanced(stateToProps)(SongListTable);
})();
