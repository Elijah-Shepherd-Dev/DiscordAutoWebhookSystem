import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhook extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  rateLimit?: number;
  headers?: Record<string, string>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(v);
      },
      message: 'Invalid Discord webhook URL'
    }
  },
  description: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rateLimit: {
    type: Number,
    default: 60,
    min: 1,
    max: 3600
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Compound index for user and name
WebhookSchema.index({ userId: 1, name: 1 }, { unique: true });

// Text search index
WebhookSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
});

export const Webhook = mongoose.model<IWebhook>('Webhook', WebhookSchema);
