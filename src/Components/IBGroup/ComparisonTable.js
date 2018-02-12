import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {getAllArchitecturesFromIBGroupByFlavor, getDisplayName} from '../../processing';
import _ from 'underscore';
import uuid from 'uuid';
import config from '../../config'

const {archShowCodes, tooltipDelayInMs, urls} = config;

class ComparisonTable extends Component {
    static propTypes = {
        data: PropTypes.array
    };

    constructor(props) {
        super(props);
        this.state = {
            ibComparison: props.data,
            archsByIb: getAllArchitecturesFromIBGroupByFlavor(props.data)
        };
    }

    static renderCell(cellInfo) {
        return (
            <td key={uuid.v4()}>
                {cellInfo}
            </td>
        )
    }

    static renderLabel({colorType = "default", value, glyphicon, link, tooltipContent} = {}) {
        if (tooltipContent !== undefined) {
            return (
                <OverlayTrigger key={uuid.v4()} placement="top"
                                overlay={<Tooltip id={uuid.v4()}>{tooltipContent}</Tooltip>}
                                delay={tooltipDelayInMs}>
                    <a href={link} className={`btn label label-${colorType}`}>
                        {glyphicon ? <span className={`glyphicon ${glyphicon}`}/> : value}
                    </a>
                </OverlayTrigger>
            );
        } else {
            return (
                <a href={link} className={`btn label label-${colorType}`}>
                    {glyphicon ? <span className={`glyphicon ${glyphicon}`}/> : value}
                </a>
            );
        }
    }

    renderRowCells({resultType, ifWarning, ifError, ifFailed, ifPassed, ifUnknown}) {
        /**
         * General purpose function, it will re-render row according to given config
         * */
        const {archsByIb, ibComparison} = this.state;
        return ibComparison.map((ib, pos) => {
            const el = archsByIb[pos];
            // generate cell for each arch
            return el.archs.map(arch => {
                const results = _.findWhere(ib[resultType], {"arch": arch});
                if (!results) {
                    // if not found,
                    return ComparisonTable.renderCell();
                }
                let defaultTooltipContent, defaultCellInfo = undefined;
                if (_.isEmpty(results)) {
                    defaultTooltipContent = <p>Results are unknown</p>;
                    defaultCellInfo = ComparisonTable.renderLabel({
                        colorType: 'default',
                        glyphicon: 'glyphicon-question-sign',
                        defaultTooltipContent
                    });
                    return ComparisonTable.renderCell(defaultCellInfo);
                }
                switch (results.passed) {
                    case true:
                    case "passed":
                        defaultTooltipContent = <p>All good!</p>;
                        defaultCellInfo = ComparisonTable.renderLabel(
                            {
                                colorType: 'success',
                                glyphicon: 'glyphicon-ok-circle',
                                tooltipContent: defaultTooltipContent
                            }
                        );
                        return ifPassed ? ifPassed(results, ib.release_name) : ComparisonTable.renderCell(defaultCellInfo);
                    case false:
                    case "error":
                        return ifError ? ifError(results, ib.release_name) : ComparisonTable.renderCell();
                    case "failed":
                        return ifFailed ? ifFailed(results, ib.release_name) : ComparisonTable.renderCell();
                    case "warning":
                        return ifWarning ? ifWarning(results, ib.release_name) : ComparisonTable.renderCell();
                    case "unknown":
                        defaultTooltipContent = <p>Results are unknown</p>;
                        defaultCellInfo = ComparisonTable.renderLabel(
                            {glyphicon: 'glyphicon-question-sign', tooltipContent: defaultTooltipContent}
                        );
                        return ifUnknown ? ifUnknown(arch, ib) : ComparisonTable.renderCell(defaultCellInfo);
                    default:
                        console.error("There is new value: " + results.passed);
                        return ComparisonTable.renderCell();
                }
            })
        })
    }

