import mongoose, { Schema, Document } from 'mongoose';

export interface PasteTag extends Document {
  created: Date;
  tag: string;
  pasteId: string;  // The ID of the paste this tag points to
  owner: string;
}

const PasteTagSchema: Schema<PasteTag> = new Schema({
  created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  tag: {
    type: String,
    required: true,
    unique: true,
  },
  pasteId: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
});

const Model = mongoose.models.PasteTags || mongoose.model<PasteTag>('PasteTags', PasteTagSchema);

export default Model;