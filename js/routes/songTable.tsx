import {React} from "./rbase";
import {
    FilledSLDisplaySettings,
    Song,
    SongListDisplaySettings, Tag,
    TagCategory,
    TagCategoryMap, TCType
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


type SongTableRowProps = {
    song: Song,
    tagCategories: TagCategoryMap
    index: number
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
            open: !state.open
        }));
    };

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
            return <span key={i} className="badge badge-pill badge-default m-1 float-left" style={{
                backgroundColor: '#' + hashColor(tagCat.name)
            }}>

                {TCType.formatTag(tagCat.type, tagCat.name, tag.value)}
            </span>;
        });
        return <tr key={this.props.song.key} onClick={this.toggle} className="cursor-pointer">
            <SimpleModal toggle={this.toggle} open={this.state.open} title="Edit Song" backdrop="static">
                <EditSongDialog song={this.props.song} tagCategories={this.props.tagCategories}
                                closeDialog={this.toggle}/>
            </SimpleModal>
            <td>{this.props.index + 1}</td>
            <td style={{whiteSpace: "nowrap"}}>{nameTag.value}</td>
            <td><h4>{badges}</h4></td>
        </tr>;
    }
}


type SongListTableProps = {
    songs: Song[],
    displaySettings?: FilledSLDisplaySettings
};

function SongListTable(props: SongListTableProps) {
    const displaySettings = props.displaySettings;
    let rows: any[] = [];
    if (displaySettings) {
        rows = props.songs.map((song: Song, index) =>
            <SongTableRow song={song} tagCategories={displaySettings.tagCategories} index={index} key={index}/>
        );
    }
    return <RS.Table bordered={true} striped={true} hover={true}>
        <thead className="thead-inverse">
        <tr>
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
    const UNDEFINED_SONG_LIST: SongListTableProps = {songs: []};
    const songListSelector = createCachedSelector(
        (state: InternalState) => state,
        (state: InternalState, props: SongListProps) => state.songLists && props.uuid && state.songLists.get(props.uuid),
        (state: InternalState, songList): SongListTableProps => {
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
                songs: songs,
                displaySettings: displaySettings
            };
        }
    )((state, props) => props.uuid || '');
    const stateToProps = () => {
        return (state: InternalState, ownProps: SongListProps): SongListTableProps => {
            return songListSelector(state, ownProps);
        };
    };

    return connectAdvanced(stateToProps)(SongListTable);
})();
