const express = require('express');
const expressVue = require('express-vue');
const path = require('path');
require('cross-fetch/polyfill');

const hostname = '127.0.0.1';
const port = 3000;

// Initialize Express
const app = express();
app.use(express.static('static'));

// Options for express-vue
const vueOptions = {
  head: {
    title: 'Harvard Art Museums',
    metas: [
      {
        charset: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, shrink-to-fit=no',
      },
    ],
    styles: [
      {
        style: '/css/styles.css'
      },
      {
        style: 'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
      }
    ]
  },
  rootPath: path.join(__dirname, '/views')
};


// Initialize express-vue
const expressVueMiddleware = expressVue.init(vueOptions);
app.use(expressVueMiddleware);

// List galleries
app.get('/', (req, res) => {
  // TODO
  let galleries = [];
  res.renderVue('index.vue', {galleries});
});

// List objects
app.get('/gallery/:gallery_id', (req, res) => {
  // TODO
});

// Show object
app.get('/objects/:object_id', (req, res) => {
  // TODO
});

// Comment on object
app.get('/objects/:object_id/comment', (req, res) => {
  // TODO
});

// Listen on socket
app.listen(port, hostname, () => {
  console.log(`Server running on http://${hostname}:${port}/`);
});
