<script>
  import { onMount } from 'svelte';

  import { get, post, put, del } from '../common/request.js';

  let editUser = null;
  let users = [];

  const generatePassword = () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 32) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    editUser.password = result;
  };

  const load = async () => {
    users = await get('/users');
  };

  const save = async () => {
    if(editUser.id) await put('/users', editUser);
    else await post('/users', editUser);

    editUser = null;

    load();
  };

  const deleteUser = async id => {
    if(!confirm('Точно удалить пользователя?')) return;

    await del('/users/' + id);

    load();
  };

  onMount(() => {
    load();
  });
</script>

<div class="block">
  <button class="button is-info" on:click={ () => editUser = {} }>Добавить пользователя</button>
</div>
{#if users.length === 0}
  <div class="has-text-centered">
    В базе нет ни одного пользователя
  </div>
{:else}
  <table class="table is-bordered is-striped is-hoverable is-fullwidth">
    <tbody>
      {#each users as user}
        <tr>
          <td>{ user.id }</td>
          <td>{ user.name }</td>
          <td>{ user.password }</td>
          <td class="is-narrow">
            <a href="#" class="link has-text-info"
               on:click|preventDefault={ () => editUser = { ...user } }>Изменить</a>
            &nbsp;
            <a href="#" class="link has-text-danger"
               on:click|preventDefault={ () => deleteUser(user.id) }>Удалить</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

{#if editUser !== null}
  <div class="modal is-active">
    <div class="modal-background" on:click={ () => editUser = null }></div>
    <div class="modal-card">
      <div class="modal-card-head">
        <div class="modal-card-title">
          { editUser.id ? 'Редактирование пользователя' : 'Создание пользователя' }
        </div>
        <button class="delete" on:click={ () => editUser = null }></button>
      </div>
      <div class="modal-card-body">
        <div class="field">
          <input type="text" class="input" placeholder="Имя" autocomplete="off"
                 bind:value={ editUser.name }>
        </div>
        <div class="field has-addons">
          <div class="control is-expanded">
            <input type="text" class="input" placeholder="Пароль" autocomplete="off"
                   bind:value={ editUser.password }>
          </div>
          <div class="control">
            <button class="button" on:click={ generatePassword }>Сгенерировать</button>
          </div>
        </div>
      </div>
      <div class="modal-card-foot">
        <button class="button is-info" on:click={ save }>
          { editUser.id ? 'Сохранить' : 'Создать' }
        </button>
      </div>
    </div>
  </div>
{/if}