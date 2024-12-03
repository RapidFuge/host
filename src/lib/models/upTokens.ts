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

export default mongoose.model<UpTokens>('UpTokens', UpTokensSchema);
