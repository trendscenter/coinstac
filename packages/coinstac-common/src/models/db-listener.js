'use strict';

const EventEmitter = require('events');
const inherits = require('util').inherits;

/**
 * @class DBListener
 * @constructor DBListener
 * @extends EventEmitter
 *
 * {@link http://pouchdb.com/api.html#changes}
 *
 * @param {Pouchy} pouchy
 */
function DBListener(pouchy) {
  EventEmitter.apply(this, arguments); // eslint-disable-line
  this.name = pouchy.name;
  this.changes = pouchy.changes({
    live: true,
    since: 'now',
    include_docs: true,
  })
  .on('change', info => {
    const doc = info.doc;
    /* istanbul ignore if */
    if (info.deleted) {
      this.emit('delete', { doc, name: this.name });
    } else {
      this.emit('change', { doc, name: this.name });
    }
  })
  .on('error', (error) => {
    /* istanbul ignore next */
    this.emit('error', error);
  });
}
inherits(DBListener, EventEmitter);

/**
 * DB document delete
 *
 * @event DBListener#delete
 * @type {object}
 * @property {object} doc - document deleted info
 * @property {string} name - database name
 */

/**
 * DB document change
 *
 * @event DBListener#change
 * @type {object}
 * @property {object} doc - document that initiated the DB change
 * @property {string} name - database name
 */

/**
 * @description destroys DBListener
 * @returns {undefined}
 */
DBListener.prototype.destroy = function () {
  this.removeAllListeners();
  this.changes.removeAllListeners();
  this.changes.cancel();
};

module.exports = DBListener;
