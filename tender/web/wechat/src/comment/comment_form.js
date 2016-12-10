/**
 * Created by zenghong on 16/3/14.
 */

var CommentForm = React.createClass({
  handleSubmit: function (e) {
    e.preventDefault();
    var a = 'ss';
    return;
  },
  render: function () {
    return (
      <form className="commentForm">
        <input type="text" placeholder="Your name"/>
        <input type="text" placeholder="Say something..."/>
        <input type="submit" value="Post"/>
      </form>
    );
  }
});

module.exports = CommentForm;
