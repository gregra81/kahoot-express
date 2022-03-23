const { Sequelize, QueryTypes } = require('sequelize');
const { fromDbToEntity: fromTriviaDbToEntity } = require('../mapper/triviaMapper');
const { fromDbToEntity: fromGameDbToEntity} = require('../mapper/gameMapper');
const { fromDbToEntity: fromPlayerDbToEntity } = require('../mapper/playerMapper');
const { fromDbToEntity: fromPlayerAnswerDbToEntity } = require('../mapper/playerAnswerMapper');
const {fromDbToEntityWithAnswer: fromQuestionToEntityWithAnswer} = require("../mapper/questionMapper");
const {fromDbToEntity: fromQuestionToEntity} = require("../mapper/questionMapper");
const {fromDbToEntities: fromAnswerDbToEntities} = require("../mapper/answerMapper");
const { fromDbToEntity: fromDbToAnswerEntity } = require('../mapper/answerMapper');


module.exports = class KahootRepository {
  /**
   * @param {typeof import('../model/answerModel')} AnswerModel
   * @param {typeof import('../model/gameModel')} GameModel
   * @param {typeof import('../model/playerAnswerModel')} PlayerAnswerModel
   * @param {typeof import('../model/playerModel')} PlayerModel
   * @param {typeof import('../model/questionModel')} QuestionModel
   * @param {typeof import('../model/triviaModel')} TriviaModel
   * @param {typeof import('../model/sessionModel')} SessionModel
   */
  constructor(AnswerModel, QuestionModel, TriviaModel, SessionModel, GameModel, PlayerModel, PlayerAnswerModel) {
    this.AnswerModel = AnswerModel;
    this.QuestionModel = QuestionModel;
    this.TriviaModel = TriviaModel;
    this.SessionModel = SessionModel;
    this.GameModel = GameModel;
    this.PlayerModel = PlayerModel;
    this.PlayerAnswerModel = PlayerAnswerModel;
  }

  async createTrivia(triviaName) {
    const trivia = await this.TriviaModel.create({
      name: triviaName,
    });
    return fromTriviaDbToEntity(trivia);
  }

  async getTriviaIdForSession(accountId, eventId, sessionId) {
    const session = await this.SessionModel.findOne({ where: { accountId, eventId, sessionId } });
    return session ? session.fk_trivia : 0;
  }

  async getTriviaForSession(accountId, eventId, sessionId) {
    const triviaId = await this.getTriviaIdForSession(accountId, eventId, sessionId);
    const trivia = this.getTriviaById(triviaId);
    return trivia;
  }

  async getAllTrivias() {
    const triviasData = await this.TriviaModel.findAll({ attributes: ['id', 'name'] });
    const trivias = triviasData.map((trivia) => fromTriviaDbToEntity(trivia));
    return trivias;
  }

  async getTriviaById(id) {
    const triviaData = await this.TriviaModel.findByPk(id, {
      attributes: ['id', 'name'],
      include: [
        {
          model: this.QuestionModel,
          where: {
            fk_trivia: id,
          },
          attributes: ['id', 'fk_trivia', 'description'],
          include: [
            {
              model: this.AnswerModel,
              attributes: ['id', 'description', 'fk_question', 'is_correct'],
            },
          ],
        },
      ],
    });
    return fromTriviaDbToEntity(triviaData);
  }

  async getQuestionAnswers(questionId) {
    const answerData = await this.QuestionModel.findByPk(questionId, {
      attributes: ['id', 'fk_trivia', 'description'],
      include: [
        {
          model: this.AnswerModel,
          where: {
            fk_trivia: questionId,
          },
          attributes: ['id', 'description', 'fk_question', 'is_correct'],
        },
      ],
    });
    return fromAnswerDbToEntities(answerData)
  }

  async createQuestion(triviaId, question, answers) {
    const questionData = await this.QuestionModel.create({
      fk_trivia: triviaId,
      description: question.description,
    });
    const answersDataJson = []
    for(const answer in answers) {
      // eslint-disable-next-line no-await-in-loop
      const answerData = await this.AnswerModel.create({
        description: answers[answer].description,
        is_correct: answers[answer].is_correct,
        fk_question: questionData.dataValues.id
      });
      answersDataJson.push(fromDbToAnswerEntity(answerData.toJSON()))
    }
    return fromQuestionToEntityWithAnswer(questionData, answersDataJson);
  }

  async updateQuestion(triviaId, questionId, question) {
    await this.QuestionModel.update({
      fk_trivia: triviaId,
      description: question.description,
    },{
      where: {id: questionId}
    });
  }

  async createAnswer(triviaId, questionId, answer) {
    const answerData = await this.AnswerModel.create({
      description: answer.description,
      is_correct: answer.is_correct,
      fk_question: questionId
    });
    return fromDbToAnswerEntity(answerData.toJSON())
  }

  async updateAnswer(triviaId, questionId, answerId, answer) {
    await this.AnswerModel.update({
      description: answer.description,
      is_correct: answer.is_correct,
      fk_question: questionId,
    },{
      where: {id: answerId}
    });
  }

  async saveGame(game) {
    const gameData = await this.GameModel.create({
      fk_trivia: game.triviaId,
      namespace: game.namespaceName,
      ongoing: game.ongoing,
    });
    return fromGameDbToEntity(gameData);
  }

  async savePlayer({ gameId, playerName, sessionId }) {
    const player = await this.PlayerModel.create({
      fk_game: gameId,
      name: playerName,
      session_id: sessionId,
    });
    return fromPlayerDbToEntity(player);
  }

  async savePlayerAnswer({ playerId, answerId, score }) {
    const playerAnswer = await this.PlayerAnswerModel.create({
      fk_player: playerId,
      fk_answer: answerId,
      score,
    });
    return fromPlayerAnswerDbToEntity(playerAnswer);
  }

  async setGameToEnded(gameId) {
    const game = await this.GameModel.findByPk(gameId);
    game.ongoing = false;
    const gameEnded = await game.save();
    return fromGameDbToEntity(gameEnded);
  }

  async getMostPlayedTrivias() {
    return this.GameModel.findAll({
      attributes: [
        'fk_trivia',
        [Sequelize.fn('COUNT', Sequelize.col('fk_trivia')), 'trivias_played'],
      ],
      group: ['fk_trivia'],
      order: [[Sequelize.literal('trivias_played'), 'DESC']],
      limit: 10,
    });
  }

  async getTotalTriviaNumber() {
    return this.TriviaModel.count();
  }

  async getmostDifficultQuestions() {
    const { sequelize } = this.PlayerAnswerModel;

    return sequelize.query(
      'SELECT SUM(score) AS score, fk_question, description FROM (SELECT pa.id, pa.fk_answer,pa.score, a.fk_question, q.description FROM "PlayerAnswers" AS pa JOIN "Answers" as a ON pa.fk_answer = a.id JOIN "Questions" as q ON a.fk_question = q.id GROUP BY pa.id, a.fk_question, q.description ORDER BY a.fk_question, pa.score DESC) AS tablas GROUP BY fk_question, description ORDER BY score ASC LIMIT 10;',
      { type: QueryTypes.SELECT }
    );
  }

  async getTotalPlayers() {
    return this.PlayerModel.count({ col: 'session_id', distinct: true });
  }

  async getTotalGames() {
    return this.GameModel.count();
  }
};
