module.exports = {
  /** @param {import('sequelize').QueryInterface} queryInterface */
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Session', {
      sid: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      expires: {
        type: Sequelize.DataTypes.DATE,
      },
      data: {
        type: Sequelize.DataTypes.TEXT,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
      },
    });
  },

  /** @param {import('sequelize').QueryInterface} queryInterface */
  down: async (queryInterface) => {
    return queryInterface.dropTable('Session');
  },
};
