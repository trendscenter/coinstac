const { ObjectID } = require('mongodb');

const database = require('../../database');
const helperFunctions = require('../../auth-helpers');
const {
  eventEmitter,
  USER_CHANGED,
  HEADLESS_CLIENT_CHANGED,
  HEADLESS_CLIENT_DELETED,
} = require('../events');
const { NotAuthorizedError } = require('../errors');

async function _turnUsersIntoOwners(headlessClientId, userIds) {
  const db = database.getDbInstance();

  await db.collection('users').updateMany({
    _id: { $in: userIds },
  }, {
    $set: {
      [`permissions.headlessClients.${headlessClientId}`]: 'owner'
    },
  });

  const users = await db.collection('users').find({ _id: { $in: userIds } }).toArray();

  eventEmitter.emit(USER_CHANGED, users);
}

async function _removeOwnerPermissionFromUsers(headlessClientId, userIds) {
  const db = database.getDbInstance();

  await db.collection('users').updateMany({
    _id: { $in: userIds },
  }, {
    $unset: {
      [`permissions.headlessClients.${headlessClientId}`]: '',
    },
  });

  const users = await db.collection('users').find({ _id: { $in: userIds } }).toArray();

  eventEmitter.emit(USER_CHANGED, users);
}

async function createHeadlessClient(args, credentials) {
  if (!credentials.permissions.roles.admin) {
    throw new NotAuthorizedError('You do not have permission to execute this operation');
  }

  const db = database.getDbInstance();

  const insertResult = await db.collection('headlessClients').insertOne(args);

  const headlessClient = insertResult.ops[0];

  const { owners } = args;

  if (owners) {
    const userIds = Object.keys(owners).map(id => ObjectID(id));

    await _turnUsersIntoOwners(headlessClient._id, userIds);
  }

  eventEmitter.emit(HEADLESS_CLIENT_CHANGED, headlessClient);
  return headlessClient;
}

async function updateHeadlessClient(headlessClientId, data, credentials) {
  if (!credentials.permissions.roles.admin
    && !credentials.permissions.headlessClients[headlessClientId]) {
    throw new NotAuthorizedError('You do not have permission to execute this operation');
  }

  const db = database.getDbInstance();

  const oldHeadlessClient = await db.collection('headlessClients').findOne({ _id: ObjectID(headlessClientId) });

  const oldOwners = oldHeadlessClient.owners || {};
  const newOwners = data.owners || {};

  const addPermissionsUserIds = Object.keys(newOwners)
    .filter(newOwner => !(newOwner in oldOwners))
    .map(id => ObjectID(id));

  const removePermissionsUserIds = Object.keys(oldOwners)
    .filter(oldOwner => !(oldOwner in newOwners))
    .map(id => ObjectID(id));

  await _turnUsersIntoOwners(headlessClientId, addPermissionsUserIds);
  await _removeOwnerPermissionFromUsers(headlessClientId, removePermissionsUserIds);

  const updateResult = await db.collection('headlessClients').findOneAndReplace({ _id: ObjectID(headlessClientId) }, data);

  eventEmitter.emit(HEADLESS_CLIENT_CHANGED, updateResult.value);

  return updateResult.value;
}

async function deleteHeadlessClient(headlessClientId, credentials) {
  if (!credentials.permissions.roles.admin) {
    throw new NotAuthorizedError('You do not have permission to execute this operation');
  }

  const db = database.getDbInstance();

  const deletedResult = await db.collection('headlessClients').findOneAndDelete({ _id: ObjectID(args.consortiumId) });

  const oldHeadlessClient = deletedResult.value;

  eventEmitter.emit(HEADLESS_CLIENT_DELETED, oldHeadlessClient);

  const userIds = Object.keys(oldHeadlessClient.owners);

  await _removeOwnerPermissionFromUsers(headlessClientId, userIds);

  return oldHeadlessClient;
}

async function generateHeadlessClientApiKey(headlessClientId, credentials) {
  if (!credentials.permissions.roles.admin
    && !credentials.permissions.headlessClients[headlessClientId]) {
    throw new NotAuthorizedError('You do not have permission to execute this operation');
  }

  return helperFunctions.hashPassword(`${headlessClientId}-${new Date().toISOString()}`);
}

module.exports = {
  createHeadlessClient,
  updateHeadlessClient,
  deleteHeadlessClient,
  generateHeadlessClientApiKey,
};
