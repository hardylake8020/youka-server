/**
 * Created by Wayne on 15/11/20.
 */
zhuzhuqs.factory('CommonSocketService', function () {

  return {
    receive: function (socket, route, callback) {
      // socket.on(route, function (data) {
      //   console.log('socket receive ', route, data);
      //   if (callback) {
      //     callback(data);
      //   }
      // });
    },
    send: function (socket, route, data) {
      console.log('socket send ', route, data);
      // socket.emit(route, data);
    }
  };

});