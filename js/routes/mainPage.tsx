import {React, Route} from "./rbase";

export const mainPage: Route = {
    render: () => {
        return <div>
            <p>Howdy! Welcome to Aural Scratch, the simple tag-based music synchronization tool!</p>
            <p>To begin, add songs in the <a href="#songs">Songs</a> tab.</p>
        </div>;
    },
    title: 'Home'
};
