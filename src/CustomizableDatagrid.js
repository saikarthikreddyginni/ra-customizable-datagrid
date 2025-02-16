import React, { Component } from 'react';
import T from 'prop-types';

import { Datagrid, Button } from 'react-admin';

import isEmpty from 'lodash/isEmpty';
import filter from 'lodash/filter';
import get from 'lodash/get';

import ColumnIcon from '@material-ui/icons/ViewColumn';
import { Toolbar } from '@material-ui/core';

import { withStyles, createStyles } from '@material-ui/core/styles';

import SelectionDialog from './SelectionDialog';
import LocalStorage from './LocalStorage';

const styles = createStyles({
  customizableGridToolbar: {
    justifyContent: 'flex-end',
  },
});

const arrayToSelection = values =>
  values.reduce((selection, columnName) => {
    selection[columnName] = true;
    return selection;
  }, {});

// CustomizableDatagrid allows to show/hide columns dynamically
// the preferences are stored in local storage
class CustomizableDatagrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpened: false,
      selection: this.getInitialSelection(),
    };
  }

  getColumnNames() {
    const { children } = this.props;
    return filter(React.Children.map(children, field => get(field, ['props', 'source'])));
  }

  getColumnLabels() {
    const { children } = this.props;
    return filter(
      React.Children.map(
        children,
        field =>
          field && {
            source: get(field, ['props', 'source']),
            label: get(field, ['props', 'label']),
          },
      ),
      item => item && item.source,
    );
  }

  getInitialSelection() {
    const { defaultColumns, resource, children, storage } = this.props;

    const previousSelection = storage.get(resource);

    // if we have a previously stored value, let's return it
    if (!isEmpty(previousSelection)) {
      return previousSelection;
    }

    // if defaultColumns are set let's return them
    if (!isEmpty(defaultColumns)) {
      return arrayToSelection(defaultColumns);
    }

    // otherwise we fallback on the default behaviour : display all columns
    return arrayToSelection(this.getColumnNames());
  }

  // updates the storage with the internal state value
  updateStorage = () => {
    this.props.storage.set(this.props.resource, this.state.selection);
  };

  toggleColumn = columnName => {
    const previousSelection = this.state.selection;
    const selection = {
      ...previousSelection,
      [columnName]: !previousSelection[columnName],
    };
    this.setState({ selection }, this.updateStorage);
  };

  handleOpen = () => this.setState({ modalOpened: true });
  handleClose = () => this.setState({ modalOpened: false });

  renderChild = child => {
    const source = get(child, ['props', 'source']);
    const { selection } = this.state;

    // Show children without source, or children explicitly visible
    if (!source || selection[source]) {
      return React.cloneElement(child, {});
    }

    return null;
  };

  render() {
    const { children, defaultColumns, buttonLabel, ...rest } = this.props;
    const { selection, modalOpened } = this.state;

    return (
      <div>
        <Toolbar className={this.props.classes.customizableGridToolbar}>
          <Button aria-label="add" label={buttonLabel} onClick={this.handleOpen}>
            <ColumnIcon />
          </Button>
        </Toolbar>
        {modalOpened && (
          <SelectionDialog
            selection={selection}
            columns={this.getColumnLabels()}
            onColumnClicked={this.toggleColumn}
            onClose={this.handleClose}
          />
        )}
        <Datagrid {...rest}>{React.Children.map(children, this.renderChild)}</Datagrid>
      </div>
    );
  }
}

CustomizableDatagrid.propTypes = {
  defaultColumns: T.arrayOf(T.string),
  storage: T.shape({
    get: T.func.isRequired,
    set: T.func.isRequired,
  }),
  buttonLabel: T.string,
  classes: T.object,
};

CustomizableDatagrid.defaultProps = {
  defaultColumns: [],
  storage: LocalStorage,
  buttonLabel: 'columns',
  classes: {},
};

export default withStyles(styles)(CustomizableDatagrid);
