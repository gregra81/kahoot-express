const Question = require('../entity/question');

function fromDbToEntity(question, answersJson) {
  const { id, fk_trivia: triviaId, description } = question.toJSON();
  return new Question({ id, triviaId, description, answersJson });
}

module.exports = {
  fromDbToEntity,
};
