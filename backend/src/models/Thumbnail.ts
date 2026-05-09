import { Schema, model, Document, Types } from 'mongoose';

export interface IThumbnail extends Document {
  id: string;          // virtual getter — string form of _id
  job_id: Types.ObjectId;
  style_name: string;
  imagekit_url?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: Date;
}

const ThumbnailSchema = new Schema<IThumbnail>({
  job_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  style_name: { type: String, default: '' },
  imagekit_url: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending' 
  },
  error_message: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Thumbnail = model<IThumbnail>('Thumbnail', ThumbnailSchema);
export default Thumbnail;
