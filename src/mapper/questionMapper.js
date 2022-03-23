const Question = require('../entity/question');

function fromDbToEntity(question, mappedAnswers) {
  const { id, fk_trivia: triviaId, description } = question.toJSON();
  return new Question({ id, triviaId, description, mappedAnswers });
}

module.exports = {
  fromDbToEntity,
};