    renderRowCellsWithDefaultPreConfig({resultType, getUrl, showLabelConfig}) {
        const showGeneralResults = this.showGeneralResults(showLabelConfig, getUrl);
        const config = {
            resultType: resultType,
            ifPassed: function (details, ib) {
                let tooltipContent = <p><strong>All good!</strong> Click for more info.</p>;
                let cellInfo = ComparisonTable.renderLabel(
                    {
                        colorType: 'success',
                        glyphicon: 'glyphicon-ok-circle',
                        tooltipContent,
                        link: getUrl({"file": details.file, "arch": details.arch, "ibName": ib})
                    }
                );
                return ComparisonTable.renderCell(cellInfo);
            },
            ifError: showGeneralResults,
            ifFailed: showGeneralResults,
            ifWarning: showGeneralResults
        };
        return this.renderRowCells(config);
    }

    showGeneralResults(showLabelConfig, getUrl) {
        return function (result, ib) {
            const {details, done} = result;
            const resultKeys = Object.keys(details); //get all object properties name
            let labelConfig = {value: 0};

            for (let i = 0; i < showLabelConfig.length; i++) {
                let el = showLabelConfig[i];
                el.groupFields.map((predicate) => {
                    if (typeof predicate === "function") {
                        resultKeys.map(key => {
                            if (predicate(key)) {
                                labelConfig.value += details[key] * 1;
                            }
                        });
                    } else {
                        if (resultKeys.indexOf(predicate) > -1) {
                            labelConfig.value += details[predicate] * 1;
                        }
                    }
                });
                if (labelConfig.value > 0) {
                    labelConfig.colorType = el.color;
                    break;
                }
            }
            if (done === false) {
                labelConfig.value = '' + labelConfig.value + '*';
            }
            const tooltipContent = resultKeys.map(key => {
                return <p>{key}: {details[key]}</p>
            });
            return ComparisonTable.renderCell(ComparisonTable.renderLabel(
                {
                    colorType: labelConfig.colorType, value: labelConfig.value, tooltipContent,
                    link: getUrl({"file": result.file, "arch": result.arch, "ibName": ib})
                }
                )
            );

        };
    }

    renderOtherTestResults({resultType, getUrl, showLabelConfig}) {
        const showGeneralResults = this.showGeneralResults(showLabelConfig, getUrl);
        const config = {
            resultType: resultType,
            ifPassed: function (details, ib) {
                let tooltipContent = <p><strong>All good!</strong> Click for more info.</p>;
                let cellInfo = ComparisonTable.renderLabel(
                    {
                        colorType: 'success',
                        glyphicon: 'glyphicon-ok-circle',
                        tooltipContent,
                        link: getUrl({"file": details.file, "arch": details.arch, "ibName": ib})
                    }
                );
                return ComparisonTable.renderCell(cellInfo);
            },
            ifError: function (details, ib) {
                let tooltipContent = <p><strong>There are errors!</strong> Click for more info.</p>;
                let cellInfo = ComparisonTable.renderLabel(
                    {
                        colorType: 'danger',
                        glyphicon: 'glyphicon-remove-sign',
                        tooltipContent,
                        link: getUrl({"file": details.file, "arch": details.arch, "ibName": ib})
                    }
                );
                return ComparisonTable.renderCell(cellInfo);
            },
            ifFailed: showGeneralResults,
            ifWarning: showGeneralResults
        };
        return this.renderRowCells(config);
    }

