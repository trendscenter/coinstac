import { Button } from 'react-bootstrap';
import React, { Component, PropTypes } from 'react';
import { ColumnNames, Search, sortColumn, Table } from 'reactabular';
import orderBy from 'lodash/orderBy';

export default class ProjectFiles extends Component {
  constructor(props) {
    super(props);

    this.columnFilters = this.columnFilters.bind(this);
    this.onClearSearchClick = this.onClearSearchClick.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);

    this.state = {
      columns: [{
        header: 'File',
        property: 'filename',
      }, {
        cell: (value, data, rowIndex) => {
          return {
            value: (
              <div className="text-right">
                <Button
                  bsSize="small"
                  bsStyle="danger"
                  onClick={this.props.onRemoveFileClick.bind(null, data[rowIndex])}
                  title="Remove file from project">
                  ×
                </Button>
              </div>
            ),
          };
        },
        header: 'Remove',
      }],
      search: null,
      sortingColumn: null,
    };
  }

  columnFilters(column) {
    const { columns } = this.state;
    const config = {
      onClick: column => {
        // Don't sort on the 'remove file' column
        if (column.header !== 'Remove') {
          sortColumn(columns, column, this.setState.bind(this));
        }
      },
    };

    return (
      <thead>
        <ColumnNames config={config} columns={columns} />
      </thead>
    );
  }

  onSearchChange(filter = null) {
    this.setState({
      search: filter,
    });
  }

  onClearSearchClick() {
    this.setState({
      search: null,
    });

    // Reset Reactabular's search component's value
    this.refs['table-search'].setState({ query: '' });
  }

  render() {
    const { columns, search, sortingColumn } = this.state;
    const { files } = this.props;

    let data = search ?
      Search.search(files, columns, search.column, search.query) :
      files;

    if (sortingColumn) {
      data = sortColumn.sort(data, sortingColumn, orderBy);
    }

    return (
      <div>
        <div>
          <Search
            columns={columns}
            data={data}
            onChange={this.onSearchChange}
            ref="table-search"
          />
          <Button
            bsStyle="default"
            bsSize="small"
            onClick={this.onClearSearchClick}
            title="Clear search">
            ×
          </Button>
        </div>
        <Table
          className="table table-striped"
          columns={columns}
          columnNames={this.columnFilters}
          data={data}
          rowKey="id"
        />
      </div>
    );
  }
}

ProjectFiles.propTypes = {
  files: PropTypes.array.isRequired,
  onRemoveFileClick: PropTypes.func.isRequired,
};
