import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{
    name: { type: String, required: true },
    minimumLevel: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
    requiredCertifications: [{ type: String }]
  }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  estimatedDuration: { type: Number, required: true }, // in hours
  location: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  deadline: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add validation for required fields
TaskSchema.pre('validate', function(next) {
  if (!this.title || !this.description || !this.requiredSkills || !this.difficulty || 
      !this.estimatedDuration || !this.location || !this.deadline) {
    next(new Error('Missing required fields'));
  }
  next();
});

export default mongoose.model('Task', TaskSchema); 