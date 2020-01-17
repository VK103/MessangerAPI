import mongoose from 'mongoose';
import { timestamp } from '../utils';

const types = mongoose.Schema.Types;
const schema = new mongoose.Schema(
  {
    sender_id: {
      type: types.ObjectId,
      required: true
    },
    receiver_id: {
      type: types.ObjectId,
      required: true
    },
    accept: {
      type: Boolean,
      default: false
    },
    date: {
      type: Number,
      default: timestamp
    }
  },
  { versionKey: false }
);

export default mongoose.model('Friends', schema);
