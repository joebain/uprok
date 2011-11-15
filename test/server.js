var assert = require("assert");
module.exports = {
  'ok': function() {
    assert.ok(true, "This is ok.");
  },

  'not ok': function() {
    assert.ok(false, "This is not ok.");
  }
};
