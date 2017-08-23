import React from "react";
import $ from "jquery";
import {ui} from "./firebase/firebaseSetup";
import 'bootstrap';
import {connectAdvanced} from "react-redux";
import {createDeepEqualsSelector} from "./datatypes/selectors";
import {InternalState} from "./datatypes/redux";

/// <reference path="node_modules/@types/bootstrap/index.d.ts"/>

class NavbarDatum {
    hashVal: string;

    constructor(public name: string, public endpoint: string) {
        this.hashVal = endpoint.substring(endpoint.indexOf('#') + 1);
    }
}

const navbarData = [
    new NavbarDatum("Home", "#"),
    new NavbarDatum("Songs", "#songs"),
    new NavbarDatum("Tag Categories", "#tag-categories"),
    new NavbarDatum("Song Lists", "#lists")
];

class PrimaryNavContainer extends React.Component<{}, { active: string }> {
    hashChangeHandler: () => void;

    constructor(props: any) {
        super(props);
        this.state = {
            active: location.hash.substring(1)
        };
        this.hashChangeHandler = () => {
            this.setState({
                active: location.hash.substring(1)
            });
        };
    }

    componentDidMount() {
        // immediately update, just in case
        this.hashChangeHandler();
        $(window).on('hashchange', this.hashChangeHandler);
    }

    componentWillUnmount() {
        $(window).off('hashchange', this.hashChangeHandler);
    }

    render() {
        return <ul className="navbar-nav mr-auto">
            {navbarData.map(data => {
                const isActive = this.state.active === data.hashVal;
                let liClass = "nav-item";
                if (isActive) {
                    liClass += " active";
                }
                return <li className={liClass} key={data.endpoint}>
                    <a className="nav-link" href={data.endpoint}>
                        {data.name}{isActive && <span className="sr-only"> (current)</span>}
                    </a>
                </li>;
            })}
        </ul>;
    }

}

class FirebaseAuthUi extends React.Component {
    componentDidMount() {
        ui.startUi();
    }

    componentWillUnmount() {
        ui.resetUi();
    }

    render() {
        return <div id="firebaseui-auth-container"/>;
    }
}

ui.addSignInCallback('modalHide', () => {
    $('#signInModal').modal('hide');
});

function SignInModal() {
    return <div className="modal fade" id="signInModal" tabIndex={-1} role="dialog" aria-labelledby="signInModalLabel"
                aria-hidden="true">
        <div className="modal-dialog" role="document">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title" id="signInModalLabel">Sign In</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <FirebaseAuthUi/>
                </div>
                <div className="modal-footer justify-content-center">
                    <p className="text-center">
                        Neat sign-in UI provided by <a href="https://github.com/firebase/firebaseui-web">Firebase Auth
                        UI</a>
                    </p>
                </div>
            </div>
        </div>
    </div>;
}

function signOut() {
    firebase.auth().signOut();
}

function AccountManagementNavbarPlain(props: { signedIn: boolean }) {
    if (props.signedIn) {
        return <div>
            <ul className="navbar-nav">
                <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="http://example.com" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Signed in!
                    </a>
                    <div className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                        <a className="dropdown-item" onClick={signOut}>Sign Out</a>
                    </div>
                </li>
            </ul>
        </div>;
    } else {
        return <div>
            <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#signInModal">
                Sign In
            </button>
            <SignInModal/>
        </div>;
    }
}

const AccountManagementNavbar = (() => {
    const stateToProps = () => {
        return createDeepEqualsSelector(
            (state: InternalState) => state.signedIn,
            (signedIn) => ({signedIn: signedIn})
        );
    };
    return connectAdvanced(stateToProps)(AccountManagementNavbarPlain);
})();

export function createNavbar() {
    const navId = "mainNavContent";
    return <nav className="navbar navbar-toggleable-md navbar-inverse bg-primary py-md-2">
        <button className="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse"
                data-target={"#" + navId} aria-controls={navId} aria-expanded="false"
                aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"/>
        </button>
        <a className="navbar-brand" href="./">
            <img src="img/logo.svg" width={64} height={64} className="d-inline-block mx-3" alt=""/>
            Aural Scratch
        </a>
        <div className="collapse navbar-collapse" id={navId}>
            <PrimaryNavContainer/>
            <AccountManagementNavbar/>
        </div>
    </nav>;
}