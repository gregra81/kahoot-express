const { DataTypes, Model } = require('sequelize');

module.exports = class SessionModel extends Model {
  /**
   * @param {import('sequelize').Sequelize} sequelizeInstance
   * @returns {typeof SessionModel}
   */

  static setup(sequelizeInstance) {
    SessionModel.init(
      {
        accountId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: false,
          unique: false,
        },
        eventId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: false,
          unique: false,
        },
        sessionId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: false,
          unique: false,
        },
        fk_trivia: {
          type: DataTypes.INTEGER,
          allowNull: false,
          refererences: {
            model: {
              tableName: 'Trivias',
            },
            key: 'id',
          },
        },
      },
      {
        sequelize: sequelizeInstance,
        modelName: 'Session',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'Sessions',
      }
    );
    return SessionModel;
  }
};
