/**
 * Created by zenghong on 16/3/15.
 */
/**
 * Created by zenghong on 16/3/15.
 */
var React = require('react');
var ReactDOM = require('react-dom');

var Router = require('react-router').Router;
var Route = require('react-router').Route;
var hashHistory = require('react-router').hashHistory;

var Header = require('./header/header');

var Page1 = require('./pages/page1');
var Page2 = require('./pages/page2');

var App = React.createClass({
  render: function () {
    return (
      <div>
        <Header />
        {this.props.children}
      </div>
    )
  }
});

ReactDOM.render((
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <Route path="page1" component={Page1}/>
      <Route path="Page2" component={Page2}/>
    </Route>
  </Router>
), document.getElementById('page'));