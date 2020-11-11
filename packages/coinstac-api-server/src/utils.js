function transformItem(item) {
  if (!item) {
    return null;
  }

  if ('id' in item) {
    return item;
  }

  const copy = { ...item, id: item._id.toString() };
  delete copy._id;
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
