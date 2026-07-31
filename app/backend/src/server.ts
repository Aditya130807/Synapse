import app from './app.js';
import { env } from './config/env.js';

const { PORT, NODE_ENV } = env;

app.listen(PORT, () => {
  console.log(`[Synapse API] Server running on port ${PORT} (${NODE_ENV})`);
});
