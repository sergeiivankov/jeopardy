<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import { token } from '../common/auth.js';
  import { data } from '../common/data.js';
  import { applyFlat } from '../common/helpers.js';
  import { get } from '../common/request.js';

  export let game = {};
  let subjectsQuestions = null;
  let state = null;
  let editPlayer = null;
  let displayQuestion = null;

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

    if(
      state.screen === 'question' &&
      (
        state.screenData.time === 0 ||
        Object.values(state.screenData.banned).find(b => b === 0) === undefined
      )
    ) {
      updateState({ screen: 'answer', screenData: {
        answer: subjectsQuestions[state.screenData.subjectId][state.screenData.index].answer,
        subjectId: state.screenData.subjectId,
        index: state.screenData.index,
        playerId: 0,
        result: 0
      } });
    }
  });

  socket.connect();

  onMount(() => {
    document.documentElement.style.overflow = 'hidden';
  });

  onDestroy(() => {
    document.documentElement.style.overflow = null;
    socket.off('disconnect', onDisconnect);
    socket.close();
  });

  const updateState = updatedState => {
    socket.emit('update-state', updatedState);
  };

  const addLog = log => {
    socket.emit('add-log', log);
    state.log = [log, ...state.log];
  };

  const setActivePlayer = () => {
    addLog(`Активный игрок: ${state.players[state.activePlayer]} -> ${state.players[editPlayer]}`);
    updateState({ activePlayer: editPlayer });
    editPlayer = null;
  };

  const changeScore = sign => {
    let value = parseInt(inputScore.value, 10);
    if(value < 1) return alert('В поле должно быть положительное число');
    value = value * sign;

    const newScore = state.scores[editPlayer] + value;

    addLog(
      `Изменение счета ${state.players[editPlayer]}: ${state.scores[editPlayer]} -> ${newScore}`
    );
    updateState({ ['scores.' + editPlayer]: newScore });
    editPlayer = null;
  };

  const setQuestionState = (subjectId, index, value) => {
    if(!confirm(value ? 'Точно вернуть вопрос?' : 'Точно убрать вопрос?')) return;

    if(value) {
      addLog(
        `Добавлен вопрос: ${state.subjectsNames[subjectId]} за ${data.ROUND_PRICES[state.round][index]}`
      );
    } else {
      addLog(
        `Удален вопрос: ${state.subjectsNames[subjectId]} за ${data.ROUND_PRICES[state.round][index]}`
      );
    }

    const availableQuestions = [...state.availableQuestions];
    availableQuestions[state.round][subjectId][index] = value;

    updateState({ availableQuestions: availableQuestions });
  };

  const showQuestion = (subjectId, index) => {
    displayQuestion = subjectsQuestions[subjectId][index];
  };

  const closeAnswer = () => {
    addLog(
      `Удален вопрос: ${state.subjectsNames[state.screenData.subjectId]} за ${data.ROUND_PRICES[state.round][state.screenData.index]}`
    );

    const availableQuestions = [...state.availableQuestions];
    availableQuestions[state.round][state.screenData.subjectId][state.screenData.index] = 0;

    updateState({ screen: 'table', screenData: {}, availableQuestions: availableQuestions });
  };

  const closeQuestion = () => {
    addLog(
      `Закрыт вопрос: ${state.subjectsNames[state.screenData.subjectId]} за ${data.ROUND_PRICES[state.round][state.screenData.index]}`
    );

    updateState({ screen: 'table', screenData: {} });
  };

  const selectQuestion = (subjectId, index) => {
    addLog(
      `Выбран вопрос: ${state.subjectsNames[subjectId]} за ${data.ROUND_PRICES[state.round][index]}`
    );

    const question = subjectsQuestions[subjectId][index];

    const banned = {};
    Object.keys(state.players).forEach(id => {
      banned[id] = 0;
    });

    if(question.question_type === 0) {
      updateState({
        screen: 'question',
        screenData: {
          subjectId: subjectId,
          index: index,
          question: question.question,
          question_type: question.question_type,
          time: 30,
          initTime: 30,
          answerPlayerId: 0,
          banned: banned
        }
      });
    } else {
      const loaded = {};
      Object.keys(state.players).forEach(id => {
        loaded[id] = 0;
      });

      updateState({
        screen: 'prequestion',
        screenData: {
          subjectId: subjectId,
          index: index,
          question: question.question,
          question_type: question.question_type,
          question_file: question.question_file,
          time: 30,
          initTime: 30,
          answerPlayerId: 0,
          banned: banned,
          loaded: loaded
        }
      });
    }
  };

  const correctAnswer = () => {
    const playerId = state.screenData.answerPlayerId;

    const updatedState = {};

    const price = data.ROUND_PRICES[state.round][state.screenData.index];
    updatedState['scores.' + playerId] = state.scores[playerId] + price;

    updatedState.activePlayer = playerId;

    updatedState.screen = 'answer';
    updatedState.screenData = {
      answer: subjectsQuestions[state.screenData.subjectId][state.screenData.index].answer,
      subjectId: state.screenData.subjectId,
      index: state.screenData.index,
      playerId: playerId,
      result: price
    };

    addLog(`Верный ответ: ${state.players[playerId]} +${price}`);

    updateState(updatedState);
  };

  const incorrectAnswer = () => {
    const playerId = state.screenData.answerPlayerId;

    const updatedState = {};

    const price = data.ROUND_PRICES[state.round][state.screenData.index];
    updatedState['scores.' + playerId] = state.scores[playerId] - price;

    updatedState['screenData.banned.' + playerId] = 1;

    updatedState['screenData.answerPlayerId'] = 0;

    addLog(`Неверный ответ: ${state.players[playerId]} -${price}`);

    updateState(updatedState);
  };

  load();
