<script>
  import { afterUpdate, onDestroy, createEventDispatcher } from 'svelte';
  import { token } from '../common/auth.js';
  import { data } from '../common/data.js';
  import { applyFlat } from '../common/helpers.js';

  export let game = {};
  let state = null;

  let questionFile = null;
  let mediaQuestion = null;
  let needPlayAction = false;

  const isIOS = [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);

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

  socket.on('update-state', async updatedState => {
    state = applyFlat(state, updatedState);

    if(
      (state.screen === 'prequestion' || state.screen === 'question') &&
      state.screenData.question_type !== 0
    ) {
      if(questionFile !== null && questionFile.file === state.screenData.question_file) {
        if(state.screenData.loaded[data.userId] === 0) socket.emit('question-load');
        return;
      }

      questionFile = {
        type: state.screenData.question_type,
        file: state.screenData.question_file
      };

      const response = await fetch(
        '/storage/' + questionFile.file + '.' + data.QUESTIONS_TYPES_EXTENSIONS[questionFile.type]
      );

      questionFile.content = URL.createObjectURL(await response.blob());

      socket.emit('question-load');
      questionFile = { ...questionFile };
    }
  });

  socket.connect();

  onDestroy(() => {
    socket.off('disconnect', onDisconnect);
    socket.close();
  });

  afterUpdate(() => {
    if(!mediaQuestion) return;

    if(state.screenData.answerPlayerId === 0) {
      mediaQuestion.play();
      if(mediaQuestion.paused) needPlayAction = true;
    } else {
      mediaQuestion.pause();
    }
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
      {#if state.screen === 'table'}
        <div class="title is-4 has-text-centered">{ data.ROUND_NAMES[state.round] }</div>
        <table class="table is-bordered is-fullwidth mb-0">
          <tbody>
            {#each Object.entries(state.availableQuestions[state.round]) as [subjectId, availableQuestions]}
              <tr style="height:44px">
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
        <div></div>
      {/if}

      {#if state.screen === 'question'}
        <div class="title is-4 has-text-centered">
          За { data.ROUND_PRICES[state.round][state.screenData.index] }
        </div>
        {#if state.screenData.question_type === 0}
          <div class="title is-5 has-text-centered">
            { state.screenData.question }
          </div>
        {:else}
          {#if questionFile.content && state.isPause === false}
            <div class="field has-text-centered">
              {#if state.screenData.question_type === 1}
                <img src={ questionFile.content } style="max-height:310px">
              {/if}
              {#if state.screenData.question_type === 2}
                {#if isIOS && needPlayAction}
                  <button class="button is-success is-medium" style="position:absolute;bottom:0;right:0"
                          on:click={ () => { mediaQuestion.play(); needPlayAction = false; } }>Запустить</button>
                {/if}
                <audio loop src={ questionFile.content } bind:this={ mediaQuestion }></audio>
              {/if}
              {#if state.screenData.question_type === 3}
                {#if isIOS}
                  <button class="button is-success is-medium" style="position:absolute;bottom:0;right:0"
                          on:click={ () => mediaQuestion.play() }>Запустить</button>
                {/if}
                <video loop src={ questionFile.content } bind:this={ mediaQuestion } playsinline></video>
              {/if}
            </div>
            {#if isIOS}
              <div></div>
            {/if}
          {/if}
        {/if}
        <div></div>
      {/if}

      {#if state.screen === 'prequestion'}
        <div class="title is-4 has-text-centered">
          За { data.ROUND_PRICES[state.round][state.screenData.index] }
        </div>
        <div class="title is-5 has-text-centered">
          { state.screenData.question }
        </div>
        <div></div>
      {/if}

      {#if state.screen === 'answer'}
        <div class="title is-4 has-text-centered">
          За { data.ROUND_PRICES[state.round][state.screenData.index] }
        </div>
        <div class="title is-5 has-text-centered">
          Ответ: { state.screenData.answer }
        </div>
        <div></div>
      {/if}
    </div>

    {#if state.screen === 'question' && state.screenData.time > 0}
      <div class="game-info">
        <progress class="progress is-info mb-2" value={ state.screenData.time } max={ state.screenData.initTime }></progress>
        {#if state.screenData.answerPlayerId !== 0}
          <div class="is-size-5 has-text-centered">
            Отвечает { state.players[state.screenData.answerPlayerId] }
          </div>
        {:else}
          {#if state.screenData.banned[data.userId] === 0}
            <button class="button is-large is-info is-fullwidth"
                    on:click={ () => socket.emit('answer') }>
              Ответить
            </button>
          {/if}
        {/if}
      </div>
    {/if}

    {#if state.screen === 'answer'}
      <div class="game-info has-text-centered is-size-5">
        {#if state.screenData.playerId === 0}
          Никто не ответил
        {:else}
          { state.players[state.screenData.playerId] }
          +{ state.screenData.result }
        {/if}
      </div>
    {/if}

    {#if state.isPause}
      <div class="game" style="display:flex;justify-content:center;align-items:center">
        Игра на паузе
      </div>
    {/if}
  {/if}
</div>