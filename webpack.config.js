module.exports = {
  entry: {
    'presbyopia-standalone': './src/main.js',
    presbyopia: ['./src/presbyopia'],
    tests: './test/tests.js',
  },
  output: {
    path: './dist',
    publicPath: '/dist/',
    filename: '[name].js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
    }],
  },
};
