import {React} from "./rbase";
import {FilledSLDisplaySettings, Song, SongListDisplaySettings, TagCategory, TagCategoryMap} from "../datatypes/main";
import {connectAdvanced} from "react-redux";
import {InternalState} from "../datatypes/redux";
import createCachedSelector from "re-reselect";
import RS from "reactstrap";
import {SimpleModal} from "../components/simpleModal";
import {EditSongDialog} from "../components/editSongDialog";
import {TC_UUID} from "../idConstants";
import {optional} from "../optional";


type SongTableRowProps = {
    song: Song,
    tagCategories: TagCategory[]
    tagCatColElements: any[],
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
        const cols = this.props.tagCategories.map(tc => {
            const assocTag = this.props.song.sortingTags[TC_UUID(tc)];
            return <td key={TC_UUID(tc)}>
                {typeof assocTag !== "undefined"
                    ? optional(this.props.song.tags[assocTag])
                        .map(tag => tag.value).orElse('Error, missing assocTag ' + assocTag)
                    : ''}
            </td>;
        });
        while (cols.length < this.props.tagCatColElements.length) {
            cols.push(<td key={cols.length}/>);
        }
        return <tr key={this.props.song.key} onClick={this.toggle}>
            <SimpleModal toggle={this.toggle} open={this.state.open} title="Edit Song" backdrop="static">
                <EditSongDialog song={this.props.song} tagCategories={this.props.tagCategories}
                                closeDialog={this.toggle}/>
            </SimpleModal>
            <td>{this.props.index + 1}</td>
            {cols}
        </tr>;
    }
}


type SongListTableProps = {
    songs: Song[],
    displaySettings?: FilledSLDisplaySettings
};

function SongListTable(props: SongListTableProps) {
    const displaySettings = props.displaySettings;
    let tagCategories: any[] = [];
    let rows: any[] = [];
    if (displaySettings) {
        tagCategories = displaySettings.tagCategories.map(tc =>
            <th className="text-center" key={tc.name}>{tc.name}</th>
        );
        rows = props.songs.map((song: Song, index) =>
            <SongTableRow song={song} tagCategories={displaySettings.tagCategories} tagCatColElements={tagCategories}
                          index={index}/>
        );
    }
    return <RS.Table bordered={true} striped={true} hover={true}>
        <thead className="thead-inverse">
        <tr>
            <th className="text-center">#</th>
            {tagCategories}
        </tr>
        </thead>
        <tbody>
        {rows}
        </tbody>
    </RS.Table>;
}

function fillDisplaySettings(state: InternalState, displaySettingsFb: SongListDisplaySettings): FilledSLDisplaySettings | undefined {
    const tagCategories = new Array<TagCategory>(displaySettingsFb.tagCategories.length);
    let i = 0;
    for (let tc of displaySettingsFb.tagCategories) {
        const category = state.tagCategories && state.tagCategories.get(tc);
        if (typeof category === 'undefined') {
            return undefined;
        }
        tagCategories[i] = category;
        i++;
    }
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
