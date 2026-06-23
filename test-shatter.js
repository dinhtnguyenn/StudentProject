// Mock DOM
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html>
<body>
  <div class="card">
    <h2>Hello</h2>
    <p>Some text <span>with span</span></p>
    <button>Click <svg></svg></button>
    <img src="foo.png" />
  </div>
</body>`);
const document = dom.window.document;
const NodeFilter = dom.window.NodeFilter;

const textNodes = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
let node;
while (node = walker.nextNode()) {
  if (node.nodeValue.trim() !== '') {
    textNodes.push(node.parentElement);
  }
}
const allCandidates = Array.from(new Set([...textNodes, ...document.querySelectorAll('img, svg, button, .MuiChip-root')]));

const topLevelElements = allCandidates.filter(el => {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    if (allCandidates.includes(parent)) return false;
    parent = parent.parentElement;
  }
  return true;
});

console.log(topLevelElements.map(el => el.tagName));
