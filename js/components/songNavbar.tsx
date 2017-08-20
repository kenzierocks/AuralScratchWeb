import {React} from "../routes/rbase";
import {connectAdvanced} from "react-redux";
import {InternalState} from "../datatypes/redux";
import {createDeepEqualsSelector} from "../datatypes/selectors";
import RS from "reactstrap";
import {AddSongDialog} from "./addSongDialog";

type SongNavbarProps = { signedIn: boolean };

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
        return <RS.Navbar color="success" inverse={true} className="py-md-1 mx-md-3" toggleable>
            <RS.NavbarToggler right onClick={() => this.toggleNavbar()}/>
            <RS.NavbarBrand href="#songs">Songs</RS.NavbarBrand>
            {this.props.signedIn
                ? <RS.Collapse className="navbar-toggleable-md" isOpen={this.state.open}>
                    <RS.Nav navbar className="mr-auto">
                        <RS.NavItem>
                            <AddSongDialog/>
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
            (signedIn?: boolean): SongNavbarProps => {
                return {signedIn: signedIn || false};
            }
        );
    return connectAdvanced(stateToProps)(SongNavbar);
})();
