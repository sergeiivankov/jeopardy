<script>
  import { onMount } from 'svelte';

  import Auth from '../common/Auth.svelte';
  import Game from './Game.svelte';
  import Games from './Games.svelte';
  import Users from './Users.svelte';
  import { token, isAdmin, setToken, setIsAdmin } from '../common/auth.js';
  import { setData } from '../common/data.js';
  import { loadingTimes, setBaseURL, get } from '../common/request.js';

  setBaseURL('/admin');

  let page = null;
  let editGameId = 0;

  const logout = () => {
    setToken(null);
    page = 'auth';
  };

  const editGame = e => {
    editGameId = e.detail;
    page = 'gameEdit';
  };

  const onAuthorized = async () => {
    const data = await get('/data');
    if(!data) return;

    const usersAssoc = {};
    for(const user of data.users) {
      usersAssoc[user.id] = user.name;
    }
    data.usersAssoc = usersAssoc;

    setData(data);
    page = 'games';
  };

  onMount(async () => {
		if(!token) {
      setToken(null);
      setIsAdmin(false);
      page = 'auth';
      return;
    }

    const result = await get('/check', false);
    if(result === null) {
      setToken(null);
      page = 'auth';
      return;
    }

    setIsAdmin(result);

    onAuthorized();
	});
</script>

{#if page == 'auth'}
  <Auth on:authorized={ onAuthorized }/>
{:else}
  <div class="navbar is-dark">
    <div class="container">
      <div class="navbar-menu">
        <div class="navbar-start">
          <a href="#" class="navbar-item" class:is-active={ page == 'games' || page == 'gameEdit' }
             on:click|preventDefault={ () => page = 'games' }>Игры</a>
          {#if $isAdmin}
            <a href="#" class="navbar-item" class:is-active={ page == 'users' }
               on:click|preventDefault={ () => page = 'users' }>Пользователи</a>
          {/if}
        </div>
        <div class="navbar-end">
          <a href="#" class="navbar-item" on:click|preventDefault={ logout }>Выйти</a>
        </div>
      </div>
    </div>
  </div>

  <div class="container mt-5">
    {#if page == 'games'}
      <Games on:edit={ editGame }/>
    {/if}
    {#if page == 'gameEdit'}
      <Game id={ editGameId }/>
    {/if}
    {#if page == 'users'}
      <Users/>
    {/if}
  </div>
{/if}

{#if $loadingTimes > 0}
  <div class="modal is-active">
    <div class="modal-background"></div>
    <div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
  </div>
{/if}