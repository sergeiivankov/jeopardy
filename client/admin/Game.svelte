<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { get, post, put, del } from '../common/request.js';

  export let id;

  let game = null;

  const load = async () => {
    game = await get('/games/' + id);
  };

  onMount(() => {
    load();
  });
</script>

{#if game !== null}
  <div class="block">
    <div class="title">{ game.name }</div>
  </div>
{/if}