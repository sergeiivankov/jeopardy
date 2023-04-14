import morgan from 'morgan';

let logger;

if(process.env.NODE_ENV === 'development') {
  logger = morgan('[:date[iso]] :method :url :status :response-time[3]ms');
} else {
  logger = morgan('[:date[iso]] :remote-addr :method :url :status :response-time[3]ms :user-agent');
}

export default logger;