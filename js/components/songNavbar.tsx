import {React} from "../routes/rbase";
import {connectAdvanced} from "react-redux";
import {InternalState} from "../datatypes/redux";
import {createDeepEqualsSelector} from "../datatypes/selectors";
import RS from "reactstrap";
import {AddSongDialog} from "./addSongDialog";
import {optional} from "../optional";

type SongNavbarProps = { signedIn: boolean, songCount: number };

class SongNavbar extends React.Component
    <SongNavbarProps, { open: boolean }> {
    constructor(props: SongNavbarProps) {
        super(props);

        this.state = {
            open: true
        };
    }

    toggleNavbar() {
        if (!this.props.signedIn) {
            // don't do anything if not logged in...
            return;
        }
        this.setState({
            open: !this.state.open
        });
    }

    render() {
        return <RS.Navbar color="success" inverse={true} className="py-md-1 mx-md-3" toggleable="md">
            <RS.NavbarToggler right onClick={() => this.toggleNavbar()}/>
            <RS.NavbarBrand href="#songs">Songs</RS.NavbarBrand>
            {this.props.signedIn
                ? <RS.Collapse navbar isOpen={this.state.open}>
                    <RS.Nav navbar className="mr-auto">
                        <RS.NavItem>
                            <AddSongDialog/>
                        </RS.NavItem>
                    </RS.Nav>
                    <RS.Nav navbar>
                        <RS.NavItem className="navbar-text">
                            Hey, you've got {this.props.songCount} song{this.props.songCount !== 1 && 's'}!
                        </RS.NavItem>
                    </RS.Nav>
                </RS.Collapse>
                : <span/>
            }
        </RS.Navbar>;
    }
}

export const LinkedSongNavbar = (() => {
    const stateToProps = () =>
        createDeepEqualsSelector(
            (state: InternalState) => state.signedIn,
            (state: InternalState) => optional(state.songs).map(s => s.size).orElse(0),
            (signedIn: boolean | undefined, songCount: number): SongNavbarProps => {
                return {
                    signedIn: signedIn || false,
                    songCount: songCount
                };
            }
        );
    return connectAdvanced(stateToProps)(SongNavbar);
})();
