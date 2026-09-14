const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const rideRequestSchema = new mongoose.Schema(
  {
    passengerId: { type: String, required: true },
    driverId: { type: String, default: null },
    status: {
      type: String,
      enum: ['SEARCHING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'],
      default: 'SEARCHING',
    },
    pickupLocation: { type: locationSchema, required: true },
    dropoffLocation: { type: locationSchema, required: true },
    fare: { type: Number, required: true },
  },
  { timestamps: true },
);

rideRequestSchema.index({ pickupLocation: '2dsphere' });

module.exports = mongoose.model('RideRequest', rideRequestSchema);
