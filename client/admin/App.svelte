<script>
  import { onMount } from 'svelte';

  import { setBaseURL, get } from '../common/request.js';
  import { token, setToken } from '../common/storage/token.js';

  setBaseURL('/admin');

  let page = null;

  onMount(async () => {
		if(!token) page = 'auth';
    else {
      const result = await get('/check', false);
      if(!result) {
        page = 'auth';
        setToken(null);
      }
      else page = 'games';
    }
	});
</script>

{#if page == 'auth'}
  <div class="hero is-fullheight">
    <div class="hero-body">
      <div class="container is-flex is-justify-content-center has-text-centered">
        <div style="max-width:400px;width:100%">
          <div class="title">Авторизация</div>
          <div class="field">
            <input type="password" class="input" placeholder="Пароль" autocomplete="off">
          </div>
          <button class="button is-link">Войти</button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if page == 'games'}
  <h1>GAMES</h1>
{/if}