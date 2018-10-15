const express = require('express');
const expressVue = require('express-vue');
const multer = require('multer');
const path = require('path');
require('cross-fetch/polyfill');

const hostname = '127.0.0.1';
const port = 3000;

// Initialize Express
const app = express();
app.use(express.static('static'));

const upload = multer();

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

const API_KEY='43a19a70-b76e-11e8-bf0e-e9322ccde4db';
const comments = [];

/**
 * Makes a GET request to url and returns JSON response as JavaScript object.
 */
function getJSON(url) {
    return fetch(url).then(response => response.json());
}


// List galleries
app.get('/', (req, res) => {
  let galleries = [];

  function getGalleries(url) {
    return getJSON(url)
      .then(data => {
        galleries = galleries.concat(data.records);
        if (data.info.next)
          return getGalleries(data.info.next);
      });
  }

  getGalleries(`https://api.harvardartmuseums.org/gallery?size=100&apikey=${API_KEY}`).then(() => {
    res.renderVue('index.vue', {galleries});
  });
});

// List objects
app.get('/gallery/:gallery_id', (req, res) => {
  let objects = [];
  function getObjects(url) {
    return getJSON(url)
      .then(data => {
        objects = objects.concat(data.records);
        if (data.info.next)
          return getObjects(data.info.next);
      });
  }

  getObjects(`https://api.harvardartmuseums.org/object?apikey=${API_KEY}&gallery=${req.params.gallery_id}`).then(() => {
    res.renderVue('gallery.vue', {objects});
  });
});

// Show object
app.get('/objects/:object_id', (req, res) => {
  getJSON(`https://api.harvardartmuseums.org/object/${req.params.object_id}?apikey=${API_KEY}`)
    .then(object => {
      res.renderVue('object.vue', {object, comments: comments[req.params.object_id]});
    });
});

// Comment on object
app.post('/objects/:object_id/comment', upload.fields([]), (req, res) => {
  if (!req.body || !req.body.comment || !req.body.comment.trim())
    res.sendStatus(400);

  if (!comments[req.params.object_id])
    comments[req.params.object_id]= [];

  comments[req.params.object_id].push({
      id: comments.length + 1,
      value: req.body.comment
  });

  res.sendStatus(200);
});

// Listen on socket
app.listen(port, hostname, () => {
  console.log(`Server running on http://${hostname}:${port}/`);
});
