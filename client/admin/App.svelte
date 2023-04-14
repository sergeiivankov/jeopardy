<script>
  import { onMount } from 'svelte';

  import Auth from '../common/Auth.svelte';
  import { setBaseURL, get } from '../common/request.js';
  import { token, setToken } from '../common/token.js';

  setBaseURL('/admin');

  let page = null;

  onMount(async () => {
		if(!token) {
      page = 'auth';
      return;
    }

    const result = await get('/check', false);
    if(!result) {
      setToken(null);
      page = 'auth';
      return;
    }

    page = 'games';
	});
</script>

{#if page == 'auth'}
  <Auth on:authorized={ () => page = 'games' }/>
{/if}

{#if page == 'games'}
  <h1>GAMES</h1>
{/if}