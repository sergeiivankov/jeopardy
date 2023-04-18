<script>
  import { onDestroy, createEventDispatcher } from 'svelte';
  import { token } from '../common/auth.js';
  import { data } from '../common/data.js';
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

    <div class="game-main">
      <table class="table is-bordered is-fullwidth">
        <tbody>
          {#each Object.entries(state.availableQuestions[state.round]) as [subjectId, availableQuestions]}
            <tr style="height:50px">
              <td style="vertical-align:middle">{ state.subjectsNames[subjectId] }</td>
              {#each availableQuestions as isAvailable, index}
                <td class="has-text-weight-bold has-text-centered" style="vertical-align:middle">
                  {#if isAvailable === 1}
                    { data.ROUND_PRICES[state.round][index] }
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if state.screen === 'pause'}
      <div class="game" style="display:flex;justify-content:center;align-items:center;display:none">
        Игра на паузе
      </div>
    {/if}
  {/if}
</div>