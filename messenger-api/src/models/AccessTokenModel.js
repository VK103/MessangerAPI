import mongoose from 'mongoose';
import { timestamp } from '../utils';

const types = mongoose.Schema.Types;
const schema = new mongoose.Schema(
  {
    user_id: {
      type: types.ObjectId,
      required: true
    },
    token: {
      type: String,
      unique: true,
      required: true
    },
    timestamp: {
      type: Number,
      default: timestamp
    }
  },
  { versionKey: false }
);

export default mongoose.model('AccessToken', schema);