</script>

<div class="game">
  {#if state !== null && subjectsQuestions !== null}
    <div class="level">
      <div class="level-left">
        <div class="title mb-0 mr-5">{ game.name } - { data.ROUND_NAMES[state.round] }</div>
        {#if state.round > 0}
          <button class="button mr-5"
                  on:click={ () => updateState({ round: state.round - 1 }) }>
            Предыдущий раунд
          </button>
        {/if}
        {#if Object.keys(state.availableQuestions[state.round + 1] || {}).length}
          <button class="button mr-5"
                  on:click={ () => updateState({ round: state.round + 1 }) }>
            Следующий раунд
          </button>
        {/if}
      </div>
      <div class="level-right">
        <button class="button mr-5"
                class:is-warning={ state.isPause }
                on:click={ () => updateState({ isPause: !state.isPause }) }>
          { state.isPause ? 'Игра на паузе!' : 'На паузу' }
        </button>
        <button class="button is-danger" on:click={ () => dispatch('close') }>Закрыть</button>
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

    {#if state.screen === 'answer'}
      <div class="box">
        <div class="level">
          <div class="level-left">
            <div class="title is-4">Отображение ответа игрокам</div>
          </div>
          <div class="level-right">
            <button class="button" on:click={ closeAnswer }>Закрыть</button>
          </div>
        </div>
        <div class="field">
          <b>Ответ:</b><br>
          { subjectsQuestions[state.screenData.subjectId][state.screenData.index].answer }
        </div>
        {#if state.screenData.playerId !== 0}
          <div class="field">
            <b>Результат:</b><br>
            { state.players[state.screenData.playerId] }
            +{ state.screenData.result }
          </div>
        {/if}
      </div>
    {/if}

    {#if state.screen === 'question' || state.screen === 'prequestion'}
      <div class="box">
        <div class="level">
          <div class="level-left">
            {#if state.screenData.answerPlayerId !== 0}
              <div class="title is-5 mb-0 mr-3">
                Отвечает { state.players[state.screenData.answerPlayerId] }
              </div>
              <button class="button is-success mr-3"
                      on:click={ correctAnswer }>
                Верно
              </button>
              <button class="button is-danger"
                      on:click={ incorrectAnswer }>
                Не верно
              </button>
            {/if}

            {#if state.screen === 'prequestion'}
              <button class="button is-info"
                      disabled={ Object.values(state.screenData.loaded).find(l => l === 0) !== undefined }
                      on:click={ () => updateState({ screen: 'question' }) }>
                Показать файл игрокам
              </button>
            {/if}
          </div>
          <div class="level-right">
            <button class="button" on:click={ closeQuestion }>Закрыть</button>
          </div>
        </div>
        {#if state.screen === 'question'}
          <progress class="progress is-info" value={ state.screenData.time } max={ state.screenData.initTime }></progress>
        {/if}
        {#if state.screenData.question_type !== 0}
          <div class="field">
            <label class="label">Файл загружен:</label>
            <div class="control">
              {#each Object.entries(state.screenData.loaded) as [userId, isLoaded]}
                <span class="mr-3"
                      class:has-text-danger={ !isLoaded }
                      class:has-text-success-dark={ isLoaded }>
                  { state.players[userId] }
                </span>
              {/each}
            </div>
          </div>
        {/if}
        <div class="field">
          <b>Вопрос:</b><br>
          { state.screenData.question }
        </div>
        <div class="field">
          <b>Ответ:</b><br>
          { subjectsQuestions[state.screenData.subjectId][state.screenData.index].answer }
        </div>
        {#if subjectsQuestions[state.screenData.subjectId][state.screenData.index].comment}
          <div class="field">
            <b>Комментарий:</b><br>
            { subjectsQuestions[state.screenData.subjectId][state.screenData.index].comment }
          </div>
        {/if}
        {#if state.screenData.question_type !== 0}
          <div class="field">
            {#if state.screenData.question_type === 1}
              <img src="/storage/{ state.screenData.question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[state.screenData.question_type] }" style="width:640px">
            {/if}
            {#if state.screenData.question_type === 2}
              <audio controls preload="none" style="width:640px"
                      src="/storage/{ state.screenData.question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[state.screenData.question_type] }">
              </audio>
            {/if}
            {#if state.screenData.question_type === 3}
              <video controls preload="none" class="mt-2" style="width:640px"
                      src="/storage/{ state.screenData.question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[state.screenData.question_type] }">
              </video>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    {#if state.screen === 'table'}
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
                      on:click|preventDefault={ () => setQuestionState(subjectId, index, 0) }>
                      Убрать
                    </a>
                    <a href="#" class="is-size-5 has-text-weight-bold mr-4"
                      on:click|preventDefault={ () => showQuestion(subjectId, index) }>
                      { data.ROUND_PRICES[state.round][index] }
                    </a>
                    <a href="#" class="link has-text-info"
                      on:click|preventDefault={ () => selectQuestion(subjectId, index) }>
                      Выбрать
                    </a>
                  {:else}
                    <a href="#" class="link has-text-danger is-size-7 mr-4 is-inline-block"
                      style="width:46px"
                      on:click|preventDefault={ () => setQuestionState(subjectId, index, 1) }>
                      Вернуть
                    </a>
                    <a href="#" class="is-size-5 has-text-weight-bold mr-4"
                      on:click|preventDefault={ () => showQuestion(subjectId, index) }>
                      { data.ROUND_PRICES[state.round][index] }
                    </a>
                    <a href="#" style="opacity:0" on:click|preventDefault>Выбрать</a>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

    <div class="block">
      {#each state.log as log}
        { log }<br>
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

  {#if displayQuestion !== null}
    <Modal title="Отображение вопроса" on:close={ () => displayQuestion = null }>
      <div slot="body">
        <div class="field">
          <b>Вопрос:</b><br>
          { displayQuestion.question }
        </div>
        <div class="field">
          {#if displayQuestion.question_type === 1}
            <img src="/storage/{ displayQuestion.question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[displayQuestion.question_type] }">
          {/if}
          {#if displayQuestion.question_type === 2}
            <audio controls preload="none" style="width:100%"
                    src="/storage/{ displayQuestion.question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[displayQuestion.question_type] }">
            </audio>
          {/if}
          {#if displayQuestion.question_type === 3}
            <video controls preload="none" class="mt-2" style="width:100%"
                    src="/storage/{ displayQuestion.question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[displayQuestion.question_type] }">
            </video>
          {/if}
        </div>
        <div class="field">
          <b>Ответ:</b><br>
          { displayQuestion.answer }
        </div>
      </div>
      <div slot="footer">
        <button class="button" on:click={ () => displayQuestion = null }>
          Закрыть
        </button>
      </div>
    </Modal>
  {/if}
</div>