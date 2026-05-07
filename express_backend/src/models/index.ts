import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

interface JobAttributes {
  id: string;
  prompt: string;
  num_thumbnails: number;
  headshot_url: string;
  status: string;
  created_at?: Date;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'status'> {}

export class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: string;
  public prompt!: string;
  public num_thumbnails!: number;
  public headshot_url!: string;
  public status!: string;
  public readonly created_at!: Date;

  // Association properties
  public readonly thumbnails?: Thumbnail[];
}

Job.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  prompt: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  num_thumbnails: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 3,
    },
  },
  headshot_url: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
}, {
  sequelize,
  tableName: 'Jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

interface ThumbnailAttributes {
  id: string;
  job_id: string;
  style_name: string;
  imagekit_url?: string | null;
  status: string;
  error_message?: string | null;
  created_at?: Date;
}

interface ThumbnailCreationAttributes extends Optional<ThumbnailAttributes, 'id' | 'status' | 'imagekit_url' | 'error_message'> {}

export class Thumbnail extends Model<ThumbnailAttributes, ThumbnailCreationAttributes> implements ThumbnailAttributes {
  public id!: string;
  public job_id!: string;
  public style_name!: string;
  public imagekit_url!: string | null;
  public status!: string;
  public error_message!: string | null;
  public readonly created_at!: Date;
}

Thumbnail.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  job_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  style_name: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  imagekit_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'Thumbnails',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

Job.hasMany(Thumbnail, { as: 'thumbnails', foreignKey: 'job_id' });
Thumbnail.belongsTo(Job, { as: 'job', foreignKey: 'job_id' });

export { sequelize };
