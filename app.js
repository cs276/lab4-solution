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

// Handle form data
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
        style: 'https://unpkg.com/bootstrap/dist/css/bootstrap.min.css'
      },
      {
        style: 'https://unpkg.com/bootstrap-vue@latest/dist/bootstrap-vue.css'
      }
    ]
  },
  template: {
    body: {
      start: `
        <body>
          <script src="//unpkg.com/babel-polyfill@latest/dist/polyfill.min.js"></script>
          <script src="//unpkg.com/bootstrap-vue@latest/dist/bootstrap-vue.js"></script>
      `,
      end: '</body>'
    }
  },
  rootPath: path.join(__dirname, '/views')
};


// Initialize express-vue
const expressVueMiddleware = expressVue.init(vueOptions);
app.use(expressVueMiddleware);

const API_KEY='43a19a70-b76e-11e8-bf0e-e9322ccde4db';
const comments = [];


// GETs url and returns JSON response as JavaScript object
function getJSON(url) {
    return fetch(url).then(response => response.json());
}


// Wraps endpoint with base URL and adds apikey
function getURL(endpoint, params={}) {
  params.apikey = API_KEY;
  const url = new URL(`https://api.harvardartmuseums.org/${endpoint}`);
  Object.keys(params).forEach(p => url.searchParams.append(p, params[p]));
  return url;
}


// List galleries
app.get('/', (req, res) => {
  let galleries = [];

  // Recursively fetches galleries and returns last call promise
  function getGalleries(url) {
    return getJSON(url)
      .then(data => {
        galleries = galleries.concat(data.records);
        if (data.info.next)
          return getGalleries(data.info.next);
      });
  }

  // Render template once last promise is resolved
  getGalleries(getURL('gallery')).then(() => {
    res.renderVue('index.vue', {galleries});
  });
});

// List objects
app.get('/gallery/:gallery_id', (req, res) => {
  let objects = [];

  // Recursively fetches objects and returns last call promise
  function getObjects(url) {
    return getJSON(url)
      .then(data => {
        objects = objects.concat(data.records);
        if (data.info.next)
          return getObjects(data.info.next);
      });
  }

  // Render template once last promise is resolved
  getObjects(getURL('object', { gallery: req.params.gallery_id })).then(() => {
    res.renderVue(
      'gallery.vue',
      {
        objects,
        fields: [
          {
            'key': 'title'
          },
          {
            'key': 'id'
          },
          {
            'key': 'primaryimageurl',
					  'label': 'Image'
          },
          {
            'key': 'url',
            'label': 'More Information'
          }
        ]
      }
    );
  });
});

// Show object
app.get('/objects/:object_id', (req, res) => {
  getJSON(getURL(`object/${req.params.object_id}`))
    .then(object => {
      res.renderVue(
        'object.vue',
        {
          object,
          comments: comments[req.params.object_id] || []
        }
      );
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
