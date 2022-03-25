module.exports = {
    /** @param {import('sequelize').QueryInterface} queryInterface */
    up: async (queryInterface, Sequelize) => {
      return queryInterface.createTable('cache', {
        key: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        value: {
            type: Sequelize.DataTypes.JSON,
            allowNull: false,
        },
        expires: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
        },
        createdAt: {
            type: Sequelize.DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
            field: 'updated_at'
        },
      });
    },
  
    /** @param {import('sequelize').QueryInterface} queryInterface */
    down: async (queryInterface) => {
      return queryInterface.dropTable('cache');
    },
  };
  