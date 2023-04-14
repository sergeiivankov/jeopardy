<script>
  import { onMount } from 'svelte';

  import Auth from '../common/Auth.svelte';
  import Users from './Users.svelte';
  import { token, isAdmin, setToken, setIsAdmin } from '../common/auth.js';
  import { setBaseURL, get } from '../common/request.js';

  setBaseURL('/admin');

  let page = null;

  const logout = () => {
    setToken(null);
    page = 'auth';
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

    page = 'games';
	});
</script>

{#if page == 'auth'}
  <Auth on:authorized={ () => page = 'games' }/>
{:else}
  <div class="navbar is-light">
    <div class="container">
      <div class="navbar-menu">
        <div class="navbar-start">
          <a href="#" class="navbar-item" class:is-active={ page == 'games' }
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
      <h1>GAMES</h1>
    {/if}
    {#if page == 'users'}
      <Users/>
    {/if}
  </div>
{/if}