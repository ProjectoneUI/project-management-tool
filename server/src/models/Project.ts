import mongoose, { Document, Schema } from 'mongoose';

// Meilenstein-Schnittstelle
interface IMilestone {
  title: string;
  description: string;
  dueDate: Date;
  status: string;
}

// Risiko-Schnittstelle
interface IRisk {
  title: string;
  description: string;
  impact: string;
  probability: string;
  mitigation: string;
}

// Ressource-Schnittstelle
interface IResource {
  name: string;
  type: string;
  quantity: number;
  cost: number;
}

// Budget-Schnittstelle
interface IBudget {
  planned: number;
  actual: number;
  currency: string;
}

// Projekt-Schnittstelle
export interface IProject extends Document {
  name: string;
  description: string;
  objectives: string[];
  startDate: Date;
  endDate: Date;
  status: string;
  manager: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId[];
  milestones: IMilestone[];
  risks: IRisk[];
  resources: IResource[];
  budget: IBudget;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Projekt-Schema
const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Projektname ist erforderlich'],
      trim: true,
      maxlength: [100, 'Projektname darf maximal 100 Zeichen lang sein']
    },
    description: {
      type: String,
      required: [true, 'Projektbeschreibung ist erforderlich'],
      trim: true
    },
    objectives: [{
      type: String,
      trim: true
    }],
    startDate: {
      type: Date,
      required: [true, 'Startdatum ist erforderlich']
    },
    endDate: {
      type: Date,
      required: [true, 'Enddatum ist erforderlich']
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'OnHold', 'Completed'],
      default: 'Planning'
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Projektmanager ist erforderlich']
    },
    team: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    milestones: [{
      title: {
        type: String,
        required: [true, 'Meilensteintitel ist erforderlich'],
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      dueDate: {
        type: Date,
        required: [true, 'Fälligkeitsdatum ist erforderlich']
      },
      status: {
        type: String,
        enum: ['Pending', 'InProgress', 'Completed', 'Delayed'],
        default: 'Pending'
      }
    }],
    risks: [{
      title: {
        type: String,
        required: [true, 'Risikotitel ist erforderlich'],
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      impact: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
      },
      probability: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
      },
      mitigation: {
        type: String,
        trim: true
      }
    }],
    resources: [{
      name: {
        type: String,
        required: [true, 'Ressourcenname ist erforderlich'],
        trim: true
      },
      type: {
        type: String,
        enum: ['Human', 'Material', 'Financial', 'Other'],
        default: 'Other'
      },
      quantity: {
        type: Number,
        default: 1
      },
      cost: {
        type: Number,
        default: 0
      }
    }],
    budget: {
      planned: {
        type: Number,
        default: 0
      },
      actual: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: 'EUR'
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ersteller ist erforderlich']
    }
  },
  {
    timestamps: true
  }
);

// Validierung für Start- und Enddatum
ProjectSchema.pre<IProject>('save', function(next) {
  if (this.startDate > this.endDate) {
    const error = new Error('Startdatum kann nicht nach dem Enddatum liegen');
    return next(error);
  }
  next();
});

// Virtuelle Eigenschaft für die Projektdauer in Tagen
ProjectSchema.virtual('durationDays').get(function(this: IProject) {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtuelle Eigenschaft für den Projektfortschritt
ProjectSchema.virtual('progress').get(function(this: IProject) {
  if (!this.milestones || this.milestones.length === 0) return 0;
  
  const completedMilestones = this.milestones.filter(
    milestone => milestone.status === 'Completed'
  ).length;
  
  return Math.round((completedMilestones / this.milestones.length) * 100);
});

// Indizes für schnellere Abfragen
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ manager: 1 });
ProjectSchema.index({ 'team': 1 });
ProjectSchema.index({ createdBy: 1 });

const Project = mongoose.model<IProject>('Project', ProjectSchema);

export default Project; 