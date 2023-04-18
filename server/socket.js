import { Server } from 'socket.io';
import { applyFlat } from './helpers/common.js';
import { getGameRole, getGameState, updateGameState } from './models/game.js';
import { getUserIdByToken } from './models/user.js';

const gamesStates = {};

let io;

const updateState = (gameId, state, isEmit = true) => {
  gamesStates[gameId] = applyFlat(gamesStates[gameId], state);

  if(isEmit) io.to('game' + gameId).emit('update-state', state);
  updateGameState(gameId, state);
};

export default server => {
  io = new Server(server, {
    serveClient: false
  });

  io.of('/').adapter.on('delete-room', room => {
    if(!room.startsWith('game')) return;

    const gameId = parseInt(room.replace('game', ''), 10);
    delete(gamesStates[gameId]);
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if(!token) return next(new Error('Ошибка авторизации'));

    let userId = null;

    if(token === process.env.JEOPARDY_ADMIN_PASSWORD) {
      userId = 0;
    } else {
      userId = await getUserIdByToken(token);
    }

    if(!Number.isInteger(userId)) return next(new Error('Ошибка авторизации'));

    const gameId = parseInt(socket.handshake.query.gameId, 10);
    const role = await getGameRole(userId, gameId);
    if(role === null) return next(new Error('Игра не найдена'));

    socket.userId = userId;
    socket.gameId = gameId;
    socket.isGameOwner = role === 'owner';

    next();
  });

  io.on('connection', async socket => {
    socket.on('disconnect', () => {
      if(!gamesStates[socket.gameId]) return;

      const state = {};

      if(gamesStates[socket.gameId].screen !== 'pause') {
        const currentState = gamesStates[socket.gameId];

        const screenData = {
          prevScreen: currentState.screen,
          prevScreenData: currentState.screenData
        };

        state.screen = 'pause';
        state.screenData = screenData;
      }

      if(!socket.isGameOwner) {
        state.playersOnline = Object.assign(
          {}, gamesStates[socket.gameId].playersOnline, { [socket.userId]: 0 }
        );
      }

      if(Object.keys(state).length === 0) return;

      updateState(socket.gameId, state);
    });

    socket.join('game' + socket.gameId);

    let state;
    let updatedState = null;

    if(gamesStates[socket.gameId]) state = gamesStates[socket.gameId];
    else {
      state = await getGameState(socket.gameId);

      updatedState = { playersOnline: {} };
      for(let userId in state.playersOnline) {
        updatedState.playersOnline[userId] = 0;
        state.playersOnline[userId] = 0;
      }

      gamesStates[socket.gameId] = state;
    }

    if(!socket.isGameOwner) {
      state = Object.assign({}, state);
      delete(state.log);
    }

    socket.emit('state', state);
    if(updatedState) updateState(socket.gameId, updatedState);

    if(!socket.isGameOwner) {
      updateState(socket.gameId, {
        playersOnline: Object.assign(
          {}, gamesStates[socket.gameId].playersOnline, { [socket.userId]: 1 }
        )
      });
    }

    socket.on('update-state', updatedState => {
      updateState(socket.gameId, updatedState);
    });
  });

  globalThis.IO = io;
};