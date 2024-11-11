import mongoose from 'mongoose';
import { validate as uuidValidate, v4 as uuidv4 } from 'uuid';

const WorkshiftSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
    validate: {
      validator: uuidValidate,
      message: props => `${props.value} not a valid UUID!`
    }
  },
  doctorId: {
    type: String,
    required: true,
    validate: {
      validator: uuidValidate,
      message: props => `${props.value} not a valid UUID!`
    }
  },
  clinicId: {
    type: String,
    required: true,
    validate: {
      validator: uuidValidate,
      message: props => `${props.value} not a valid UUID!`
    }
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  duration: {
    type: Number, // In minutes
    required: true,
    default: 480, // 8 hours
  }
}, {
  timestamps: true
});

WorkshiftSchema.pre('save', function (next) {
  this.endDate = new Date(this.startDate);
  this.endDate.setMinutes(this.endDate.getMinutes() + this.duration);
  next();
});

WorkshiftSchema.pre('findOneAndUpdate', function (next) {
  if (this._update.startDate && this._update.duration) {
    this._update.endDate = new Date(this._update.startDate);
    this._update.endDate.setMinutes(this._update.endDate.getMinutes() + this._update.duration);
  }
  next();
});

WorkshiftSchema.pre('insertMany', function (next, docs) {
  docs.forEach(doc => {
    doc.endDate = new Date(doc.startDate);
    doc.endDate.setMinutes(doc.endDate.getMinutes() + doc.duration);
  });
  next();
});

export default mongoose.model('Workshift', WorkshiftSchema);
