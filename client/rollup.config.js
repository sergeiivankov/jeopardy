import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';

const plugins = [
  svelte({
    onwarn: (warning, handler) => {
      if(warning.code === 'a11y-invalid-attribute') return;
      if(warning.code === 'a11y-click-events-have-key-events') return;
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