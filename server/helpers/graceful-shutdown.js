export default server => {
  const gracefulShutdown = (reason, err) => {
    console.log(reason + ' happened');
    if(err) console.error(err);

    server.close(() => {
      console.log('Server closed');
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('uncaughtException', err => gracefulShutdown('uncaughtException', err));
  process.on('unhandledRejection', err => gracefulShutdown('unhandledRejection', err));
};