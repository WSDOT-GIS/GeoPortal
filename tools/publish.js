const ghpages = require("gh-pages");

ghpages.publish(
  ".",
  {
    src: ["*.{html,js,css,svg}", "{dist,app,data,images,style}/*"]
  },
  function(err) {
    if (err) {
      console.error(err);
    }
  }
);
