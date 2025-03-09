import mongoose, { Document, Schema } from 'mongoose';

// Anhang-Schnittstelle
interface IAttachment {
  fileName: string;
  filePath: string;
  fileType: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

// Kommentar-Schnittstelle
interface IComment {
  content: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
}

// Aufgaben-Schnittstelle
export interface ITask extends Document {
  title: string;
  description: string;
  project: mongoose.Types.ObjectId;
  board: mongoose.Types.ObjectId;
  columnId: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  status: string;
  priority: string;
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  attachments: IAttachment[];
  comments: IComment[];
  dependencies: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Aufgaben-Schema
const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Aufgabentitel ist erforderlich'],
      trim: true,
      maxlength: [200, 'Aufgabentitel darf maximal 200 Zeichen lang sein']
    },
    description: {
      type: String,
      trim: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Projekt ist erforderlich']
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ist erforderlich']
    },
    columnId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Spalten-ID ist erforderlich']
    },
    assignees: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: ['Todo', 'InProgress', 'Review', 'Done'],
      default: 'Todo'
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    dueDate: {
      type: Date
    },
    estimatedHours: {
      type: Number,
      default: 0
    },
    actualHours: {
      type: Number,
      default: 0
    },
    tags: [{
      type: String,
      trim: true
    }],
    attachments: [{
      fileName: {
        type: String,
        required: true
      },
      filePath: {
        type: String,
        required: true
      },
      fileType: {
        type: String,
        required: true
      },
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      content: {
        type: String,
        required: true,
        trim: true
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    dependencies: [{
      type: Schema.Types.ObjectId,
      ref: 'Task'
    }],
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

// Methode zum Hinzufügen eines Kommentars
TaskSchema.methods.addComment = async function(
  content: string,
  authorId: mongoose.Types.ObjectId
) {
  this.comments.push({
    content,
    author: authorId,
    createdAt: new Date()
  });
  
  return this.save();
};

// Methode zum Hinzufügen eines Anhangs
TaskSchema.methods.addAttachment = async function(
  fileName: string,
  filePath: string,
  fileType: string,
  uploadedBy: mongoose.Types.ObjectId
) {
  this.attachments.push({
    fileName,
    filePath,
    fileType,
    uploadedBy,
    uploadedAt: new Date()
  });
  
  return this.save();
};

// Methode zum Aktualisieren des Status
TaskSchema.methods.updateStatus = async function(status: string) {
  this.status = status;
  return this.save();
};

// Methode zum Aktualisieren der Spalte
TaskSchema.methods.updateColumn = async function(columnId: mongoose.Types.ObjectId) {
  this.columnId = columnId;
  return this.save();
};

// Indizes für schnellere Abfragen
TaskSchema.index({ title: 'text', description: 'text' });
TaskSchema.index({ project: 1 });
TaskSchema.index({ board: 1 });
TaskSchema.index({ columnId: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ 'assignees': 1 });
TaskSchema.index({ 'tags': 1 });
TaskSchema.index({ createdBy: 1 });

const Task = mongoose.model<ITask>('Task', TaskSchema);

export default Task; 