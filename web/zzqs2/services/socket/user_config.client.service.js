/**
 * Created by Wayne on 15/11/20.
 */

zhuzhuqs.factory('UserConfigSocketService',
  ['$timeout', 'InformEnum', 'Auth', 'CommonSocketService',
    function ($timeout, InformEnum, Auth, CommonSocketService) {
      var socket;
      var company;
      var updateUserCount = 0;

      function getUserCompany() {
        if (!company) {
          company = Auth.getUser().company;
        }
        return company;
      }

      function configRoute(parentObject) {
        if (!socket) {
          return;
        }
        CommonSocketService.receive(socket, InformEnum.web_add_user, parentObject[InformEnum.onAddUser]);
      }

      return {
        init: function (currentSocket, parentObject) {
          socket = currentSocket;
          configRoute(parentObject);
        },
        addUser: function () {
          console.log('updateUserCount ',++updateUserCount);

          var that = this;
          $timeout(function () {
            var company = getUserCompany();
            var groupIds = Auth.getGroups();

            if (socket && company) {
              CommonSocketService.send(socket, InformEnum.web_add_user, {company_id: company._id, group_ids: groupIds});
            }
            else {
              that.addUser();
            }
          }, 2000);
        }
      };

    }]);