import SocketEmitter from 'socket.io-emitter';
import Expo from 'expo-server-sdk';
import Redis from 'redis';
import DeviceTokenModel from '../models/DeviceTokenModel';

const expo = new Expo();

export default class Notification {
  constructor(redisConfig) {
    this.redisConfig = redisConfig;
    this.socketEmitter = null;
  }

  connectSocketServer() {
    try {
      const redisClient = Redis.createClient(this.redisConfig);
      this.socketEmitter = SocketEmitter(redisClient);
      console.log(`connectSocketServer - running`);
    } catch (error) {
      console.log('Error connectSocketServer', error);
    }
  }

  to(member_id, skipPushNotification) {
    return {
      emit: (event, payload) => {
        this.emit(member_id, event, payload, skipPushNotification);
      }
    };
  }

  emit(member_id, event, payload) {
    if (!this.socketEmitter) return;

    this.socketEmitter.to(member_id).emit(event, payload);
  }

  getSocketEmitter() {
    return this.socketEmitter;
  }

  async sendPushNotification({ recipient_id, sender, message }) {
    const title = `${sender.first_name} ${sender.last_name}`;
    const tokens = await DeviceTokenModel.find({
      user_id: recipient_id
    });

    if (tokens.length < 1) {
      return;
    }

    let messages = [];
    for (let pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken.token)) {
        console.error(
          `Push token ${pushToken.token} is not a valid Expo push token`
        );
        continue;
      }

      messages.push({
        ttl: 5,
        to: pushToken.token,
        sound: 'default',
        body: getBodyNotification(message),
        title,
        data: { message, sender }
      });
    }

    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async sendRequestPushNotification({ recipient_id, sender, message, title }) {
    //const title = `${sender.first_name} ${sender.last_name}`;
    const tokens = await DeviceTokenModel.find({
      user_id: recipient_id
    });

    if (tokens.length < 1) {
      return;
    }

    let messages = [];
    for (let pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken.token)) {
        console.error(
          `Push token ${pushToken.token} is not a valid Expo push token`
        );
        continue;
      }

      messages.push({
        //ttl: 5,
        to: pushToken.token,
        sound: 'default',
        body: message,
        title,
        data: { message, sender, type: 'request' }
      });
    }

    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

function getBodyNotification(message) {
  const attachment = message.attachment;

  if (message.text !== '') {
    return message.text;
  }

  if (attachment.photo.url) {
    return 'photo';
  }

  // Other attachments...

  return '';
}
