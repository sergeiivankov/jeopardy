<script>
  import { onDestroy, createEventDispatcher } from 'svelte';
  import { token } from '../common/auth.js';
  import { applyFlat } from '../common/helpers.js';

  export let game = {};
  let state = null;

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
    if(reason === 'io server disconnect') socket.connect();
    else {
      dispatch('close');
      alert('Соединение с сервером потеряно по причине: ' + reason);
    }
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

  const togglePause = () => {
    const updateState = {};

    if(state.screen === 'pause') {
      updateState.screen = state.screenData.prevScreen;
      updateState.screenData = state.screenData.prevScreenData;
    } else {


      const screenData = {
        prevScreen: state.screen,
        prevScreenData: state.screenData
      };

      updateState.screen = 'pause';
      updateState.screenData = screenData;
    }

    socket.emit('update-state', updateState);
  };
</script>

<div class="game-control">
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
  {/if}
</div>