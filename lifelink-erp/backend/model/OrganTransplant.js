const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const OrganTransplant = sequelize.define('OrganTransplant', {
  donor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'DeceasedDonors',
      key: 'id'
    }
  },
  recipient_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Recipients',
      key: 'id'
    }
  },
  organ_type: {
    type: DataTypes.ENUM(
      'Heart', 'Liver', 'Kidney', 'Lungs', 'Pancreas', 
      'Corneas', 'Skin', 'Bone', 'Small_Intestine', 'Heart_Valves'
    ),
    allowNull: false
  },
  transplant_status: {
    type: DataTypes.ENUM('Available', 'Matched', 'Transplanted', 'Expired', 'Wasted', 'Rejected'),
    defaultValue: 'Available'
  },
  compatibility_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  match_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  transplant_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  urgency_priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  distance_km: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  blood_group_compatibility: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  medical_compatibility: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejection_risk: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  organ_viability_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Hours remaining for organ viability'
  },
  expiry_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the organ will expire and become unusable'
  },
  waste_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason why organ was wasted if applicable'
  },
  allocation_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times this organ was offered to recipients'
  },
  coordinator_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hospital_contact_info: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['donor_id']
    },
    {
      fields: ['transplant_status']
    },
    {
      fields: ['organ_type']
    }
  ]
});

// Define associations after model definitions
const defineAssociations = () => {
  const DeceasedDonor = require('./DeceasedDonor');
  const Recipient = require('./Recipient');
  
  // OrganTransplant belongs to DeceasedDonor
  OrganTransplant.belongsTo(DeceasedDonor, {
    foreignKey: 'donor_id',
    as: 'donor'
  });
  
  // OrganTransplant belongs to Recipient
  OrganTransplant.belongsTo(Recipient, {
    foreignKey: 'recipient_id',
    as: 'recipient'
  });
  
  // DeceasedDonor has many OrganTransplants
  DeceasedDonor.hasMany(OrganTransplant, {
    foreignKey: 'donor_id',
    as: 'transplants'
  });
  
  // Recipient has many OrganTransplants
  Recipient.hasMany(OrganTransplant, {
    foreignKey: 'recipient_id',
    as: 'transplants'
  });
};

// Export both the model and the association function
module.exports = OrganTransplant;
module.exports.defineAssociations = defineAssociations;