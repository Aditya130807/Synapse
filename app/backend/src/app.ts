import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './features/auth/auth.routes.js';
import chatRouter from './features/chat/chat.routes.js';
import filesRouter from './features/files/files.routes.js';
import searchRouter from './features/search/search.routes.js';
import workspaceMemoryRouter from './features/workspace-memory/workspace-memory.routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Routes
app.use('/', healthRouter);
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);

app.use('/api/chat', chatRouter);
app.use('/api/files', filesRouter);
app.use('/api/knowledge', filesRouter);
app.use('/api/search', searchRouter);
app.use('/api/memory', workspaceMemoryRouter);


// Error handling
app.use(errorHandler);

export default app;
