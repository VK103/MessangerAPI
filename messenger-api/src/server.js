import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { errorsMiddleware, outMiddleware } from './utils';
import config from './config';
import Notification from './utils/Notification';

import AuthMethods from './methods/AuthMethods';
import UserMethods from './methods/UserMethods';
import AccountMethods from './methods/AccountMethods';
import MessagesMethods from './methods/MessagesMethods';
import ContactsMethods from './methods/ContactsMethods';

const notification = new Notification(config.redis);
const app = express();

app.use(bodyParser.json());
app.use(morgan(':date[clf] :remote-addr, :referrer, :url :response-time ms'));

app.use(outMiddleware);
app.use((req, res, next) => {
  req.notification = notification;
  next();
});

// Methods
app.use(AuthMethods);
app.use(UserMethods);
app.use(AccountMethods);
app.use(MessagesMethods);
app.use(ContactsMethods);

app.use(errorsMiddleware);

app.listen(config.port, () =>
  console.log(`App listening on port ${config.port}!`)
);


mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log('Database connection successful');
  })
  .catch(err => {
    console.error('Database connection error', err);
  });

notification.connectSocketServer();
