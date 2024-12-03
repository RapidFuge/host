import mongoose, { Schema, Document } from 'mongoose';
import type { shorteners } from '../generators';

export interface User extends Document {
  username: string;
  token: string;
  password: string;
  shortener: shorteners;
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

export default mongoose.model<User>('Users', UserSchema);
