import React from 'react';
import Reactabular from 'reactabular';
import { Button } from 'react-bootstrap';
import _ from 'lodash';
const Search = Reactabular.Search;
const RTable = Reactabular.Table;
const sortColumn = Reactabular.sortColumn;

export default class ProjectFiles extends React.Component {

    static propTypes = {
        projectId: React.PropTypes.string
    };

    constructor(props) {
        super(props);
        if (!props.project || !props.project._id) {
            throw new ReferenceError('project prop is required to render project files');
        }
        if (!props.project.files) {
            throw new ReferenceError('project.files attr is required to render project files');
        }
        this.columns = [
            {
                property: 'filename',
                header: 'File'
            },
            {
                header: 'Is Control',
                cell: (value, data, rowIndex) => {
                    value = data[rowIndex]; // so weird.
                    const isChecked = _.get(value, 'tags.control');
                    const handleChange = props.toggleControlTag.bind(null, value);
                    return {
                        value: (
                            <input
                                checked={isChecked}
                                onChange={handleChange}
                                type="checkbox" />
                        ),
                    };
                }
            },
            {
                header: 'Delete',
                cell: (value, data, rowIndex, property) => {
                    value = data[rowIndex];
                    return {
                        value: (
                            <span>
                                <span
                                    onClick={ () => this.props.deleteFile(data) }
                                    style={{cursor: 'pointer', padding: '10px'}}
                                    >&#10007;
                                </span>
                            </span>
                        )
                    };
                },
            }
        ];
    }

    render() {
        let { project, _search } = this.props;
        let files = project.files;
        let body;
        _search = _search || {};

        if (!files) {
            body = <span>Loading files...</span>
        } else if (!files.length) {
            body = <span>No project files.  Add some!</span>
        } else {
            // apply search reduction
            files = Search.search(files, this.columns, _search.column, _search.query);
            body = (
                <div className="page-header clearfix">
                    <div className="pull-right" style={{ marginRight: '4px'}}>
                        <Button
                            bsStyle="default"
                            onClick={ () => this.props.toggleControlTag(project.files) }>
                            Toggle “Is Control”
                        </Button>
                    </div>
                    <div className='well search-container'>
                        Search:
                        <Search
                            columns={ this.columns }
                            data={ files.models }
                            onChange={ () => console.warn('this.props.handleFileSearch') }>
                        </Search>
                    </div>
                    <RTable
                        className="table"
                        columns={ this.columns}
                        data={ files } />
                </div>
            );
        }

        return (
            <div>
                <Button onClick={ this.props.triggerAddFiles } bsStyle="info">
                    <span
                        className="glyphicon glyphicon-open-file"
                        aria-hidden="true">
                    </span>
                    {'Add +'}
                </Button>
                {' '}
                { body }
            </div>
        );
    }
};
