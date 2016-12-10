/**
 * Created by zenghong on 16/3/14.
 */

var CommentForm = require('./comment_form');
var CommentList =  require('./comment_list');

var CommentBox = React.createClass({
  getInitialState: function () {
    return {data: []};
  },
  loadData: function () {
    $.get('/wechat/test/data', {}).then(function (data) {
      this.setState({data: data});
    }.bind(this), function (data) {
      console.log(data);
    });
  },
  componentDidMount: function () {
    this.loadData();
  },
  render: function () {
    return (
      <div className="commentBox">
        Hello, world! I am a CommentBox.
        <CommentList data={this.state.data}/>
        <CommentForm />
      </div>
    );
  }
});

ReactDOM.render(
  <CommentBox />,
  document.getElementById('content')
);



