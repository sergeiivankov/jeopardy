<script>
  import { createEventDispatcher } from 'svelte';
  import { loadingTimes } from './request.js';

  const dispatch = createEventDispatcher();

  export let title = '';
</script>

<div class="modal is-active">
  {#if $loadingTimes === 0}
    <div class="modal-background" on:click={ () => dispatch('close') }></div>
  {/if}
  <div class="modal-card">
    <div class="modal-card-head">
      <div class="modal-card-title">{ title }</div>
      <button class="delete" on:click={ () => dispatch('close') }></button>
    </div>
    <div class="modal-card-body">
      <slot name="body"></slot>
    </div>
    <div class="modal-card-foot">
      <slot name="footer"></slot>
    </div>
  </div>
</div>