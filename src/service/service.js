/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */

const { getContacts, getSession } = require('../lib/bizzaboClient');
const ClientError = require("../entity/ClientError");

module.exports = class KahootService {
  constructor(kahootRepository) {
    this.kahootRepository = kahootRepository;
  }

  async getTriviaById(id) {
    const trivia = await this.kahootRepository.getTriviaById(id);
    return trivia;
  }

  async connectTriviaToSession(accountId, eventId, sessionId, triviaId) {
    const session = await getSession(accountId, eventId, sessionId)
    if(session === undefined)
      throw new ClientError("the seesion is not found", 404)
    const trivia = await this.kahootRepository.connectTriviaToSession(accountId, eventId, sessionId, triviaId);
    return trivia;
  }

  async getTriviaIdForSession(accountId, eventId, sessionId) {
    const triviaId = await this.kahootRepository.getTriviaIdForSession(accountId, eventId, sessionId);
    return triviaId;
  }

  async getTriviaForSession(accountId, eventId, sessionId) {
    const trivia = await this.kahootRepository.getTriviaForSession(accountId, eventId, sessionId);
    return trivia;
  }

  async getAllTrivias() {
    const trivias = await this.kahootRepository.getAllTrivias();
    return trivias;
  }

  async createQuestion(triviaId, question, answers) {
    this.validateAnswers(answers)
    const questionRes = await this.kahootRepository.createQuestion(triviaId, question, answers);
    return questionRes;
  }

  async createQuestions(triviaId, bodies) {
    console.log(bodies)
    const questionsRes = []
    for(const body in bodies) {
      console.log(bodies[body])
      // eslint-disable-next-line no-await-in-loop
      const questionRes = await this.kahootRepository.createQuestion(triviaId, bodies[body].question, bodies[body].answers);
      questionsRes.push(questionRes)
    }
    return questionsRes;
  }

  async updateQuestion(triviaId, questionId, question, answers) {
    const questionRes = await this.kahootRepository.updateQuestion(triviaId, questionId, question, answers);
    return questionRes;
  }

  async createAnswer(triviaId, questionId, answer) {
    const answerRes = await this.kahootRepository.createAnswer(triviaId, questionId, answer);
    return answerRes;
  }

  async updateAnswer(triviaId, questionId, answerId, answer) {
    const answers = await this.kahootRepository.getQuestionAnswers(questionId)
    this.validateAnswer(answers, answer)
    await this.kahootRepository.updateAnswer(triviaId, questionId, answerId, answer);
  }

  validateAnswers(answers){
    if(answers.length !== 4){
      throw new ClientError('You should Provide exactly 4 answers', 400)
    }
    let count = 1;
    for (const answer in answers ) {
      if(answers[answer].is_correct){
        count++
      }
    }
    if(count !== 1){
      throw new ClientError('You should Provide exactly 1 ')
    }
  }

  validateAnswer(answers, answer) {
    answers[answer].is_correct = answer.is_correct
    this.validateAnswers(answers)
  }

  configureMiniPodium(namespace, options) {
    namespace.miniPodium = options.map((option) => {
      return { option: option.id, count: 0 };
    });
  }

  updatePlayerList(namespace) {
    const socketsInRoom = this.getSocketsInRoom(namespace);

    namespace.players = socketsInRoom;

    const playerNames = socketsInRoom.map((socket) => socket.playerName);

    namespace.emit('playerlist', playerNames);
  }

  calculatePodium(players) {
    const sortedArray = [];
    const podium = {};

    players.forEach((player) => {
      sortedArray.push([player.playerName, player.score]);
    });

    sortedArray.sort((a, b) => {
      return b[1] - a[1];
    });

    for (let i = 0; i < sortedArray.length; i++) {
      podium[i] = { name: sortedArray[i][0], score: sortedArray[i][1] };
    }

    return podium;
  }

  startTimer(namespace) {
    namespace.timer = 20;
    namespace.interval = setInterval(() => {
      namespace.timer--;
      namespace.emit('timer', namespace.timer);
      if (namespace.timer === 0) {
        clearInterval(namespace.interval);
      }
    }, 1000);
  }

  async sendQuestion(namespace) {
    const { trivia, counter, players } = namespace;

    if (counter === trivia.questions.length) {
      namespace.emit('podium', this.calculatePodium(players));
      await this.kahootRepository.setGameToEnded(namespace.gameId);
    } else {
      this.startTimer(namespace);
      const questionDescription = trivia.questions[counter].description;
      const questionOptions = trivia.questions[counter].answers.map((answer) => {
        return { id: answer.id, description: answer.description };
      });
      this.configureMiniPodium(namespace, questionOptions);
      namespace.emit('question', {
        question: questionDescription,
        options: questionOptions,
      });
    }
  }

  sendMiniPodium(namespace) {
    namespace.emit('mini-podium', namespace.miniPodium);
  }

  showScoreboard(namespace) {
    namespace.emit('scoreboard', this.calculatePodium(namespace.players));
  }

  nextQuestion(namespace, callback) {
    namespace.counter++;
    namespace.players.forEach((player) => {
      player.answered = false;
    });
    clearInterval(namespace.interval);
    callback(namespace);
  }

  async setScore(socket, answerId) {
    const { nsp: namespace } = socket;
    const { trivia, counter } = namespace;

    if (!socket.answered) {
      socket.answered = true;
      const playerAnswer = trivia.questions[counter].answers.find(
        (answer) => answer.id === answerId
      );
      namespace.miniPodium.find((option) => option.option === playerAnswer.id).count++;
      if (playerAnswer.isCorrect) {
        socket.score += namespace.timer;
      }

      await this.kahootRepository.savePlayerAnswer({
        playerId: socket.playerId,
        answerId: playerAnswer.id,
        score: socket.score,
      });
    }
  }

  async getPlayer(accountId, eventId, email) {
    if (accountId && eventId && email) {
      try {
        const contactsData = await getContacts(parseInt(accountId), parseInt(eventId));

        const contactsWithProps = contactsData.data.content.map(contact => ({ id: contact.id, eventId: contact.eventId, ...contact.properties }));
        const currentUser = contactsWithProps.filter(contact => contact.email === email).pop();
        return { playerName: `${currentUser.firstName} ${currentUser.lastName}`};
      } catch (error) {
        // do nothing
      }
    }
    return { playerName: 'Anonymous' };
  }

  getAllSockets(namespace) {
    return Object.values(namespace.clients().connected);
  }

  getSocketsInRoom(namespace) {
    const socketsConnected = Object.values(namespace.clients().connected);
    const room = namespace.adapter.rooms.gameroom;

    if (!room) {
      return [];
    }

    const socketsInRoomIds = Object.keys(room.sockets);
    return socketsConnected.filter((socket) => socketsInRoomIds.includes(socket.id));
  }

  async saveGame(triviaId, namespaceName, ongoing) {
    const game = { triviaId, namespaceName, ongoing };
    const savedGame = await this.kahootRepository.saveGame(game);
    return savedGame;
  }

  async savePlayers(socketList, gameId, sessionId) {
    socketList.forEach(async (socket) => {
      const savedPlayer = await this.kahootRepository.savePlayer({
        gameId,
        playerName: socket.playerName,
        sessionId,
      });
      socket.playerId = savedPlayer.id;
    });
  }

  async getStats() {
    const mostPlayedTrivias = await this.kahootRepository.getMostPlayedTrivias();
    const mostDifficultQuestions = await this.kahootRepository.getmostDifficultQuestions();
    const totalPlayers = await this.kahootRepository.getTotalPlayers();
    const totalTriviaNumber = await this.kahootRepository.getTotalTriviaNumber();
    const averagePlayersPerTrivia = totalPlayers / totalTriviaNumber;
    const totalGames = await this.kahootRepository.getTotalGames();
    return {
      mostPlayedTrivias,
      mostDifficultQuestions,
      totalPlayers,
      averagePlayersPerTrivia,
      totalGames,
    };
  }
};
