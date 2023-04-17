<script>
  import { onMount } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import { data } from '../common/data.js';
  import { get, post, put, del, putMultipart } from '../common/request.js';

  export let id;

  const rounds = [
    'Раунд 1',
    'Раунд 2',
    'Раунд 3',
    'Финал',
    'Перестрелка 1',
    'Перестрелка 2',
    'Перестрелка 3'
  ];

  let game = null;
  let roundSubjects = [];
  let subjectsQuestions = {};
  let editSubject = null;
  let editQuestion = null;

  let questionFileInput = null;

  const load = async () => {
    game = await get('/games/' + id);
    if(!game) return;

    const subjects = game.subjects.sort((a, b) => {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    });

    for(let i = 0; i < 7; i++) roundSubjects[i] = subjects.filter(s => s.round === i);
    roundSubjects = [...roundSubjects];

    subjectsQuestions = {};
    game.questions.forEach(question => {
      if(!subjectsQuestions[question.subject_id]) subjectsQuestions[question.subject_id] = [];
      subjectsQuestions[question.subject_id].push(question);
    });
    subjectsQuestions = {...subjectsQuestions};
  };

  const saveSubject = async () => {
    let requestFn;
    if(editSubject.id) requestFn = put;
    else requestFn = post;

    const result = await requestFn('/subjects/' + id, editSubject);
    if(result === null) return;

    editSubject = null;

    load();
  };

  const openEditQuestion = (subjectId, priceIndex) => {
    const question = subjectsQuestions[subjectId][priceIndex];

    if(question.question_type === null) {
      editQuestion = { subject_id: subjectId, index: priceIndex };
    } else {
      editQuestion = {
        ...question,
        question_type: String(question.question_type)
      }
    }
  };

  const saveQuestion = async () => {
    const body = new FormData();
    body.append('subject_id', editQuestion.subject_id);
    body.append('index', editQuestion.index);
    body.append('comment', editQuestion.comment || '');
    body.append('question', editQuestion.question || '');
    body.append('answer', editQuestion.answer || '');

    body.append('question_type', editQuestion.question_type);

    if(editQuestion.question_type !== '0' && questionFileInput.files.length) {
      body.append('question_file', questionFileInput.files[0]);
    }

    const result = await putMultipart(`/questions/${id}`, body);
    if(result === null) return;

    editQuestion = null;

    load();
  };

  const deleteSubject = async subjectId => {
    if(!confirm('Точно удалить тему и все ее вопросы?')) return;

    await del(`/subjects/${id}/${subjectId}`);

    load();
  };

  onMount(() => {
    load();
  });
</script>

