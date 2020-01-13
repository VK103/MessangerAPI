import mongoose from 'mongoose';
import crypto from 'crypto';
import { timestamp } from '../utils';

const User = new mongoose.Schema(
  {
    phone: {
      type: String,
      unique: true
    },
    email: {
      type: String,
      unique: true
    },
    username: {
      type: String,
      unique: true
    },
    first_name: {
      type: String
    },
    last_name: {
      type: String
    },
    picture: {
      url: { type: String },
      width: { type: Number },
      height: { type: Number },
      preview: { type: String }
    },
    hashedPassword: {
      type: String
    },
    salt: {
      type: String
    },
    timestamp: {
      type: Number,
      default: timestamp
    }
  },
  { versionKey: false }
);

User.methods.encryptPassword = function(password) {
  return crypto
    .createHmac('sha1', this.salt)
    .update(password)
    .digest('hex');
};

User.virtual('_uid').get(function() {
  return this.id;
});

User.virtual('password')
  .set(function(password) {
    this._plainPassword = password;
    this.salt = crypto.randomBytes(32).toString('base64');
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._plainPassword;
  });

User.methods.checkPassword = function(password) {
  return this.encryptPassword(password) === this.hashedPassword;
};

export default mongoose.model('User', User);
