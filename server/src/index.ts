import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`VIGIL Backend Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`CORS origin: ${config.corsOrigin}`);
});

export default server;
