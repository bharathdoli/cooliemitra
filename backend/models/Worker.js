// server/models/Worker.js
import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
  yearsOfExperience: { type: Number, default: 0 },
  certifications: [{ type: String }],
  specialties: [{ type: String }]
});

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skills: [SkillSchema],
  photo: { type: String },
  isPaid: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  workHistory: [
    {
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      taskType: { type: String },
      taskDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      performanceRating: { type: Number, min: 1, max: 5 },
      breaks: [
        {
          start: { type: Date },
          end: { type: Date },
        },
      ],
    },
  ],
  preferredTaskTypes: [{ type: String }],
  availability: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: true }
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  }
});

export default mongoose.model('Worker', WorkerSchema);