import mongoose, { Schema, Document } from 'mongoose';

export interface Link extends Document {
  created: Date;
  id: string;
  owner: string;
  url: string;
}

const LinkSchema: Schema<Link> = new Schema({
  created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  id: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
});

const Model = mongoose.models.Urls || mongoose.model<Link>('Urls', LinkSchema);

export default Model;
