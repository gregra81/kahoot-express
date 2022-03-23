module.exports = class Question {
  constructor({ id, triviaId, description, answersJson: answers }) {
    this.id = id;
    this.triviaId = triviaId;
    this.description = description;
    this.answers = answers;
  }
};
