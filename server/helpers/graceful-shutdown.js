export default servers => {
  const gracefulShutdown = (reason, err) => {
    console.log(reason + ' happened');
    if(err) console.error(err);

    servers.appServer.close(() => {
      console.log('Server closed');
    });

    if(servers.redirectServer) {
      servers.redirectServer.close(() => {
        console.log('HTTPS redirect server closed');
      });
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('uncaughtException', err => gracefulShutdown('uncaughtException', err));
  process.on('unhandledRejection', err => gracefulShutdown('unhandledRejection', err));
};