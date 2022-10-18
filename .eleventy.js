const CleanCSS = require("clean-css");

module.exports = function (config) {
  config.addPassthroughCopy({ "./src/style/": "style" });
  config.addPassthroughCopy({ "./public/": "public" });
  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "./src",
      output: "./build",
    },
  };
};
