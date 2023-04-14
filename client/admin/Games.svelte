<script>
  import { onMount } from 'svelte';

  import { get, post, put, del } from '../common/request.js';

  let editGame = null;
  let games = [];

  const load = async () => {
    games = await get('/games');
  };

  const save = async () => {
    if(editGame.id) await put('/games', editGame);
    else await post('/games', editGame);

    editGame = null;

    load();
  };

  const deleteGame = async id => {
    if(!confirm('Точно удалить игру и все вопросы?')) return;

    await del('/games/' + id);

    load();
  };

  onMount(() => {
    load();
  });
</script>

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
          <td class:has-text-success={ game.announced === 1 }>
            { game.announced === 1 ? 'Анонсирована' : 'Не анонсирована' }
          </td>
          <td class="is-narrow">
            <a href="#" class="link has-text-info"
               on:click|preventDefault={ () => editGame = { ...game } }>Изменить</a>
            &nbsp;
            <a href="#" class="link has-text-info"
               on:click|preventDefault={ () => editGame = { ...game } }>Редактировать вопросы</a>
            &nbsp;
            <a href="#" class="link has-text-danger"
               on:click|preventDefault={ () => deleteGame(game.id) }>Удалить</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

{#if editGame !== null}
  <div class="modal is-active">
    <div class="modal-background" on:click={ () => editGame = null }></div>
    <div class="modal-card">
      <div class="modal-card-head">
        <div class="modal-card-title">
          { editGame.id ? 'Редактирование игры' : 'Создание игры' }
        </div>
        <button class="delete" on:click={ () => editGame = null }></button>
      </div>
      <div class="modal-card-body">
        <div class="field">
          <input type="text" class="input" placeholder="Название" autocomplete="off"
                 bind:value={ editGame.name }>
        </div>
      </div>
      <div class="modal-card-foot">
        <button class="button is-info" on:click={ save }>
          { editGame.id ? 'Сохранить' : 'Создать' }
        </button>
      </div>
    </div>
  </div>
{/if}