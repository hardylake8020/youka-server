/**
 * Created by zenghong on 16/3/15.
 */
var React = require('react');
var Link = require('react-router').Link;

module.exports = React.createClass({
  render: function () {
    return (
      <div className="header">
        <Link to="/page1">page1</Link>
        <Link to="/page2">page2</Link>
        this is header
      </div>
    );
  }
});