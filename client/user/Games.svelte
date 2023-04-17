<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { get } from '../common/request.js';

  const dispatch = createEventDispatcher();

  let games = null;

  const load = async () => {
    games = await get('/games');
    if(!games) return;

    games = games.sort((a, b) => {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    });
  };

  onMount(() => {
    load();
  });
</script>

{#if games !== null}
  {#if games.length === 0}
    <div class="has-text-centered">
      У вас нет игр
    </div>
  {:else}
    <table class="table is-bordered is-striped is-hoverable is-fullwidth">
      <tbody>
        {#each games as game}
          <tr>
            <td class="is-narrow">{ game.owner_name }</td>
            <td>{ game.name }</td>
            <td class="is-narrow">
              <a href="#" class="link has-text-info"
                 on:click|preventDefault={ () => dispatch('open', game) }>
                Открыть
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}