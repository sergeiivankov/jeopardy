import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';

const plugins = [
  svelte({
    onwarn: (warning, handler) => {
      if(warning.code === 'a11y-invalid-attribute') return;
      if(warning.code === 'a11y-click-events-have-key-events') return;
      if(warning.code === 'a11y-missing-attribute') return;
      if(warning.code === 'a11y-media-has-caption') return;
      if(warning.code === 'a11y-missing-content') return;
      if(warning.code === 'a11y-label-has-associated-control') return;
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
    input: 'client/user/index.js',
    output: {
      file: 'public/js/user.js',
      format: 'iife'
    },
    watch: {
      clearScreen: false
    },
    plugins
  }
];