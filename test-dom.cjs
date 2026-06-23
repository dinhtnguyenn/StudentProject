const { JSDOM } = require("jsdom");

const dom = new JSDOM(`
  <body>
    <div id="card" class="MuiCard-root">
      <h2 id="title">Hello</h2>
    </div>
  </body>
`);
const document = dom.window.document;

const els = Array.from(document.querySelectorAll('.MuiCard-root, h2'));
const items = els.map(el => ({
  el,
  placeholder: document.createComment('placeholder')
}));

items.forEach(item => {
  item.el.replaceWith(item.placeholder);
});

items.forEach(item => {
  document.body.appendChild(item.el);
});

console.log(document.body.innerHTML);