{#if game !== null}
  <div class="block has-text-centered">
    <div class="title">{ game.name }</div>
  </div>
  {#each data.ROUND_NAMES as roundName, roundIndex}
    <hr>
    <div class="level mb-5">
      <div class="level-left">
        <div class="title is-4">{ roundName }</div>
      </div>
      <div class="level-right">
        {#if roundSubjects[roundIndex].length < data.MAX_ROUND_SUBJECTS_COUNT[roundIndex]}
          <button class="button is-small mr-5"
                  class:is-warning={ roundSubjects[roundIndex].length < data.REQUIRED_ROUND_SUBJECTS_COUNT[roundIndex] }
                  on:click={ () => editSubject = { round: roundIndex } }>Добавить тему</button>
        {/if}
        <span class="title is-4"
              class:has-text-warning-dark={ roundSubjects[roundIndex].length < data.REQUIRED_ROUND_SUBJECTS_COUNT[roundIndex] }
              class:has-text-success-dark={ roundSubjects[roundIndex].length >= data.REQUIRED_ROUND_SUBJECTS_COUNT[roundIndex] }>
          { roundSubjects[roundIndex].length }/{ data.MAX_ROUND_SUBJECTS_COUNT[roundIndex] }
        </span>
      </div>
    </div>
    {#each roundSubjects[roundIndex] as subject}
      <div class="ml-5">
        <div class="level">
          <div class="level-left">
            <div class="title is-5 mr-3 mb-0">{ subject.name }</div>
            <a href="#" class="link has-text-info mr-3"
               on:click|preventDefault={ () => editSubject = { ...subject } }>Изменить</a>
            <a href="#" class="link has-text-danger"
               on:click|preventDefault={ () => deleteSubject(subject.id) }>Удалить</a>
          </div>
          <div class="level-right">
            <span class="title is-5"
                  class:has-text-warning-dark={ subjectsQuestions[subject.id].filter(q => q.question_type !== null).length < data.ROUND_PRICES[roundIndex].length }
                  class:has-text-success-dark={ subjectsQuestions[subject.id].filter(q => q.question_type !== null).length === data.ROUND_PRICES[roundIndex].length }>
              { subjectsQuestions[subject.id].filter(q => q.question_type !== null).length }/{ data.ROUND_PRICES[roundIndex].length }
            </span>
          </div>
        </div>
        {#each data.ROUND_PRICES[roundIndex] as price, priceIndex}
          <div class="box">
            <div class="columns is-multiline">
              <div class="column is-2">
                { price === 0 ? 'Ставки' : `За ${price}` }
                <br>
                <a href="#" class="link"
                   class:has-text-warning-dark={ subjectsQuestions[subject.id][priceIndex].question_type === null }
                   class:has-text-info={ subjectsQuestions[subject.id][priceIndex].question_type !== null }
                   on:click|preventDefault={ () => openEditQuestion(subject.id, priceIndex) }>
                  Изменить
                </a>
              </div>
              <div class="column is-5">
                <b>Вопрос:</b><br>
                {#if subjectsQuestions[subject.id][priceIndex].question_type === null}
                  Не указан
                {:else}
                  {#if subjectsQuestions[subject.id][priceIndex].question_type === 0}
                    { subjectsQuestions[subject.id][priceIndex].question }
                  {/if}
                  {#if subjectsQuestions[subject.id][priceIndex].question_type === 1}
                    <img src="/storage/{ subjectsQuestions[subject.id][priceIndex].question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[subjectsQuestions[subject.id][priceIndex].question_type] }" class="mt-2">
                  {/if}
                  {#if subjectsQuestions[subject.id][priceIndex].question_type === 2}
                    <audio controls preload="none" class="mt-2" style="width:100%"
                           src="/storage/{ subjectsQuestions[subject.id][priceIndex].question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[subjectsQuestions[subject.id][priceIndex].question_type] }">
                    </audio>
                  {/if}
                  {#if subjectsQuestions[subject.id][priceIndex].question_type === 3}
                    <video controls preload="none" class="mt-2" style="width:100%"
                           src="/storage/{ subjectsQuestions[subject.id][priceIndex].question_file }.{ data.QUESTIONS_TYPES_EXTENSIONS[subjectsQuestions[subject.id][priceIndex].question_type] }">
                    </video>
                  {/if}
                {/if}
              </div>
              <div class="column is-5">
                <b>Ответ:</b><br>
                { subjectsQuestions[subject.id][priceIndex].answer || 'Не указан' }
              </div>
              {#if subjectsQuestions[subject.id][priceIndex].comment}
                <div class="column is-10 is-offset-2 has-text-grey-light pt-0">
                  <b>Комментарий:</b> { subjectsQuestions[subject.id][priceIndex].comment }
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  {/each}
{/if}

{#if editSubject !== null}
  <Modal title={ editSubject.id ? 'Редактирование темы' : 'Создание темы' }
         on:close={ () => editSubject = null }>
    <div slot="body">
      <div class="field">
        <input type="text" class="input" placeholder="Название" autocomplete="off"
               bind:value={ editSubject.name }>
      </div>
      {#if editSubject.id}
        <div class="field">
          <div class="select is-fullwidth">
            <select bind:value={ editSubject.round }>
              {#each data.ROUND_NAMES as roundName, roundIndex}
                <option value={ roundIndex }>{ roundName }</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}
    </div>
    <div slot="footer">
      <button class="button is-info" on:click={ saveSubject }>
        { editSubject.id ? 'Сохранить' : 'Создать' }
      </button>
    </div>
  </Modal>
{/if}

{#if editQuestion !== null}
  <Modal title="Редактирование вопроса" on:close={ () => editQuestion = null }>
    <div slot="body">
      <div class="field">
        <input type="text" class="input" placeholder="Вопрос" autocomplete="off"
               bind:value={ editQuestion.question }>
      </div>
      <div class="field">
        <div class="select is-fullwidth">
          <select bind:value={ editQuestion.question_type }>
            <option value="0">Только текстовый вопрос</option>
            <option value="1">С изображением</option>
            <option value="2">С аудио</option>
            <option value="3">С видео</option>
          </select>
        </div>
      </div>
      {#if editQuestion.question_type !== '0'}
        <div class="field">
          <div class="file has-name is-fullwidth">
            <label class="file-label">
              <input class="file-input" type="file" bind:this={ questionFileInput }
                      on:change={ e => editQuestion.questionFileName = e.target.files[0].name }
                      accept=".{ data.QUESTIONS_TYPES_EXTENSIONS[editQuestion.question_type] }">
              <div class="file-cta">
                <div class="file-label">Выбрать файл</div>
              </div>
              <div class="file-name">{ editQuestion.questionFileName || 'Файл не выбран' }</div>
            </label>
          </div>
        </div>
      {/if}
      <div class="field">
        <input type="text" class="input" placeholder="Ответ" autocomplete="off"
               bind:value={ editQuestion.answer }>
      </div>
      <div class="field">
        <input type="text" class="input" placeholder="Комментарий" autocomplete="off"
               bind:value={ editQuestion.comment }>
      </div>
    </div>
    <div slot="footer">
      <button class="button is-info" on:click={ saveQuestion }>Сохранить</button>
    </div>
  </Modal>
{/if}