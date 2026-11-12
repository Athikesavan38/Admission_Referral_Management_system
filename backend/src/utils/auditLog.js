'use strict';

/**
 * Creates a new audit entry object.
 * Never mutates existing entries — always returns a fresh plain object.
 *
 * @param {{ action: string, performedBy: ObjectId|string, previousStatus?: string, newStatus?: string }} param0
 * @returns {object} audit entry
 */
const createAuditEntry = ({ action, performedBy, previousStatus, newStatus }) => ({
  action,
  performedBy,
  previousStatus,
  newStatus,
  timestamp: new Date(),
});

module.exports = { createAuditEntry };
