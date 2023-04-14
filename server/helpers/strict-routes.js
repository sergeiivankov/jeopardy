const trailingSlashRegExp = /\/+$/;

export default (req, res, next) => {
  let needFixPath = false;

  if(req.path.toLowerCase() !== req.path) needFixPath = true;
  if(req.path !== '/' && req.path.endsWith('/')) needFixPath = true;

  if(needFixPath) {
    const url = new URL(req.originalUrl, 'http://localhost');
    url.pathname = url.pathname.toLowerCase().replace(trailingSlashRegExp, '');
    res.redirect(301, url.pathname + url.search);
  } else {
    next();
  }
};