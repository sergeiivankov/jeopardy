import morgan from 'morgan';

export default () => {
  if(process.env.NODE_ENV === 'development') {
    return morgan('[:date[iso]] :method :url :status :response-time[3]ms');
  } else {
    return morgan('[:date[iso]] :remote-addr :method :url :status :response-time[3]ms :user-agent');
  }
};