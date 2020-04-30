var path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/Timeline.js',
  output: {
    path: path.resolve('lib'),
    filename: 'Timeline.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react')
    }
  }
}