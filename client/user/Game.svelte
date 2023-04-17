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
    dispatch('close');
    if(reason !== 'io server disconnect') {
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
</script>

<div class="game is-player">
  {#if state !== null}
    <div class="scores">
      {#each Object.entries(state.players) as [userId, userName]}
        <div class="scores-item"
             class:scores-item-active={ state.activePlayer == userId }>
          <div class="scores-name">{ userName }</div>
          <div class="scores-value">{ state.scores[userId] }</div>
        </div>
      {/each}
    </div>

    {#if state.screen === 'pause'}
      <div class="game" style="display:flex;justify-content:center;align-items:center;display:none">
        Игра на паузе
      </div>
    {/if}
  {/if}
</div>