module.exports = {
  /** @param {import('sequelize').QueryInterface} queryInterface */
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('Sessions', [
      {
        accountId: 174258,
        eventId: 394740,
        sessionId: 848987,
        fk_trivia: 1,
      }
    ]);
  },

  /** @param {import('sequelize').QueryInterface} queryInterface */
  down: async (queryInterface) => {
    return queryInterface.bulkDelete('Sessions', null, {});
  },
};
