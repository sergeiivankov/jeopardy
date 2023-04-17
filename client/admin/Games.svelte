<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import { data } from '../common/data.js';
  import { get, post, put, del } from '../common/request.js';

  const dispatch = createEventDispatcher();

  let games = null;
  let editGame = null;
  let editUsers = null;

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

  const toggleAnnounced = async id => {
    await put(`/games/${id}/announced`);
    load();
  };

  const openChangeUsers = game => {
    editUsers = {
      id: game.id,
      users: game.users.split(',').filter(id => id !== '').map(id => parseInt(id, 10))
    };
  };

  const saveUsers = async () => {
    await put(`/games/${editUsers.id}/users`, { users: editUsers.users });
    editUsers = null;
    load();
  };

  const addUser = e => {
    const id = e.target.value;
    if(id === '') return;

    editUsers.users = [ ...editUsers.users, parseInt(id, 10) ];

    e.target.value = '';
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
            <td class="is-narrow">
              {#if game.announced === 1}
                <a href="#" class="link has-text-success mr-2"
                   on:click|preventDefault={ () => dispatch('control', game) }>
                  Управление игрой
                </a>
              {/if}
              <a href="#" class="link has-text-info"
                 on:click|preventDefault={ () => toggleAnnounced(game.id) }>
                { game.announced === 1 ? 'Деанонсировать' : 'Анонсировать' }
              </a>
            </td>
            <td class="is-narrow">
              <a href="#" class="link has-text-info"
                 class:disabled={ game.announced === 1 }
                 on:click|preventDefault={ () => { if(game.announced === 0) openChangeUsers(game); } }>
                Игроки
              </a>
            </td>
            <td class="is-narrow">
              <a href="#" class="link has-text-info"
                 class:disabled={ game.announced === 1 }
                 on:click|preventDefault={ () => { if(game.announced === 0) dispatch('edit', game.id); } }>
                Редактировать вопросы
              </a>
            </td>
            <td class="is-narrow">
              <a href="#" class="link has-text-info mr-2"
                 class:disabled={ game.announced === 1 }
                 on:click|preventDefault={ () => { if(game.announced === 0) editGame = { ...game }; } }>
                Изменить
              </a>
              <a href="#" class="link has-text-danger"
                 class:disabled={ game.announced === 1 }
                 on:click|preventDefault={ () => { if(game.announced === 0) deleteGame(game.id); } }>
                Удалить
              </a>
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

{#if editUsers !== null}
  <Modal title="Редактирование игроков" on:close={ () => editUsers = null }>
    <div slot="body">
      <div class="field is-grouped is-grouped-multiline">
        {#each editUsers.users as id}
          <div class="control">
            <div class="tags has-addons">
              <span class="tag is-medium">{ data.usersAssoc[id] }</span>
              <a href="#" class="tag is-medium is-delete"
                 on:click|preventDefault={ () => editUsers.users = editUsers.users.filter(i => i !== id) }></a>
            </div>
          </div>
        {/each}
      </div>
      <div class="field">
        <div class="select">
          <select on:change={ addUser }>
            <option value="">Добавить игрока</option>
            {#each data.users as user}
              {#if !editUsers.users.includes(user.id) && data.userId !== user.id}
                <option value={ user.id }>{ user.name }</option>
              {/if}
            {/each}
          </select>
        </div>
      </div>
    </div>
    <div slot="footer">
      <button class="button is-info" on:click={ saveUsers }>Сохранить</button>
    </div>
  </Modal>
{/if}