import {React, Route} from "./rbase";
import {SongList, SongListProps} from "./songTable";
import {connectAdvanced} from "react-redux";
import {InternalState} from "../datatypes/redux";
import {createDeepEqualsSelector} from "../datatypes/selectors";
import {LinkedSongNavbar} from "../components/songNavbar";

const Songs = (() => {
    const stateToProps = () => {
        return createDeepEqualsSelector(
            (state: InternalState) => state.librarySongList,
            (libraryId?: string): SongListProps => {
                return {uuid: libraryId};
            }
        );
    };
    return connectAdvanced(stateToProps)(SongList);
})();

export const songs: Route = {
    render: () => {
        return <div>
            <LinkedSongNavbar/>
            <div className="card text-center">
                <div className="card-block">
                    <Songs/>
                </div>
            </div>
        </div>;
    },
    cardWrap: false
};
