// Use CommonJS export to ensure PostCSS loads correctly in all environments (including Vercel)
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}