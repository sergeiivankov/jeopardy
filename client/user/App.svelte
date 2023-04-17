<script>
  import { onMount } from 'svelte';

  import Auth from '../common/Auth.svelte';
  import Rules from './Rules.svelte';
  import { token, setToken } from '../common/auth.js';
  import { data, setData } from '../common/data.js';
  import { loadingTimes, get } from '../common/request.js';

  let page = null;

  const logout = () => {
    setToken(null);
    page = 'auth';
  };

  const onAuthorized = async () => {
    const data = await get('/data');
    if(!data) return;

    setData(data);
    page = 'games';
  };

  onMount(async () => {
		if(!token) {
      setToken(null);
      page = 'auth';
      return;
    }

    const result = await get('/check', false);
    if(result === null) {
      setToken(null);
      page = 'auth';
      return;
    }

    onAuthorized();
	});
</script>

{#if page !== null}
  {#if page === 'auth'}
    <Auth on:authorized={ onAuthorized }/>
  {:else}
    <div class="navbar is-dark is-mobile">
      <div class="container">
        <div class="navbar-menu">
          <div class="navbar-start">
            <a href="#" class="navbar-item" class:is-active={ page == 'games' }
               on:click|preventDefault={ () => page = 'games' }>Игры</a>
            <a href="#" class="navbar-item" class:is-active={ page == 'rules' }
               on:click|preventDefault={ () => page = 'rules' }>Правила</a>
          </div>
          <div class="navbar-end">
            <span class="navbar-item has-text-weight-bold">{ data.userName }</span>
            <a href="#" class="navbar-item" on:click|preventDefault={ logout }>Выйти</a>
          </div>
        </div>
      </div>
    </div>

    <div class="container mt-5 is-mobile">
      {#if page == 'rules'}
        <Rules/>
      {/if}
    </div>
  {/if}
{/if}

{#if $loadingTimes > 0}
  <div class="modal is-active">
    <div class="modal-background"></div>
    <div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
  </div>
{/if}