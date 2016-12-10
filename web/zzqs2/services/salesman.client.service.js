/**
 * Created by Wayne on 15/12/7.
 */

zhuzhuqs.factory('SalesmanService', ['config','HttpService', function (config, HttpService) {
  return {
    getDetailList: function () {
      return HttpService.getDataFromServer(config.serverAddress + '/salesman/list/all/detail');
    },
    getBasicList: function () {
      return HttpService.getDataFromServer(config.serverAddress + '/salesman/list/all/basic');
    },
    removeSalesmanCompanyById: function (salesmanCompanyId) {
      var params = {salesman_company_id: salesmanCompanyId};
      return HttpService.getDataFromServer(config.serverAddress + '/salesman_company/remove/id', params);
    },
    removeSalesmanCompanyByUsername: function (username) {
      var params = {username: username};
      return HttpService.getDataFromServer(config.serverAddress + '/salesman_company/remove/username', params);
    },
    create: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/salesman/create', params);
    },
    batchCreate: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/salesman/batchcreate', params);
    },
    update: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/salesman/update', params);
    }
  };
}]);