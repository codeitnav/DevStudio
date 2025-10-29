const Y = require('yjs');
const awarenessProtocol = require('y-protocols/awareness.js');

// Enables user presence, live cursors, and collaborative editing.
const docs = new Map();

const getDocWithAwareness = (roomId) => {
  let entry = docs.get(roomId);

  if (!entry) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    entry = { doc, awareness };
    docs.set(roomId, entry);
    console.log(`🆕 Created new Y.Doc for room: ${roomId}`);
  }

  return entry;
};

module.exports = { getDocWithAwareness };