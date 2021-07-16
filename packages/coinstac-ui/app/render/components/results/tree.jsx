/*
eslint-disable no-nested-ternary, no-continue,
no-restricted-syntax, react/no-unused-state, react/prop-types
*/
import React, { createRef, PureComponent } from 'react';
import mergeRefs from 'react-merge-refs';

export const Row = ({
  index,
  data: { component: Node, getRecordData, treeData },
  style,
  isScrolling,
}) => {
  const data = getRecordData(index);

  return (
    <Node
      isScrolling={isScrolling}
      style={style}
      treeData={treeData}
      {...data}
    />
  );
};

const generateNewTree = (
  { createRecord },
  {
    buildingTaskTimeout, placeholder, async = false, treeWalker,
  },
  state
) => {
  const shouldPreservePreviousState = async && state.records !== undefined;
  const { records: previousRecords } = state;

  const order = [];
  const records = new Map();
  const requestIdleCallbackOptions = buildingTaskTimeout
    ? { timeout: buildingTaskTimeout }
    : undefined;

  const meta = new WeakMap();

  const iter = treeWalker();
  const { value: root } = iter.next();

  const rootRecord = createRecord(
    root.data,
    state,
    undefined,
    shouldPreservePreviousState
      ? previousRecords.get(root.data.id)
      : undefined
  );
  records.set(rootRecord.public.data.id, rootRecord);
  meta.set(rootRecord, root);

  let currentRecord = rootRecord;
  let isTraversingRoot = true;
  let tempRecord = rootRecord;

  const useIdleCallback = 'requestIdleCallback' in window && placeholder !== undefined && !(placeholder === null && !state.order);

  const hasTime = useIdleCallback ? deadline => deadline.timeRemaining() > 0 : () => true;

  const task = (deadline) => {
    while (currentRecord !== null) {
      if (!hasTime(deadline)) {
        requestIdleCallback(task, requestIdleCallbackOptions);

        return;
      }

      if (!currentRecord.visited) {
        const { value: child } = iter.next(meta.get(currentRecord));

        if (child === undefined) {
          if (isTraversingRoot) {
            isTraversingRoot = false;
          } else {
            if (currentRecord.isShown) {
              order.push(currentRecord.public.data.id);
            }

            currentRecord.visited = currentRecord.child !== null;

            currentRecord = currentRecord.child !== null
              ? currentRecord.child
              : currentRecord.sibling !== null
                ? currentRecord.sibling
                : currentRecord.parent;
          }

          tempRecord = currentRecord;

          continue;
        }

        const childRecord = createRecord(
          child.data,
          state,
          isTraversingRoot ? undefined : currentRecord,
          shouldPreservePreviousState
            ? previousRecords.get(child.data.id)
            : undefined
        );
        records.set(childRecord.public.data.id, childRecord);
        meta.set(childRecord, child);

        if (!isTraversingRoot && tempRecord === currentRecord) {
          tempRecord.child = childRecord;
        } else {
          tempRecord.sibling = childRecord;
        }

        tempRecord = childRecord;
      } else {
        currentRecord.visited = false;
        currentRecord = currentRecord.sibling !== null
          ? currentRecord.sibling : currentRecord.parent;
        tempRecord = currentRecord;
      }
    }

    if (useIdleCallback) {
      state.setState({
        order,
        records,
        updateRequest: {},
      });
    }
  };

  if (useIdleCallback) {
    requestIdleCallback(task, requestIdleCallbackOptions);
  } else {
    task();
  }

  return placeholder !== undefined && async && state.order
    ? state
    : { order, records };
};

const MAX_FUNCTION_ARGUMENTS = 32768;

