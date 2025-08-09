import { Schema, model } from 'mongoose';
import { IUser, IUserModel } from '../types';

const userSchema = new Schema<IUser>({
  geoguessr_user_id: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    trim: true
  },
  username: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  last_sync: { 
    type: Date,
    default: null
  },
  
  // Authentication cookies
  geoguessr_cookies: {
    session_cookie: { 
      type: String, 
      required: true
    },
    expires_at: { 
      type: Date, 
      required: true 
    }
  }
}, { 
  timestamps: true,
  collection: 'users'
});

// Indexes for performance
userSchema.index({ geoguessr_user_id: 1 }, { unique: true });
userSchema.index({ username: 1 });
userSchema.index({ last_sync: 1 });
userSchema.index({ 'geoguessr_cookies.expires_at': 1 });

// Instance methods
userSchema.methods.isSessionValid = function(): boolean {
  return this.geoguessr_cookies.expires_at > new Date();
};

userSchema.methods.updateLastSync = function(): Promise<IUser> {
  this.last_sync = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByGeoGuessrId = function(geoguessrUserId: string) {
  return this.findOne({ geoguessr_user_id: geoguessrUserId });
};

userSchema.statics.findWithValidSession = function() {
  return this.find({
    'geoguessr_cookies.expires_at': { $gt: new Date() }
  });
};

// Virtual for session status
userSchema.virtual('hasValidSession').get(function() {
  return this.geoguessr_cookies.expires_at > new Date();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive data from JSON output
    delete ret.geoguessr_cookies;
    delete ret.__v;
    return ret;
  }
});

export const User = model<IUser, IUserModel>('User', userSchema);
