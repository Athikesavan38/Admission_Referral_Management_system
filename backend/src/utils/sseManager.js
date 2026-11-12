'use strict';

/**
 * SSE Manager — maintains a map of userId → SSE response objects.
 * Also tracks userId → role for targeted broadcasts.
 */
const clients    = new Map(); // userId → res
const userRoleMap = new Map(); // userId → role

function addClient(userId, role, res) {
  clients.set(userId, res);
  userRoleMap.set(userId, role);
}

function removeClient(userId) {
  clients.delete(userId);
  userRoleMap.delete(userId);
}

function sendToUser(userId, event) {
  const res = clients.get(String(userId));
  if (res) {
    try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* client gone */ }
  }
}

function sendToAdmins(event) {
  for (const [userId, role] of userRoleMap.entries()) {
    if (role === 'admin') sendToUser(userId, event);
  }
}

function broadcast(event) {
  for (const res of clients.values()) {
    try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* skip */ }
  }
}

module.exports = { addClient, removeClient, sendToUser, sendToAdmins, broadcast, userRoleMap };
