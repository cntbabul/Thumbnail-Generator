import { Schema, model, Document } from 'mongoose';

export interface IJob extends Document {
  id: string;          // virtual getter — string form of _id
  prompt: string;
  num_thumbnails: number;
  headshot_url: string;
  provider: 'pollinations' | 'gemini' | 'openai';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
}

const JobSchema = new Schema<IJob>({
  prompt: { type: String, default: '' },
  num_thumbnails: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  headshot_url: { type: String, default: '' },
  provider: {
    type: String,
    enum: ['pollinations', 'gemini', 'openai'],
    default: 'pollinations'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Job = model<IJob>('Job', JobSchema);
export default Job;

