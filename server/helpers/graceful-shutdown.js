import db from './database.js';

export default servers => {
  let exitCounter = 0;
  const tryExit = code => {
    exitCounter++;
    if(exitCounter < 3) return;
    process.exit(code);
  };

  const gracefulShutdown = (reason, err) => {
    const exitCode = err ? 1 : 0;

    console.log(reason + ' happened');
    if(err) console.error(err);

    servers.appServer.close(() => {
      console.log('Server closed');
      tryExit(exitCode);
    });

    if(servers.redirectServer) {
      servers.redirectServer.close(() => {
        console.log('HTTPS redirect server closed');
        tryExit(exitCode);
      });
    }

    db.close().then(() => {
      console.log('Database connection closed');
      tryExit(exitCode);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('uncaughtException', err => gracefulShutdown('uncaughtException', err));
  process.on('unhandledRejection', err => gracefulShutdown('unhandledRejection', err));
};