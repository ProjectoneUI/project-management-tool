import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Benutzer-Schnittstelle
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  teams: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

// Benutzer-Schema
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Benutzername ist erforderlich'],
      unique: true,
      trim: true,
      minlength: [3, 'Benutzername muss mindestens 3 Zeichen lang sein'],
      maxlength: [30, 'Benutzername darf maximal 30 Zeichen lang sein']
    },
    email: {
      type: String,
      required: [true, 'E-Mail ist erforderlich'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Bitte geben Sie eine gültige E-Mail-Adresse an'
      ]
    },
    password: {
      type: String,
      required: [true, 'Passwort ist erforderlich'],
      minlength: [6, 'Passwort muss mindestens 6 Zeichen lang sein'],
      select: false // Passwort nicht in Abfrageergebnissen anzeigen
    },
    firstName: {
      type: String,
      required: [true, 'Vorname ist erforderlich'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Nachname ist erforderlich'],
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'projectManager', 'teamMember'],
      default: 'teamMember'
    },
    avatar: {
      type: String
    },
    teams: [{
      type: Schema.Types.ObjectId,
      ref: 'Team'
    }]
  },
  {
    timestamps: true
  }
);

// Passwort vor dem Speichern hashen
UserSchema.pre<IUser>('save', async function(next) {
  // Nur hashen, wenn das Passwort geändert wurde
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Methode zum Vergleichen von Passwörtern
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Fehler beim Vergleichen der Passwörter');
  }
};

// Methode zum Generieren eines JWT-Tokens
UserSchema.methods.generateAuthToken = function(): string {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Virtuelle Eigenschaft für den vollständigen Namen
UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Indizes für schnellere Abfragen
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User; 