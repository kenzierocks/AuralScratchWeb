import React from "react";
import $ from "jquery";
import {checkNotNull} from "../preconditions";

export interface Route {
    render(): JSX.Element
    cardWrap?: boolean
    title?: string
}

const NULL_ROUTE: Route = {
    render: () => <div>
        <p>404, not found!</p>
        <a href="#" className="btn btn-primary">Take me back to the place I call Home!</a>
    </div>,
    title: "This Page is a Figment of the Client's Imagination!"
};

type RouterProps = { paths: Map<string, Route> };
export class Router extends React.Component<RouterProps, { selected: string }> {
    hashEventListener: () => void;

    constructor(props: RouterProps) {
        super(props);
        this.state = {
            selected: location.hash.substring(1)
        };
        this.hashEventListener = () => {
            this.setState((prevState) => {
                const copy = $.extend({}, prevState);
                copy.selected = location.hash.substring(1);
                return copy;
            });
        };
    }

    componentDidMount() {
        $(window).on('hashchange.router', this.hashEventListener);
    }

    componentWillUnmount() {
        $(window).off('hashchange.router', this.hashEventListener);
    }

    render() {
        let route = this.props.paths.get(this.state.selected) || NULL_ROUTE;
        let content = <div>
            {route.title && <h3 className="card-title">{route.title}</h3>}
            {route.render()}
        </div>;
        return route.cardWrap || typeof route.cardWrap === 'undefined' ? (
            <div className="card text-center">
                <div className="card-block">
                    {content}
                </div>
            </div>
        ) : content;
    }
}
