<script>
  import { onDestroy, createEventDispatcher } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import { token } from '../common/auth.js';
  import { applyFlat } from '../common/helpers.js';

  export let game = {};
  let state = null;
  let editPlayer = null;

  let inputScore;

  const dispatch = createEventDispatcher();

  const socket = io({
    autoConnect: false,
    auth: { token },
    query: { gameId: game.id }
  });

  socket.on('connect_error', err => {
    dispatch('close');
    alert(err.message);
  });

  const onDisconnect = reason => {
    dispatch('close');
    alert('Соединение с сервером потеряно по причине: ' + reason);
  };

  socket.on('disconnect', onDisconnect);

  socket.on('state', actualState => {
    state = actualState;
  });

  socket.on('update-state', updatedState => {
    state = applyFlat(state, updatedState);
  });

  socket.connect();

  onDestroy(() => {
    socket.off('disconnect', onDisconnect);
    socket.close();
  });

  const updateState = updatedState => {
    socket.emit('update-state', updatedState);
  };

  const togglePause = () => {
    const updatedState = {};

    if(state.screen === 'pause') {
      updatedState.screen = state.screenData.prevScreen;
      updatedState.screenData = state.screenData.prevScreenData;
    } else {
      const screenData = {
        prevScreen: state.screen,
        prevScreenData: state.screenData
      };

      updatedState.screen = 'pause';
      updatedState.screenData = screenData;
    }

    updateState(updatedState);
  };

  const setActivePlayer = () => {
    updateState({ activePlayer: editPlayer });
    editPlayer = null;
  };

  const changeScore = sign => {
    let value = parseInt(inputScore.value, 10);
    if(value < 1) return alert('В поле должно быть положительное число');
    value = value * sign;

    updateState({ ['scores.' + editPlayer]: state.scores[editPlayer] + value });
    editPlayer = null;
  };
</script>

<div class="game">
  {#if state !== null}
    <div class="level">
      <div class="level-left">
        <div class="title mb-0 mr-5">{ game.name }</div>
        <button class="button"
                class:is-success={ state.screen === 'pause' }
                on:click={ togglePause }>
          { state.screen === 'pause' ? 'Продолжить' : 'На паузу' }
        </button>
      </div>
      <div class="level-right">
        <button class="button" on:click={ () => dispatch('close') }>Закрыть</button>
      </div>
    </div>
    <div class="columns">
      {#each Object.entries(state.players) as [userId, userName]}
        <div class="column is-narrow">
          <div class="card"
               class:has-background-warning={ state.activePlayer == userId }>
            <div class="card-header">
              <div class="card-header-title"
                   class:has-text-success-dark={ state.playersOnline[userId] === 1 }
                   class:has-text-danger-dark={ state.playersOnline[userId] === 0 }>
                { userName }
              </div>
              <a href="#" class="link card-header-icon"
                 on:click|preventDefault={ () => editPlayer = userId }>
                { state.scores[userId] }
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if editPlayer !== null}
    <Modal title="{ state.players[editPlayer] }: { state.scores[editPlayer] }"
           on:close={ () => editPlayer = null }>
      <div slot="body">
        <div class="field has-addons">
          <div class="control">
            <button class="button is-danger" on:click={ () => changeScore(-1) }>
              Вычесть
            </button>
          </div>
          <div class="control is-expanded">
            <input type="number" class="input" placeholder="Изменение счета"
                   bind:this={ inputScore }>
          </div>
          <div class="control">
            <button class="button is-success" on:click={ () => changeScore(1) }>
              Добавить
            </button>
          </div>
        </div>
      </div>
      <div slot="footer">
        <button class="button is-warning" on:click={ setActivePlayer }>
          Сделать активным игроком
        </button>
      </div>
    </Modal>
  {/if}
</div>