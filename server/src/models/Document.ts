import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

// Dateiinfo-Schnittstelle
interface IFileInfo {
  fileName: string;
  filePath: string;
  fileType: string;
  oneDriveId?: string;
}

// Versionsschnittstelle
interface IVersion {
  content: string;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
  changeDescription: string;
}

// Dokument-Schnittstelle
export interface IDocument extends MongooseDocument {
  title: string;
  content: string;
  project: mongoose.Types.ObjectId;
  fileInfo?: IFileInfo;
  versions: IVersion[];
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Dokument-Schema
const DocumentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, 'Dokumenttitel ist erforderlich'],
      trim: true,
      maxlength: [200, 'Dokumenttitel darf maximal 200 Zeichen lang sein']
    },
    content: {
      type: String,
      required: [true, 'Dokumentinhalt ist erforderlich']
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Projekt ist erforderlich']
    },
    fileInfo: {
      fileName: {
        type: String
      },
      filePath: {
        type: String
      },
      fileType: {
        type: String
      },
      oneDriveId: {
        type: String
      }
    },
    versions: [{
      content: {
        type: String,
        required: true
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      changeDescription: {
        type: String,
        required: true
      }
    }],
    tags: [{
      type: String,
      trim: true
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

// Methode zum Aktualisieren des Inhalts und Erstellen einer neuen Version
DocumentSchema.methods.updateContent = async function(
  content: string,
  userId: mongoose.Types.ObjectId,
  changeDescription: string
) {
  // Aktuelle Version speichern
  this.versions.push({
    content: this.content,
    updatedBy: this.updatedBy || this.createdBy,
    updatedAt: new Date(),
    changeDescription
  });
  
  // Inhalt aktualisieren
  this.content = content;
  
  return this.save();
};

// Methode zum Abrufen einer bestimmten Version
DocumentSchema.methods.getVersion = function(versionIndex: number) {
  if (versionIndex < 0 || versionIndex >= this.versions.length) {
    throw new Error('Ungültiger Versionsindex');
  }
  
  return this.versions[versionIndex];
};

// Methode zum Wiederherstellen einer früheren Version
DocumentSchema.methods.restoreVersion = async function(
  versionIndex: number,
  userId: mongoose.Types.ObjectId
) {
  const version = this.getVersion(versionIndex);
  
  // Aktuelle Version speichern
  this.versions.push({
    content: this.content,
    updatedBy: this.updatedBy || this.createdBy,
    updatedAt: new Date(),
    changeDescription: 'Automatisch gespeichert vor Wiederherstellung'
  });
  
  // Inhalt aus der ausgewählten Version wiederherstellen
  this.content = version.content;
  
  // Neue Version mit Wiederherstellungshinweis erstellen
  this.versions.push({
    content: version.content,
    updatedBy: userId,
    updatedAt: new Date(),
    changeDescription: `Version ${versionIndex + 1} wiederhergestellt`
  });
  
  return this.save();
};

// Methode zum Hinzufügen eines Tags
DocumentSchema.methods.addTag = async function(tag: string) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return this;
};

// Methode zum Entfernen eines Tags
DocumentSchema.methods.removeTag = async function(tag: string) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Indizes für schnellere Abfragen
DocumentSchema.index({ title: 'text', content: 'text' });
DocumentSchema.index({ project: 1 });
DocumentSchema.index({ 'tags': 1 });
DocumentSchema.index({ createdBy: 1 });
DocumentSchema.index({ updatedAt: -1 });

const Document = mongoose.model<IDocument>('Document', DocumentSchema);

export default Document; 