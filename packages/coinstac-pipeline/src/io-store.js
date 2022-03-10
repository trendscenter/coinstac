
const backingStore = {};

const init = (storeKey) => {
  const keys = Array.isArray(storeKey) ? storeKey : [storeKey];
  return keys.reduce((obj, storeKey) => {
    if (!backingStore[storeKey]) backingStore[storeKey] = {};
    const store = backingStore[storeKey];


    const put = (group, id, key) => {
      if (store[group]) {
        store[group][id] = key;
      } else {
        store[group] = { [id]: key };
      }
    };

    const get = (group, id) => {
      return store[group] ? store[group][id] : undefined;
    };

    const getGroup = (group) => {
      if (!store[group]) return undefined;
      return Object.keys(store[group]).reduce((filtered, id) => {
        if (store[group][id]) filtered[id] = store[group][id];
        return filtered;
      }, {});
    };

    const group = (group) => {
      if (store[group]) {
        return Object.keys(store[group]).reduce((array, member) => {
          if (store[group][member]) array.push(member);
          return array;
        }, []);
      }
      return [];
    };

    const has = (group, id) => {
      if (store[group]) {
        return store[group][id] !== undefined;
      }
      return false;
    };

    const remove = (group, id) => {
      if (store[group]) store[group][id] = undefined;
    };

    const removeGroup = (group) => {
      store[group] = undefined;
    };

    const getAndRemove = (group, id) => {
      const i = get(group, id);
      remove(group, id);
      return i;
    };

    const getAndRemoveGroup = (group) => {
      const g = getGroup(group);
      removeGroup(group);
      return g;
    };

    obj[storeKey] = {
      put,
      get,
      getAndRemove,
      getGroup,
      getAndRemoveGroup,
      group,
      has,
      remove,
      removeGroup,
    };
    return obj;
  }, {});
};

module.exports = {
  init,
};
