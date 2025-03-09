import mongoose, { Document, Schema } from 'mongoose';

// Spalten-Schnittstelle
interface IColumn {
  _id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  tasks: mongoose.Types.ObjectId[];
}

// Board-Schnittstelle
export interface IBoard extends Document {
  project: mongoose.Types.ObjectId;
  name: string;
  columns: IColumn[];
  createdAt: Date;
  updatedAt: Date;
}

// Board-Schema
const BoardSchema = new Schema<IBoard>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Projekt ist erforderlich']
    },
    name: {
      type: String,
      required: [true, 'Board-Name ist erforderlich'],
      trim: true,
      maxlength: [100, 'Board-Name darf maximal 100 Zeichen lang sein']
    },
    columns: [{
      title: {
        type: String,
        required: [true, 'Spaltentitel ist erforderlich'],
        trim: true
      },
      order: {
        type: Number,
        required: [true, 'Spaltenreihenfolge ist erforderlich']
      },
      tasks: [{
        type: Schema.Types.ObjectId,
        ref: 'Task'
      }]
    }]
  },
  {
    timestamps: true
  }
);

// Methode zum Hinzufügen einer Spalte
BoardSchema.methods.addColumn = async function(title: string) {
  const maxOrder = this.columns.length > 0
    ? Math.max(...this.columns.map(col => col.order))
    : -1;
  
  this.columns.push({
    title,
    order: maxOrder + 1,
    tasks: []
  });
  
  return this.save();
};

// Methode zum Aktualisieren einer Spalte
BoardSchema.methods.updateColumn = async function(columnId: mongoose.Types.ObjectId, title: string) {
  const column = this.columns.id(columnId);
  
  if (!column) {
    throw new Error('Spalte nicht gefunden');
  }
  
  column.title = title;
  return this.save();
};

// Methode zum Löschen einer Spalte
BoardSchema.methods.deleteColumn = async function(columnId: mongoose.Types.ObjectId) {
  const columnIndex = this.columns.findIndex(col => col._id.toString() === columnId.toString());
  
  if (columnIndex === -1) {
    throw new Error('Spalte nicht gefunden');
  }
  
  // Spalte entfernen
  this.columns.splice(columnIndex, 1);
  
  // Reihenfolge der verbleibenden Spalten aktualisieren
  this.columns.forEach((col, index) => {
    col.order = index;
  });
  
  return this.save();
};

// Methode zum Hinzufügen einer Aufgabe zu einer Spalte
BoardSchema.methods.addTaskToColumn = async function(
  columnId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId
) {
  const column = this.columns.id(columnId);
  
  if (!column) {
    throw new Error('Spalte nicht gefunden');
  }
  
  column.tasks.push(taskId);
  return this.save();
};

// Methode zum Verschieben einer Aufgabe zwischen Spalten
BoardSchema.methods.moveTask = async function(
  taskId: mongoose.Types.ObjectId,
  sourceColumnId: mongoose.Types.ObjectId,
  destinationColumnId: mongoose.Types.ObjectId,
  newIndex: number
) {
  const sourceColumn = this.columns.id(sourceColumnId);
  const destinationColumn = this.columns.id(destinationColumnId);
  
  if (!sourceColumn || !destinationColumn) {
    throw new Error('Spalte nicht gefunden');
  }
  
  // Aufgabe aus der Quellspalte entfernen
  const taskIndex = sourceColumn.tasks.findIndex(
    task => task.toString() === taskId.toString()
  );
  
  if (taskIndex === -1) {
    throw new Error('Aufgabe nicht in der Quellspalte gefunden');
  }
  
  const [removedTask] = sourceColumn.tasks.splice(taskIndex, 1);
  
  // Aufgabe in die Zielspalte einfügen
  destinationColumn.tasks.splice(newIndex, 0, removedTask);
  
  return this.save();
};

// Indizes für schnellere Abfragen
BoardSchema.index({ project: 1 });
BoardSchema.index({ name: 1 });

const Board = mongoose.model<IBoard>('Board', BoardSchema);

export default Board; 