module.exports = {
  /** @param {import('sequelize').QueryInterface} queryInterface */

  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Sessions', {
      accountId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      eventId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      sessionId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      fk_trivia: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        refererences: {
          model: {
            tableName: 'Trivias',
          },
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
      },
    });
  },
  /** @param {import('sequelize').QueryInterface} queryInterface */

  down: async (queryInterface) => {
    return queryInterface.dropTable('Sessions');
  },
};
