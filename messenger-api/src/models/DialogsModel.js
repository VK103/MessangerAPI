import mongoose from 'mongoose';
import { timestamp } from '../utils';

const types = mongoose.Schema.Types;
const schema = new mongoose.Schema(
  {
    members: [types.ObjectId],
    timestamp: {
      type: Number,
      default: timestamp
    }
  },
  { versionKey: false }
);

export default mongoose.model('Dialogs', schema);