const updateExistingTree = (
  { order, records },
  { opennessState }
) => {
  if (typeof opennessState !== 'object') {
    return null;
  }

  for (const id in opennessState) {
    if (!records.has(id)) {
      continue;
    }

    const opts = opennessState[id];
    const ownerRecord = records.get(id);

    const {
      open,
      subtreeCallback = () => {},
    } = typeof opts === 'boolean' ? { open: opts } : opts;

    let update;
    let apply;

    if (ownerRecord.isShown) {
      if (open) {
        const index = order.indexOf(id);

        let recordNextToSubtree = ownerRecord;

        while (recordNextToSubtree !== null) {
          if (recordNextToSubtree.sibling !== null) {
            recordNextToSubtree = recordNextToSubtree.sibling;
            break;
          }

          recordNextToSubtree = recordNextToSubtree.parent;
        }

        const countToRemove = recordNextToSubtree === null
          ? order.length - 1 - index
          : order.indexOf(recordNextToSubtree.public.data.id) - 1 - index;

        const orderParts = [
          [index + 1, countToRemove],
        ];

        let orderPartsCursor = 0;

        update = (record) => {
          record.isShown = record.parent
            ? record.parent.public.isOpen && record.parent.isShown
            : true;

          if (record.isShown) {
            orderParts[orderPartsCursor].push(record.public.data.id);

            if (
              orderParts[orderPartsCursor].length === MAX_FUNCTION_ARGUMENTS
            ) {
              orderPartsCursor += 1;
              orderParts.push([
                index + 1 + orderPartsCursor * MAX_FUNCTION_ARGUMENTS,
                0,
              ]);
            }
          }
        };

        apply = () => {
          for (let i = 0; i < orderParts.length; i += 1) {
            order.splice(...orderParts[i]);
          }
        };
      } else if (ownerRecord.public.isOpen) {
        const index = order.indexOf(id);

        let count = 0;

        update = (record) => {
          if (record.isShown) {
            count += 1;
          }

          record.isShown = record.parent
            ? record.parent.public.isOpen && record.parent.isShown
            : true;
        };

        apply = () => {
          order.splice(index + 1, count);
        };
      }
    }

    let currentRecord = ownerRecord;

    while (currentRecord !== null) {
      if (!currentRecord.visited) {
        currentRecord.public.isOpen = currentRecord === ownerRecord
          ? open : currentRecord.public.isOpen;

        subtreeCallback(currentRecord.public, ownerRecord.public);

        if (currentRecord !== ownerRecord) {
          update(currentRecord);
        }

        currentRecord.visited = currentRecord.child !== null;

        currentRecord = currentRecord.child !== null
          ? currentRecord.child
          : currentRecord === ownerRecord
            ? null
            : currentRecord.sibling !== null
              ? currentRecord.sibling
              : currentRecord.parent;
      } else {
        currentRecord.visited = false;
        currentRecord = currentRecord === ownerRecord
          ? null
          : currentRecord.sibling !== null
            ? currentRecord.sibling
            : currentRecord.parent;
      }
    }

    apply();
  }

  return {
    order,
    records,
    updateRequest: {},
  };
};


export const createTreeComputer = creatorOptions =>
  // eslint-disable-next-line
  (props, state, options) => options.refresh ? generateNewTree(creatorOptions, props, state) : updateExistingTree(state, options);

class Tree extends PureComponent {
  static defaultProps = {
    rowComponent: Row,
  };

  static getDerivedStateFromProps(props, state) {
    const { listRef = null, treeWalker } = props;
    const {
      computeTree, list, order, treeWalker: oldTreeWalker,
    } = state;

    return {
      attachRefs: mergeRefs([list, listRef]),
      ...(treeWalker !== oldTreeWalker || !order
        ? computeTree(props, state, { refresh: true })
        : null),
      treeWalker,
    };
  }

  constructor(props) {
    super(props);

    this.getRecordData = this.getRecordData.bind(this);

    this.state = {
      list: createRef(),
      recomputeTree: this.recomputeTree.bind(this),
      setState: this.setState.bind(this),
    };
  }

  getItemData() {
    const { children: component, itemData: treeData } = this.props;

    return {
      component,
      getRecordData: this.getRecordData,
      treeData,
    };
  }

  getRecordData(index) {
    const { order, records } = this.state;

    return records.get(order[index]).public;
  }

  recomputeTree(
    state
  ) {
    return new Promise((resolve) => {
      this.setState(
        prevState => prevState.computeTree(this.props, prevState, {
          opennessState: state,
        }),
        resolve
      );
    });
  }

  scrollTo(scrollOffset) {
    const { list } = this.state;
    if (list.current) {
      list.current.scrollTo(scrollOffset);
    }
  }

  scrollToItem(id, align) {
    const { list, order } = this.state;
    if (list.current) {
      list.current.scrollToItem(order.indexOf(id), align);
    }
  }
}

export default Tree;
