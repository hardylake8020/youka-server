/**
 * Created by Wayne on 15/11/22.
 */

zhuzhuqs.factory('AbnormalOrderSocketService',
  ['Auth', 'CommonSocketService', 'InformEnum',
    function (Auth, CommonSocketService, InformEnum) {
      var socket = null;

      function configRoute(parentObject) {
        if (!socket) {
          return;
        }
        CommonSocketService.receive(socket, InformEnum.web_abnormal_order_single, parentObject[InformEnum.onSingleAbnormalOrder]);
        CommonSocketService.receive(socket, InformEnum.web_abnormal_order_batch, parentObject[InformEnum.onBatchAbnormalOrder]);
        CommonSocketService.receive(socket, InformEnum.web_abnormal_order_clear, parentObject[InformEnum.onClearAbnormalOrder]);
      }

      return {
        init: function(currentSocket, parentObject) {
          socket = currentSocket;
          configRoute(parentObject);
        },
        getAbnormalInforms: function () {
          var companyId = Auth.getUser().company._id;
          var groupIds = Auth.getGroups();
          var userId = Auth.getUser()._id;
          CommonSocketService.send(socket, InformEnum.web_abnormal_order_batch, {company_id: companyId,group_ids: groupIds, user_id: userId});
        },
        clearAbnormalInforms: function () {
          var companyId = Auth.getUser().company._id;
          var groupIds = Auth.getGroups();
          var userId = Auth.getUser()._id;
          CommonSocketService.send(socket, InformEnum.web_abnormal_order_clear, {company_id: companyId,group_ids: groupIds, user_id: userId});
        }
      };

    }]);