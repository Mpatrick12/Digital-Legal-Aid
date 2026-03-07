import mongoose from 'mongoose'

const notarySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  firm: { type: String, trim: true },                // Office / cabinet name
  province: { type: String, required: true },
  district: { type: String, required: true },
  address: { type: String },                          // Street / building
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  specializations: [{ type: String }],                // e.g. ['Property', 'Succession', 'Corporate']
  languages: [{ type: String }],                      // e.g. ['Kinyarwanda', 'English', 'French']
  workingHours: { type: String, default: 'Mon–Fri 8:00–17:00' },
  fees: { type: String },                             // Rough fee range description
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  verified: { type: Boolean, default: true },         // Whether listing has been confirmed
  active: { type: Boolean, default: true }
}, { timestamps: true })

notarySchema.index({ province: 1, district: 1 })
notarySchema.index({ specializations: 1 })
notarySchema.index({ name: 'text', firm: 'text', district: 'text' })

export default mongoose.model('Notary', notarySchema)
