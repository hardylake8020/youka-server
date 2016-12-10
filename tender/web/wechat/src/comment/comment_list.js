/**
 * Created by zenghong on 16/3/14.
 */
var Comment = require('./Comment');
var CommentList = React.createClass({
  render: function () {
    var commentNodes = this.props.data.map(function (comment, key) {
      return <Comment author={comment.author} key={key}>{comment.text}</Comment>
    });
    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

module.exports = CommentList;