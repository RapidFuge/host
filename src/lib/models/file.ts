import mongoose, { Schema, Document } from 'mongoose';

export interface File extends Document {
  created: Date;
  extension?: string;
  id: string;
  fileName: string;
  videoThumbnail?: string;
  owner: string;
  isPrivate: boolean;
}

const FileSchema: Schema<File> = new Schema({
  created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  extension: {
    type: String,
    required: false,
  },
  id: {
    type: String,
    required: true,
    unique: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  videoThumbnail: {
    type: String,
    required: false
  },
  owner: {
    type: String,
    required: true,
  },
  isPrivate: {
    type: Boolean,
    required: true,
    default: false
  }
});

export default mongoose.model<File>('Files', FileSchema);
