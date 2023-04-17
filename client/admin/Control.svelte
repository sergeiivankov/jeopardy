<script>
  import { createEventDispatcher } from 'svelte';

  export let game = {};

  const dispatch = createEventDispatcher();
</script>

<div class="game-control">
  <div class="level">
    <div class="level-left">
      <div class="title">{ game.name }</div>
    </div>
    <div class="level-right">
      <button class="button" on:click={ () => dispatch('close') }>Закрыть</button>
    </div>
  </div>
</div>