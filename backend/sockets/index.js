/**
 * Sockets Index
 * Export socket server initialization
 */

const { initializeSocketServer, connectedClients, sessionRooms } = require('./signaling');

module.exports = {
  initializeSocketServer,
  connectedClients,
  sessionRooms
};
