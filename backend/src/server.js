import 'dotenv/config';
import app from "./app.js";
import { createServer } from 'node:http';
import { initSocketServer } from './sockets/index.js';

const PORT = process.env.PORT || 8080;

const server = createServer(app);

// Initialize Socket.IO
initSocketServer(server);

server.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server is running at http://localhost:${PORT}/`);
});