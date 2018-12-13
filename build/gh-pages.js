/**
 * Publishes site via GitHub Pages.
 */

console.log("Publishing files to gh-pages...");

const ghpages = require("gh-pages");

const validExtensions = "{css,html,js,json,svg,png,jpg,gif}";

const folders = [
  "config",
  "disclaimers",
  "export",
  "error",
  "help",
  "images",
  // "node_modules/@bower_components",
  "scripts",
  "style"
];

let src = folders.map(name => `${name}`).join(",");
src = `./{${src}}/**/*.${validExtensions}`;
src = [
  src,
  // `./node_modules/@bower_components/**/*${validExtensions}`,
  "./*.html",
  "!*.md"
];

console.log("src", src);

ghpages.publish(
  ".",
  {
    repo: "https://github.com/WSDOT-GIS/GeoPortal.git",
    src
  },
  err => {
    if (err) {
      console.error("gh-pages error", err);
    }
  }
);
