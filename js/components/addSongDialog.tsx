import {React} from "../routes/rbase";
import RS from "reactstrap";
import {AddSongForm} from "./addSongForm";
import {SimpleModal} from "./simpleModal";

export type ASDProps = {};

export class AddSongDialog extends React.Component<ASDProps, { open: boolean }> {

    constructor(props: ASDProps) {
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
        return <div>
            <RS.NavLink href="#" onClick={this.toggle}>Add Song</RS.NavLink>
            <SimpleModal toggle={this.toggle} open={this.state.open} title="Add Song" backdrop="static">
                <AddSongForm closeDialog={this.toggle}/>
            </SimpleModal>
        </div>;
    }
}
