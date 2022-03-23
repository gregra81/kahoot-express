const Answer = require('../entity/answer');

function fromDbToEntity(answer) {
  return new Answer(answer);
}

function fromDbToEntities(modelInstance){
  const answers = modelInstance.toJSON();
  const answersRes = []
  for(const answer in answers) {
    answersRes.push(fromDbToEntity(answer))
  }
  return answersRes;
}

module.exports = {
  fromDbToEntity,
  fromDbToEntities
};
