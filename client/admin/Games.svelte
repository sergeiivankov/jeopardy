<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import { get, post, put, del } from '../common/request.js';

  const dispatch = createEventDispatcher();

  let editGame = null;
  let games = null;

  const load = async () => {
    games = await get('/games');
    if(!games) return;

    games = games.sort((a, b) => {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    });
  };

  const save = async () => {
    let requestFn;
    if(editGame.id) requestFn = put;
    else requestFn = post;

    const result = await requestFn('/games', editGame);
    if(result === null) return;

    editGame = null;

    load();
  };

  const deleteGame = async id => {
    if(!confirm('Точно удалить игру и все ее темы и вопросы?')) return;

    await del('/games/' + id);

    load();
  };

  onMount(() => {
    load();
  });
</script>

{#if games !== null}
  <div class="block">
    <button class="button is-info" on:click={ () => editGame = {} }>Добавить игру</button>
  </div>
  {#if games.length === 0}
    <div class="has-text-centered">
      У вас нет созданных игр
    </div>
  {:else}
    <table class="table is-bordered is-striped is-hoverable is-fullwidth">
      <tbody>
        {#each games as game}
          <tr>
            <td>{ game.name }</td>
            <td class="is-narrow" class:has-text-success={ game.announced === 1 }>
              { game.announced === 1 ? 'Анонсирована' : 'Не анонсирована' }
            </td>
            <td class="is-narrow">
              <a href="#" class="link has-text-info mr-2"
                on:click|preventDefault={ () => editGame = { ...game } }>Изменить</a>
              <a href="#" class="link has-text-info mr-2"
                on:click|preventDefault={ () => dispatch('edit', game.id) }>
                Редактировать вопросы
              </a>
              <a href="#" class="link has-text-danger"
                on:click|preventDefault={ () => deleteGame(game.id) }>Удалить</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}

{#if editGame !== null}
  <Modal title={ editGame.id ? 'Редактирование игры' : 'Создание игры' }
         on:close={ () => editGame = null }>
    <div slot="body">
      <div class="field">
        <input type="text" class="input" placeholder="Название" autocomplete="off"
               bind:value={ editGame.name }>
      </div>
    </div>
    <div slot="footer">
      <button class="button is-info" on:click={ save }>
        { editGame.id ? 'Сохранить' : 'Создать' }
      </button>
    </div>
  </Modal>
{/if}