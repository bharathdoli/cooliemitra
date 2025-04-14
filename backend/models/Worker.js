// server/models/Worker.js
import mongoose from 'mongoose';

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skills: { type: [String], default: [] },
  photo: { type: String },
  isPaid: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  workHistory: [
    {
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      breaks: [
        {
          start: { type: Date },
          end: { type: Date },
        },
      ],
    },
  ],
});

export default mongoose.model('Worker', WorkerSchema);