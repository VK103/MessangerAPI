import mongoose from 'mongoose';

const types = mongoose.Schema.Types;
const schema = new mongoose.Schema(
  {
    user_id: {
      type: types.ObjectId,
      required: true
    },
    token: {
      type: String,
      required: true
    },
    device_platform: {
      type: String
    },
    device_year: {
      type: String
    },
    system_version: {
      type: String
    }
  },
  { versionKey: false }
);

schema.index({ user_id: 1 });

export default mongoose.model('DeviceToken', schema);
