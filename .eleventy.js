const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const readingTime = require("eleventy-plugin-reading-time");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");

module.exports = function (config) {
  config.addPassthroughCopy({ "./src/style/": "style" });
  config.addPassthroughCopy({ "./public/": "public" });

  function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
  }
  config.addFilter("filterTagList", filterTagList);
  // Filrers for Dates on blog posts
  config.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("LLLL dd, yyyy");
  });
  config.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  config.setLibrary("md", markdownIt({html: true, breaks: true}));

  config.addPlugin(syntaxHighlight);
  config.addPlugin(readingTime);
  config.addPlugin(eleventyNavigationPlugin);


  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "./src",
      output: "./build",
    },
  };
};
