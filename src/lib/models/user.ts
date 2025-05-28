import mongoose, { Schema, Document } from 'mongoose';

export interface User extends Document {
  username: string;
  token: string;
  password: string;
  shortener: string;
  isAdmin: boolean;
}

const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  shortener: {
    type: String,
    default: 'random',
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  }
});

const Model = mongoose.models.Users || mongoose.model<User>('Users', UserSchema);

export default Model;
