<script>
  import { onDestroy } from 'svelte';
  import { token } from '../common/auth.js';

  export let game = {};
  let state = null;

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
</script>

<div class="game">
  { game.name }
</div>