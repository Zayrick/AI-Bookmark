export default [
  {
    input: 'src/background/index.js',
    output: {
      file: 'dist/background.js',
      format: 'esm'
    }
  },
  {
    input: 'src/popup/index.js',
    output: {
      file: 'dist/popup.js',
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
