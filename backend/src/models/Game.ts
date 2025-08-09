import { Schema, model, Types } from 'mongoose';
import { IGame } from '../types';

const gameSchema = new Schema<IGame>({
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  game_token: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    trim: true
  },
  
  // From feed API
  game_mode: { 
    type: String, 
    required: true, 
    index: true,
    trim: true
  },
  map_name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  map_id: { 
    type: String, 
    required: true, 
    index: true,
    trim: true
  },
  total_score: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 25000 
  },
  played_at: { 
    type: Date, 
    required: true, 
    index: true 
  },
  
  // Game metadata (from detailed game API)
  game_state: { 
    type: String, 
    enum: ['finished', 'in_progress', 'abandoned'], 
    default: 'finished' 
  },
  round_count: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 5 
  },
  time_limit: { 
    type: Number, 
    min: 0, 
    default: 0 
  },
  forbid_moving: { 
    type: Boolean, 
    default: false 
  },
  forbid_zooming: { 
    type: Boolean, 
    default: false 
  },
  forbid_rotating: { 
    type: Boolean, 
    default: false 
  },
  panorama_provider: { 
    type: Number, 
    default: 1 
  },
  map_bounds: {
    min: {
      lat: { 
        type: Number, 
        min: -90, 
        max: 90 
      },
      lng: { 
        type: Number, 
        min: -180, 
        max: 180 
      }
    },
    max: {
      lat: { 
        type: Number, 
        min: -90, 
        max: 90 
      },
      lng: { 
        type: Number, 
        min: -180, 
        max: 180 
      }
    }
  },
  
  details_fetched: { 
    type: Boolean, 
    default: false, 
    index: true 
  }
}, { 
  timestamps: true,
  collection: 'games'
});

// Compound indexes for efficient queries
gameSchema.index({ user_id: 1, played_at: -1 });
gameSchema.index({ user_id: 1, game_mode: 1 });
gameSchema.index({ user_id: 1, details_fetched: 1 });
gameSchema.index({ user_id: 1, forbid_moving: 1 });
gameSchema.index({ map_id: 1 });
gameSchema.index({ panorama_provider: 1 });

// Instance methods
gameSchema.methods.markDetailsAsFetched = function(): Promise<IGame> {
  this.details_fetched = true;
  return this.save();
};

gameSchema.methods.isNMPZ = function(): boolean {
  return this.forbid_moving && this.forbid_zooming;
};

gameSchema.methods.isTimeLimited = function(): boolean {
  return this.time_limit > 0;
};

// Static methods
gameSchema.statics.findByUser = function(userId: Types.ObjectId) {
  return this.find({ user_id: userId }).sort({ played_at: -1 });
};

gameSchema.statics.findByUserAndMode = function(userId: Types.ObjectId, gameMode: string) {
  return this.find({ user_id: userId, game_mode: gameMode }).sort({ played_at: -1 });
};

gameSchema.statics.findPendingDetailsFetch = function(userId?: Types.ObjectId) {
  const query = { details_fetched: false };
  if (userId) {
    Object.assign(query, { user_id: userId });
  }
  return this.find(query).sort({ played_at: -1 });
};

gameSchema.statics.findByDateRange = function(
  userId: Types.ObjectId, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    user_id: userId,
    played_at: { $gte: startDate, $lte: endDate }
  }).sort({ played_at: -1 });
};

// Virtual for game type classification
gameSchema.virtual('gameType').get(function() {
  if (this.forbid_moving && this.forbid_zooming) return 'NMPZ';
  if (this.forbid_moving) return 'No Moving';
  if (this.time_limit > 0) return 'Timed';
  return 'Standard';
});

// Virtual for map bounds area (for difficulty assessment)
gameSchema.virtual('mapBoundsArea').get(function() {
  if (!this.map_bounds?.min || !this.map_bounds?.max) return 0;
  const latDiff = this.map_bounds.max.lat - this.map_bounds.min.lat;
  const lngDiff = this.map_bounds.max.lng - this.map_bounds.min.lng;
  return latDiff * lngDiff;
});

// Ensure virtual fields are serialized
gameSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

export const Game = model<IGame>('Game', gameSchema);
