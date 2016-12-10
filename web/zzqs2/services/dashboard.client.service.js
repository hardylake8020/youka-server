zhuzhuqs.factory('DashboardService', ['$http', '$q', 'config', 'HttpService', function ($http, $q, config, HttpService) {
  return {
    sortByOrderCount: function (days, myRole, viewRole, viewRoleCompanyName) {
      return HttpService.getDataFromServer(config.serverAddress + '/dashboard/sortbyordercount', {
        days: days,
        my_role: myRole,
        view_role: viewRole,
        view_role_company_name: viewRoleCompanyName
      });
    },
    getOrderRate: function (days, myRole, viewRole, viewRoleCompanyName) {
      return HttpService.getDataFromServer(config.serverAddress + '/dashboard/perfectratebycompany', {
        days: days,
        my_role: myRole,
        view_role: viewRole,
        view_role_company_name: viewRoleCompanyName
      });
    }
  }
}]);