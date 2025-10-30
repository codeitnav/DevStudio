// server/src/services/websocketService.js

const { WebSocketServer } = require('ws');
// --- [FIX 1] Import 'docs' to manage Yjs documents on the server ---
const { setupWSConnection, docs } = require('y-websocket/bin/utils');

/**
 * Initializes the WebSocket server and correctly configures Yjs persistence.
 * @param {import('http').Server} server The HTTP server instance.
 * @param {import('y-mongodb-provider').MongodbPersistence} mdb The MongoDB persistence instance.
 */
const initWebSocketServer = (server, mdb) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (conn, req) => {
    try {
      const docName = req.url.slice(1).split('?')[0];

      if (!docName) {
        ws.close(1008, 'Invalid document name');
        return;
      }
      
      // --- [FIX 2] Use the more explicit 'doc' option for persistence ---
      setupWSConnection(conn, req, {
        docName,
        gc: true,
        // This 'doc' property is the key to the solution.
        // It's a function that gets or creates a document by its name.
        doc: docs.get(docName, doc => {
          // Inside this callback, we explicitly tell our MongoDB provider (mdb)
          // to start tracking and saving this specific document.
          console.log(`[Yjs] Binding document "${docName}" to MongoDB persistence.`);
          mdb.bindState(doc.name, doc);
          
          // It's also good practice to clean up the database connection
          // when the document is no longer in memory on the server.
          doc.on('destroy', () => {
            console.log(`[Yjs] Closing persistence for document "${docName}".`);
            mdb.closeDoc(doc.name);
          });
        })
      });
      console.log(`WS: Connection established for doc: ${docName}`);
    } catch (err) {
      console.error('WS: Error during connection setup:', err);
      conn.close(1011, 'Internal Server Error');
    }
  });

  console.log('WebSocket Server initialized with robust persistence.');
};

module.exports = { initWebSocketServer };