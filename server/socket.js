import { Server } from 'socket.io';
import { applyFlat } from './helpers/common.js';
import { getGameRole, getGameState, updateGameState } from './models/game.js';
import { getUserIdByToken } from './models/user.js';

const gamesStates = {};
const gamesTimers = {};

let io;

const updateState = (gameId, state) => {
  let needStartTimer = false;
  let needStopTimer = false;

  if(
    state.screen &&
    state.screen === 'question' &&
    !gamesStates[gameId].isPause
  ) {
    needStartTimer = true;
  }

  if(
    state.isPause === false &&
    gamesStates[gameId].screen === 'question' &&
    gamesStates[gameId].screenData.answerPlayerId === 0
  ) {
    needStartTimer = true;
  }

  if(
    state['screenData.answerPlayerId'] === 0
  ) {
    needStartTimer = true;
  }

  if(state.screen && state.screen !== 'question') needStopTimer = true;
  if(state.isPause === true && gamesStates[gameId].screen === 'question') needStopTimer = true;

  gamesStates[gameId] = applyFlat(gamesStates[gameId], state);

  io.to('game' + gameId).emit('update-state', state);
  updateGameState(gameId, state);

  if(needStartTimer) {
    gamesTimers[gameId] = setInterval(() => {
      if(!Object.hasOwn(gamesStates[gameId].screenData, 'time')) {
        clearInterval(gamesTimers[gameId]);
        return;
      }

      const newTime = gamesStates[gameId].screenData.time - 1;
      if(newTime === 0) clearInterval(gamesTimers[gameId]);

      updateState(gameId, { ['screenData.time']: newTime });
    }, 1000);
  }

  if(needStopTimer && Object.hasOwn(gamesTimers, gameId)) clearInterval(gamesTimers[gameId]);
};

export default server => {
  io = new Server(server, {
    serveClient: false,
    pingInterval: 10000
  });

  io.of('/').adapter.on('delete-room', room => {
    if(!room.startsWith('game')) return;

    const gameId = parseInt(room.replace('game', ''), 10);

    delete(gamesStates[gameId]);
    updateGameState(gameId, { isPause: true });
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
      if(!gamesStates[socket.gameId].isPause) state.isPause = true;

      if(!socket.isGameOwner) {
        state['playersOnline.' + socket.userId] = 0;
        if(
          gamesStates[socket.gameId].screen === 'prequestion' ||
          gamesStates[socket.gameId].screen === 'question'
        ) {
          state['screenData.loaded.' + socket.userId] = 0;
        }
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

    socket.on('answer', () => {
      if(
        gamesStates[socket.gameId].screen !== 'question' ||
        gamesStates[socket.gameId].screenData.answerPlayerId !== 0 ||
        gamesStates[socket.gameId].screenData.banned[socket.userId] === 1
      ) return;

      if(Object.hasOwn(gamesTimers, socket.gameId)) clearInterval(gamesTimers[socket.gameId]);

      updateState(socket.gameId, {
        'screenData.answerPlayerId': socket.userId
      });
    });

    socket.on('question-load', () => {
      if(
        gamesStates[socket.gameId].screen === 'prequestion' ||
        gamesStates[socket.gameId].screen === 'question'
      ) {
        updateState(socket.gameId, {
          ['screenData.loaded.' + socket.userId]: 1
        });
      }
    });

    socket.on('update-state', updatedState => {
      updateState(socket.gameId, updatedState);
    });

    socket.on('add-log', log => {
      if(!socket.isGameOwner) return;
      gamesStates[socket.gameId].log = [log, ...gamesStates[socket.gameId].log];
      updateGameState(socket.gameId, { log: gamesStates[socket.gameId].log });
    });
  });

  globalThis.IO = io;
};