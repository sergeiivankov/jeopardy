<script>
  import { onMount } from 'svelte';

  import Modal from '../common/Modal.svelte';
  import { get, post, put, del } from '../common/request.js';

  let editUser = null;
  let users = null;

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
    if(!users) return;

    users = users.sort((a, b) => {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    });
  };

  const save = async () => {
    let requestFn;
    if(editUser.id) requestFn = put;
    else requestFn = post;

    const result = await requestFn('/users', editUser);
    if(result === null) return;

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

{#if users !== null}
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
{/if}

{#if editUser !== null}
  <Modal title={ editUser.id ? 'Редактирование пользователя' : 'Создание пользователя' }
         on:close={ () => editUser = null }>
    <div slot="body">
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
    <div slot="footer">
      <button class="button is-info" on:click={ save }>
        { editUser.id ? 'Сохранить' : 'Создать' }
      </button>
    </div>
  </Modal>
{/if}