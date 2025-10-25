const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const url = require('url');
// Removed JWT, User, and Room imports as they are no longer needed for auth

/**
 * Initializes the WebSocket server and attaches all logic.
 * This version has ALL authentication removed to prevent race conditions.
 * It will accept a connection for any document name.
 * @param {import('http').Server} httpServer - The HTTP server to attach to.
 * @param {import('y-mongodb').MongoDbPersistence} mdb - The Yjs persistence instance.
 */
const initWebSocketServer = (httpServer, mdb) => {
  // Revert to a simpler WSS setup without the manual 'upgrade' handler
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', async (ws, request) => {
    console.log('WS: New connection attempt...');
    
    try {
      // We no longer authorize. We just get the document name.
      const docName = request.url.slice(1).split('?')[0];

      if (!docName) {
        console.warn('WS: Connection attempt with no docName. Closing.');
        ws.close(1008, 'Invalid document name');
        return;
      }

      setupWSConnection(ws, request, {
        docName: docName, // Use the docName from the URL pathname
        gc: true,
        persistence: mdb,
      });

      console.log(`WS: Connection established for doc: ${docName}`);

      // Awareness will be set by clients. The server is no longer
      // responsible for setting the initial awareness state with user data.
      
      ws.on('close', () => {
        console.log(`WS: Connection closed for doc: ${docName}`);
      });

    } catch (err) {
      console.error('WS: Error during connection setup:', err);
      ws.close(1011, 'Internal Server Error');
    }
  });

  console.log('WebSocket Server initialized (public, no auth).');
};

module.exports = { initWebSocketServer };

