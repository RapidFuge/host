import mongoose, { Schema, Document } from 'mongoose';

export interface UpTokens extends Document {
    created: Date;
    expires: Date;
    token: string;
}

const UpTokensSchema: Schema<UpTokens> = new Schema({
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    expires: {
        type: Date,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
});

const Model = mongoose.models.UpTokens || mongoose.model<UpTokens>('UpTokens', UpTokensSchema);

export default Model;
