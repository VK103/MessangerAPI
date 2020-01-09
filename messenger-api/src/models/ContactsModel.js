import mongoose from 'mongoose';

const types = mongoose.Schema.Types;
const schema = new mongoose.Schema(
  {
    user_id: {
      type: types.ObjectId
    },
    phoneNumbers: [String]
  },
  { versionKey: false }
);

export default mongoose.model('Contacts', schema);
