<script>
  import { onMount } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import { data } from '../common/data.js';
  import { get, post, put, del } from '../common/request.js';

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
  let editSubject = null;

  const load = async () => {
    game = await get('/games/' + id);
    if(!game) return;

    const subjects = game.subjects.sort((a, b) => {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    });

    for(let i = 0; i < 7; i++) roundSubjects[i] = subjects.filter(s => s.round === i);
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
  {#each rounds as roundName, roundIndex}
    <hr>
    <div class="level">
      <div class="level-left">
        <div class="title is-4">{ roundName }</div>
      </div>
      <div class="level-right">
        {#if roundSubjects[roundIndex].length < data.MAX_ROUND_SUBJECTS_COUNT[roundIndex]}
          <button class="button is-small mr-5"
                  on:click={ () => editSubject = { round: roundIndex } }>Добавить тему</button>
        {/if}
        <span class="title is-4"
              class:has-text-danger-dark={ roundSubjects[roundIndex].length < data.REQUIRED_ROUND_SUBJECTS_COUNT[roundIndex] }
              class:has-text-success-dark={ roundSubjects[roundIndex].length >= data.REQUIRED_ROUND_SUBJECTS_COUNT[roundIndex] }>
          { roundSubjects[roundIndex].length }/{ data.MAX_ROUND_SUBJECTS_COUNT[roundIndex] }
        </span>
      </div>
    </div>
    {#each roundSubjects[roundIndex] as subject}
      <div class="level">
        <div class="level-left">
          <div class="title is-5">{ subject.name }</div>
        </div>
        <div class="level-right">
          <a href="#" class="link has-text-info mr-3"
             on:click|preventDefault={ () => editSubject = { ...subject } }>Изменить</a>
          <a href="#" class="link has-text-danger"
            on:click|preventDefault={ () => deleteSubject(subject.id) }>Удалить</a>
        </div>
      </div>
      {#each data.ROUND_PRICES[roundIndex] as price, priceIndex}
        <div class="box">
          <div class="columns">
            <div class="column">
              { price === 0 ? 'Ставки' : `За ${price}` }
            </div>
          </div>
        </div>
      {/each}
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
    </div>
    <div slot="footer">
      <button class="button is-info" on:click={ saveSubject }>
        { editSubject.id ? 'Сохранить' : 'Создать' }
      </button>
    </div>
  </Modal>
{/if}