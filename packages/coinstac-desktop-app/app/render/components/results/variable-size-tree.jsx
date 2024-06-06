import React from 'react';
import { VariableSizeList } from 'react-window';

import Tree, { createTreeComputer } from './tree';

export const createBasicRecord = (pub, parent = null) => ({
  child: null,
  isShown: parent ? parent.public.isOpen && parent.isShown : true,
  parent,
  public: pub,
  sibling: null,
  visited: false,
});

export const getIdByIndex = (index, { getRecordData }) => {
  const { data: { id } } = getRecordData(index);
  return id;
};

const computeTree = createTreeComputer({
  createRecord: (
    data,
    { recomputeTree, resetAfterId },
    parent,
    previousRecord,
  ) => {
    const record = createBasicRecord(
      {
        data,
        height: previousRecord
          ? previousRecord.public.height
          : data.defaultHeight,
        isOpen: previousRecord
          ? previousRecord.public.isOpen
          : data.isOpenByDefault,
        resize: (height, shouldForceUpdate) => {
          record.public.height = height;
          resetAfterId(record.public.data.id, shouldForceUpdate);
        },
        setOpen: state => recomputeTree({
          [data.id]: state,
        }),
      },
      parent,
    );

    return record;
  },
});

export default class VariableSizeTree extends Tree {
  constructor(props) {
    super(props);
    this.getItemSize = this.getItemSize.bind(this);
    this.state = {
      ...this.state,
      computeTree,
      resetAfterId: this.resetAfterId.bind(this),
    };
  }

  resetAfterId(id, shouldForceUpdate) {
    const { list, order } = this.state;
    if (list.current) {
      list.current.resetAfterIndex(order.indexOf(id), shouldForceUpdate);
    }
  }

  recomputeTree(state) {
    return super.recomputeTree(state).then(() => {
      if (this.state.list.current) {
        this.state.list.current.resetAfterIndex(0, true);
      }
    });
  }

  getItemSize(index) {
    return this.getRecordData(index).height;
  }

  render() {
    const {
      children,
      placeholder,
      itemSize,
      rowComponent,
      treeWalker,
      ...rest
    } = this.props;
    const { attachRefs, order } = this.state;

    return placeholder && order && order.length === 0 ? (
      placeholder
    ) : (
      <VariableSizeList
        {...rest}
        itemCount={order.length}
        itemData={this.getItemData()}
        itemKey={getIdByIndex}
        itemSize={this.getItemSize}
        ref={attachRefs}
      >
        {rowComponent}
      </VariableSizeList>
    );
  }
}
