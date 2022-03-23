require('dotenv').config({ path: `${__dirname}/.env` });

const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const cors = require('cors');
const { initKahootModule } = require('./src/module');
const configureDI = require('./src/config/di');

const PORT = process.env.PORT || 3030;
const app = express();
const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = socketIO(server);
app.use(cors())

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.urlencoded({ extended: true }));

const container = configureDI();
const sessionMiddleware = container.get('Session');
app.use(sessionMiddleware);

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

initKahootModule(app, io, container);
