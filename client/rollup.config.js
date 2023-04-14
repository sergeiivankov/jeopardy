import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';

const plugins = [
  svelte({
    onwarn: (warning, handler) => {
      if(warning.code === 'a11y-distracting-elements') return;
      handler(warning);
    }
  }),
  resolve()
];

export default [
  {
    input: 'client/admin/index.js',
    output: {
      file: 'public/js/admin.js',
      format: 'iife'
    },
    watch: {
      clearScreen: false
    },
    plugins
  },
  {
    input: 'client/player/index.js',
    output: {
      file: 'public/js/player.js',
      format: 'iife'
    },
    watch: {
      clearScreen: false
    },
    plugins
  }
];