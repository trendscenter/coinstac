function transformItem(item) {
  if (!item) {
    return null;
  }

  if (typeof item !== 'object') {
    return item;
  }

  if (!item._id) {
    return item;
  }

  const copy = { ...item };
  if (item._id) {
    copy.id = item._id.toString();
  }

  Object.keys(copy).forEach((key) => {
    if (typeof copy[key] === 'object') {
      copy[key] = transformItem(copy[key]);
    }

    if (Array.isArray(copy[key])) {
      copy[key] = copy[key].map(a => transformItem(a));
    }
  });

  return copy;
}

function transformToClient(obj) {
  return Array.isArray(obj)
    ? obj.map(item => transformItem(item))
    : transformItem(obj);
}

module.exports = {
  transformToClient,
};
