import { createServer } from '../server/index.js';
import serverless from 'serverless-http';

console.log("[API] Initializing api/index entry point...");

const app = createServer();

export default serverless(app);
