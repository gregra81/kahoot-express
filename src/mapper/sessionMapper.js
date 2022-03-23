const Session = require('../entity/session');

function fromDataToEntity({ accountId, eventId, sessionId, triviaId }) {
  return new Session({
    accountId,
    eventId,
    sessionId,
    triviaId,
  });
}

function fromDbToEntity(modelInstance) {
  const session = modelInstance.toJSON();
  return new Session(session);
}

module.exports = {
  fromDataToEntity,
  fromDbToEntity,
};
