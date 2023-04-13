export default [
  {
    input: 'client/admin/index.js',
    output: {
      file: 'public/js/admin.js',
      format: 'iife'
    },
    watch: {
      clearScreen: false
    }
  },
  {
    input: 'client/player/index.js',
    output: {
      file: 'public/js/player.js',
      format: 'iife'
    },
    watch: {
      clearScreen: false
    }
  }
];