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
  duration: {
    type: Number, // In minutes
    required: true,
  }
}, {
  timestamps: true
});

export default mongoose.model('Workshift', WorkshiftSchema);
