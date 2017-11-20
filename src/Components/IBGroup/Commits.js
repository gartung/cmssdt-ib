import React, {Component} from 'react';
import {Panel, Tab, Tabs} from "react-bootstrap";

class Commits extends Component {
    // TODO - prop types
    constructor(props) {
        super(props);
        console.log(props);
        const {commitPanelProps} = props;
        this.state = {
            commitPanelProps
        }
    }

    render() {
        // TODO - finish
        // TODO - if it is only 1 commit( eg. release), should I show tabs ?
        // console.log(this.state.commitPanelProps)
        return (
            <Panel {...this.state.commitPanelProps}
                   header={'Commits'}>
                <Tabs defaultActiveKey={1} animation={false} id="noanim-tab-example">
                    <Tab eventKey={1} title="CMSSW_10_0_X">
                        <p/>Tab 1 content
                    </Tab>
                    <Tab eventKey={2} title="CMSSW_10_0_ROOT6_X">
                        <p>Commit 1</p>
                    </Tab>
                    <Tab eventKey={3} title="CMSSW_10_0_DEVEL_X">
                        <p/>Tab 3 content
                    </Tab>
                    <Tab eventKey={4} title="CMSSW_10_0_CLANG_X">
                        <p/>Tab 3 content
                    </Tab>
                    <Tab eventKey={5} title="CMSSW_10_0_ASAN_X">
                        <p/>Tab 3 content
                    </Tab>
                </Tabs>
            </Panel>
        )
    }

}

export default Commits;
