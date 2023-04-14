<script>
  import { createEventDispatcher } from 'svelte';

  import { setToken, setIsAdmin } from './auth.js';
  import { get } from './request.js';

  const dispatch = createEventDispatcher();

  let password = '';

  const auth = async () => {
    setToken(password);

    const result = await get('/check', false);
    if(result === null) {
      setToken(null);
      password = '';
      alert('Неверный пароль');
      return;
    }

    setIsAdmin(result);

    dispatch('authorized');
  };
</script>

<div class="hero is-fullheight">
  <div class="hero-body">
    <div class="container is-flex is-justify-content-center has-text-centered">
      <div style="max-width:400px;width:100%">
        <div class="title">Авторизация</div>
        <div class="field">
          <input type="password" class="input" placeholder="Пароль" autocomplete="off"
                 bind:value={ password }>
        </div>
        <button class="button is-link" on:click={ auth }>Войти</button>
      </div>
    </div>
  </div>
</div>