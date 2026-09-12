export default {
  plugins: {
    autoprefixer: {},
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*'],
      selectorBlackList: ['.no-rem', 'html'],
      minPixelValue: 2,
      mediaQuery: false,
      exclude: /node_modules/i,
    },
  },
}
