/**
 * Created by Wayne on 15/11/20.
 */
zhuzhuqs.factory('InformService',
  ['config', 'InformEnum', 'CommonSocketService', 'UserConfigSocketService', 'AbnormalOrderSocketService',
    function (config, InformEnum, CommonSocketService, UserConfigSocketService, AbnormalOrderSocketService) {
      var socket = null;
      var otherServices = [UserConfigSocketService, AbnormalOrderSocketService];

      var socketConfig = {};
      socketConfig.addCallback = function (name, value) {
        socketConfig[name] = value;
      };
      socketConfig.addCallback(InformEnum.onAddUser, function (data) {
        //更新所有通知
        socketConfig.getAbnormalInforms();
      });
      function configOtherRoute() {
        if (!socket) {
          return;
        }
        otherServices.forEach(function (item) {
          item.init(socket, socketConfig);
        });
      }
      function combineOtherService() {
        otherServices.forEach(function (serviceItem) {
          for (var name in serviceItem) {
            if (name !== 'init') {
              if (typeof serviceItem[name] === 'function') {
                socketConfig[name] = serviceItem[name];
              }
            }
          }
        });
      }
      function configSelfRoute() {
        if (!socket) {
          return;
        }
        CommonSocketService.receive(socket, InformEnum.web_socket_connection_success, function (data) {
          socketConfig.addUser();
        });
      }

      // socketConfig.connect = function () {
      //   socket = io.connect(config.pushServerAddress);
      //   if (socket) {
      //     //配置别人的路由,
      //     configOtherRoute();
      //     //合并别人的方法
      //     combineOtherService();
      //     //调用自己的路由
      //     configSelfRoute();
      //   }
      //   else {
      //     console.log('socket io connect to' + config.pushServerAddress + 'failed');
      //   }
      // };

      return socketConfig;
    }]);