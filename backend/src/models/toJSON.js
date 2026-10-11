'use strict';

/**
 * toJSON.js – Shared schema output transform
 *
 * Applied to every model so API responses expose `id` instead of the
 * internal `_id`/`__v` fields, and so `passwordHash` can never be
 * serialised into a response even if it was explicitly selected.
 */

function applySafeJSON(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    },
  });
}

module.exports = applySafeJSON;
