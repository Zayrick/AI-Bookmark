export default [
  {
    input: 'src/background/index.js',
    output: {
      file: 'dist/background.js',
      format: 'esm'
    }
  },
  {
    input: 'src/popup/popup.js',
    output: {
      file: 'dist/popup.js',
      format: 'esm'
    }
  },
  {
    input: 'src/popup/settings.js',
    output: {
      file: 'dist/settings.js',
      format: 'esm'
    }
  },
  {
    input: 'src/content/index.js',
    output: {
      file: 'dist/content.js',
      format: 'esm'
    }
  }
]
