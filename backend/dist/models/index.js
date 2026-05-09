import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
export class Job extends Model {
    id;
    prompt;
    num_thumbnails;
    headshot_url;
    status;
    created_at;
    // Association properties
    thumbnails;
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
export class Thumbnail extends Model {
    id;
    job_id;
    style_name;
    imagekit_url;
    status;
    error_message;
    created_at;
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