    render() {
        const {archsByIb} = this.state;

        // TODO refactor and put to configs
        const getBuildOrUnitUrl = function (params) {
            const {file, arch, ibName} = params;
            if (!file) {
                // do nothing
            } else if (file === 'not-ready') {
                return urls.scramDetailUrl + arch + ";" + ibName
            } else {
                let link_parts = file.split('/');
                const si = 4;
                link_parts = link_parts.slice(si, si + 5);
                return urls.buildOrUnitTestUrl + link_parts.join('/');
            }
        };

        const getRelValUrl = function (params) {
            const {file, arch, ibName} = params;
            if (!file) {
                // do nothing
            } else if (file === 'not-ready') {
                return urls.relVals + arch + ';' + ibName
            } else {
                const si = 4;
                let link_parts = file.split('/');
                return urls.relVals + link_parts[si] + ';' + link_parts[si + 4]
            }
        };

        const getFWliteUrl = function (params) {
            const {file, arch, ibName} = params;
            if (file === 'not-ready') {
                // return nothing
            } else {
                const si = 4;
                let link_parts = file.split('/');
                link_parts = link_parts.slice(si, si + 5);
                return urls.fwliteUrl + link_parts.join('/');
            }
        };

        const getOtherTestUrl = function (params) {
            const {file, arch, ibName} = params;
            const si = 4;
            let link_parts = file.split('/');
            link_parts = link_parts.slice(si, si + 5);
            return urls.showAddOnLogsUrls + link_parts.join('/') + '/addOnTests/';
        };

        return (
            <div className="table-responsive">
                <Table striped={true} bordered={true} condensed={true} hover>
                    <thead>
                    <tr>
                        <th rowSpan={2}/>
                        {/* IB flavors row*/}
                        {archsByIb.map(item => {
                            return <th key={uuid.v4()} colSpan={item.archs.length}>{getDisplayName(item.flavor)}</th>
                        })}
                    </tr>
                    <tr>
                        {/* Arch names row */}
                        {archsByIb.map(item => {
                            return item.archs.map(arch => {
                                return (
                                    <th key={uuid.v4()}>
                                        <a href={urls.q_a(arch, item.name)} style={{color: 'black'}}>
                                            {arch.split("_").map(str => {
                                                const {color} = archShowCodes;
                                                return (
                                                    <div key={uuid.v4()}>
                                                        <span style={{backgroundColor: color[str]}}>{str}</span>
                                                    </div>
                                                )
                                            })}
                                        </a>
                                    </th>
                                )
                            })
                        })}
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>
                            <b>Builds</b>
                        </td>
                        {this.renderRowCellsWithDefaultPreConfig({
                                resultType: 'builds',
                                getUrl: getBuildOrUnitUrl,
                                // first group will be showed as label,
                                // if not found, then second group will be showed
                                showLabelConfig: [
                                    {
                                        groupFields: [(key) => key.includes("Error")],
                                        color: "danger"
                                    },
                                    {
                                        groupFields: ["compWarning"],
                                        color: "warning"
                                    }
                                ],
                            }
                        )}
                    </tr>
                    <tr>
                        <td><b>Unit Tests</b></td>
                        {this.renderRowCellsWithDefaultPreConfig({
                                resultType: 'utests',
                                getUrl: getBuildOrUnitUrl,
                                showLabelConfig: [{
                                    groupFields: ["num_fails"],
                                    color: "danger"
                                }]
                            }
                        )}
                    </tr>
                    <tr>
                        <td><b>RelVals</b></td>
                        {this.renderRowCellsWithDefaultPreConfig({
                                resultType: 'relvals',
                                getUrl: getRelValUrl,
                                showLabelConfig: [
                                    {
                                        groupFields: ["num_failed"],
                                        color: "danger"
                                    },
                                    {
                                        groupFields: ["known_failed"],
                                        color: "info"
                                    },
                                    {
                                        groupFields: ["num_passed"],
                                        color: "success"
                                    }
                                ]
                            }
                        )}
                    </tr>
                    <tr>
                        <td><b>Other Tests</b></td>
                        {this.renderOtherTestResults({
                                resultType: 'addons',
                                getUrl: getOtherTestUrl,
                                showLabelConfig: [
                                    {
                                        groupFields: ["num_failed"],
                                        color: "danger"
                                    },
                                    {
                                        groupFields: ["known_failed"],
                                        color: "info"
                                    },
                                    {
                                        groupFields: ["num_passed"],
                                        color: "success"
                                    }
                                ]
                            }
                        )}
                    </tr>
                    <tr>
                        <td><b>FWLite</b></td>
                        {this.renderRowCellsWithDefaultPreConfig({
                                resultType: 'fwlite',
                                getUrl: getFWliteUrl,
                                showLabelConfig: [
                                    {
                                        groupFields: ["num_failed"],
                                        color: "danger"
                                    },
                                    {
                                        groupFields: ["known_failed"],
                                        color: "info"
                                    },
                                    {
                                        groupFields: ["num_passed"],
                                        color: "success"
                                    }
                                ]
                            }
                        )}
                    </tr>
                    </tbody>
                </Table>
            </div>
        )

    }

}

export default ComparisonTable;
