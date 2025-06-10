import mongoose, { Schema, Document } from 'mongoose';

export interface User extends Document {
  username: string;
  token: string;
  password: string;
  shortener: string;
  customEmbedDescription?: string;
  embedImageDirectly?: boolean;
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
  embedImageDirectly: {
    type: Boolean,
    required: false,
    default: false
  },
  customEmbedDescription: {
    type: String,
    required: false
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  }
});

const Model = mongoose.models.Users || mongoose.model<User>('Users', UserSchema);

export default Model;
