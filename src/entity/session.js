module.exports = class Session {
  constructor({ accountId, eventId, sessionId, fk_trivia: triviaId }) {
    this.accountId = accountId;
    this.eventId = eventId;
    this.sessionId = sessionId;
    this.triviaId = triviaId;
  }
};
