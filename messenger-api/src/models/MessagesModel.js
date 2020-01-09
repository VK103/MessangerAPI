import mongoose from 'mongoose';
import { timestamp } from '../utils';

const types = mongoose.Schema.Types;
const schema = new mongoose.Schema(
  {
    dialog_id: {
      type: types.ObjectId,
      required: true
    },
    recipient_id: {
      type: types.ObjectId,
      required: true
    },
    sender_id: {
      type: types.ObjectId,
      required: true
    },
    text: {
      type: String
    },
    attachment: {
      photo: {
        url: { type: String },
        width: { type: Number },
        height: { type: Number },
        preview: { type: String }
      }
    },
    unread: {
      type: Number,
      default: 1,
      required: true
    },
    date: {
      type: Number,
      default: timestamp
    }
  },
  { versionKey: false }
);

export default mongoose.model('Messgaes', schema);
