import { Schema, model, Types } from 'mongoose';
import { IRound } from '../types';

const roundSchema = new Schema<IRound>({
  game_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true, 
    index: true 
  },
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  round_number: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  
  // Actual location
  actual_lat: { 
    type: Number, 
    required: true, 
    min: -90, 
    max: 90 
  },
  actual_lng: { 
    type: Number, 
    required: true, 
    min: -180, 
    max: 180 
  },
  actual_country_code: { 
    type: String, 
    required: true, 
    index: true,
    uppercase: true,
    trim: true,
    maxlength: 5
  },
  
  // Player guess
  guess_lat: { 
    type: Number, 
    required: true, 
    min: -90, 
    max: 90 
  },
  guess_lng: { 
    type: Number, 
    required: true, 
    min: -180, 
    max: 180 
  },
  
  // Performance
  score: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 5000 
  },
  distance_meters: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  distance_km: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  time_taken: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  
  // Calculated/derived
  is_correct_country: { 
    type: Boolean, 
    required: true, 
    index: true 
  },
  country_guess: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  country_actual: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Additional context
  pano_id: { 
    type: String,
    trim: true
  },
  heading: { 
    type: Number,
    min: 0,
    max: 360
  },
  pitch: { 
    type: Number,
    min: -90,
    max: 90
  },
  zoom: { 
    type: Number,
    min: 0
  }
}, { 
  timestamps: true,
  collection: 'rounds'
});

// Compound indexes for efficient queries
roundSchema.index({ game_id: 1, round_number: 1 });
roundSchema.index({ user_id: 1, actual_country_code: 1 });
roundSchema.index({ user_id: 1, is_correct_country: 1 });
roundSchema.index({ user_id: 1, score: -1 });

// Regular indexes for location fields (geospatial queries can use compound indexes)
roundSchema.index({ actual_lat: 1, actual_lng: 1 });
roundSchema.index({ guess_lat: 1, guess_lng: 1 });

// Instance methods
roundSchema.methods.isPerfectScore = function(): boolean {
  return this.score === 5000;
};

roundSchema.methods.getAccuracyRating = function(): string {
  if (this.score >= 4500) return 'Excellent';
  if (this.score >= 3500) return 'Good';
  if (this.score >= 2000) return 'Average';
  if (this.score >= 1000) return 'Poor';
  return 'Very Poor';
};

roundSchema.methods.getDistanceRating = function(): string {
  if (this.distance_km <= 1) return 'Pinpoint';
  if (this.distance_km <= 10) return 'Very Close';
  if (this.distance_km <= 100) return 'Close';
  if (this.distance_km <= 1000) return 'Reasonable';
  return 'Far';
};

// Static methods
roundSchema.statics.findByUser = function(userId: Types.ObjectId) {
  return this.find({ user_id: userId }).sort({ createdAt: -1 });
};

roundSchema.statics.findByGame = function(gameId: Types.ObjectId) {
  return this.find({ game_id: gameId }).sort({ round_number: 1 });
};

roundSchema.statics.findByCountry = function(userId: Types.ObjectId, countryCode: string) {
  return this.find({ 
    user_id: userId, 
    actual_country_code: countryCode.toUpperCase() 
  }).sort({ createdAt: -1 });
};

roundSchema.statics.findPerfectScores = function(userId: Types.ObjectId) {
  return this.find({ 
    user_id: userId, 
    score: 5000 
  }).sort({ createdAt: -1 });
};

roundSchema.statics.findCorrectCountryGuesses = function(userId: Types.ObjectId) {
  return this.find({ 
    user_id: userId, 
    is_correct_country: true 
  }).sort({ createdAt: -1 });
};

// Aggregation helpers
roundSchema.statics.getCountryStats = function(userId: Types.ObjectId) {
  return this.aggregate([
    { $match: { user_id: userId } },
    { 
      $group: {
        _id: '$actual_country_code',
        total_rounds: { $sum: 1 },
        correct_guesses: { 
          $sum: { $cond: ['$is_correct_country', 1, 0] } 
        },
        avg_score: { $avg: '$score' },
        avg_distance_km: { $avg: '$distance_km' },
        best_score: { $max: '$score' },
        worst_score: { $min: '$score' },
        total_distance_km: { $sum: '$distance_km' }
      }
    },
    {
      $addFields: {
        accuracy_percentage: { 
          $multiply: [
            { $divide: ['$correct_guesses', '$total_rounds'] }, 
            100
          ] 
        }
      }
    },
    { $sort: { accuracy_percentage: -1 } }
  ]);
};

// Virtual for score efficiency (score per second)
roundSchema.virtual('scoreEfficiency').get(function() {
  return this.time_taken > 0 ? this.score / this.time_taken : 0;
});

// Virtual for distance score ratio
roundSchema.virtual('distanceScoreRatio').get(function() {
  return this.distance_km > 0 ? this.score / this.distance_km : this.score;
});

// Ensure virtual fields are serialized
roundSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

export const Round = model<IRound>('Round', roundSchema);
