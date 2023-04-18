<script>
  import { onDestroy, createEventDispatcher } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import { token } from '../common/auth.js';
  import { data } from '../common/data.js';
  import { applyFlat } from '../common/helpers.js';
  import { get } from '../common/request.js';

  export let game = {};
  let subjectsQuestions = null;
  let state = null;
  let editPlayer = null;

  let inputScore;

  const dispatch = createEventDispatcher();

  const load = async () => {
    const fullGame = await get('/games/' + game.id);
    if(!fullGame) return;

    subjectsQuestions = {};
    fullGame.questions.forEach(question => {
      if(!subjectsQuestions[question.subject_id]) subjectsQuestions[question.subject_id] = [];
      subjectsQuestions[question.subject_id].push(question);
    });
    subjectsQuestions = {...subjectsQuestions};

    console.log(subjectsQuestions);
  };

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

    console.log(state);
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

  const setQuestionState = (subjectId, index, value) => {
    if(!confirm(value ? 'Точно вернуть вопрос?' : 'Точно убрать вопрос?')) return;

    const availableQuestions = [...state.availableQuestions];
    availableQuestions[state.round][subjectId][index] = value;

    updateState({ availableQuestions: availableQuestions });
  };

  load();
</script>

<div class="game">
  {#if state !== null && subjectsQuestions !== null}
    <div class="level">
      <div class="level-left">
        <div class="title mb-0 mr-5">{ game.name } - { data.ROUND_NAMES[state.round] }</div>
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
    <table class="table is-bordered is-hoverable is-fullwidth">
      <tbody>
        {#each Object.entries(state.availableQuestions[state.round]) as [subjectId, availableQuestions]}
          <tr style="height:60px">
            <td style="vertical-align:middle">{ state.subjectsNames[subjectId] }</td>
            {#each availableQuestions as isAvailable, index}
              <td style="vertical-align:middle;text-align:center">
                {#if isAvailable === 1}
                  <a href="#" class="link has-text-danger is-size-7 mr-4 is-inline-block"
                     style="width:46px"
                     on:click={ () => setQuestionState(subjectId, index, 0) }>
                    Убрать
                  </a>
                  <span class="has-text-weight-bold mr-4">
                    { data.ROUND_PRICES[state.round][index] }
                  </span>
                  <a href="#" class="link has-text-info">Выбрать</a>
                {:else}
                  <a href="#" class="link has-text-danger is-size-7 mr-4 is-inline-block"
                     style="width:46px"
                     on:click={ () => setQuestionState(subjectId, index, 1) }>
                    Вернуть
                  </a>
                  <span class="has-text-weight-bold mr-4">
                    { data.ROUND_PRICES[state.round][index] }
                  </span>
                  <a href="#" style="opacity:0" on:click|preventDefault>Выбрать</a>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
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