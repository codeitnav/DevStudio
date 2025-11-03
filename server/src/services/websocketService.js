const { WebSocketServer } = require('ws');
const { setupWSConnection, docs } = require('y-websocket/bin/utils');

const initWebSocketServer = (server, mdb) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (conn, req) => {
    try {
      const docName = req.url.slice(1).split('?')[0];

      if (!docName) {
        ws.close(1008, 'Invalid document name');
        return;
      }
      
      setupWSConnection(conn, req, {
        docName,
        gc: true,
        doc: docs.get(docName, doc => {
          console.log(`[Yjs] Binding document "${docName}" to MongoDB persistence.`);
          mdb.bindState(doc.name, doc);
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