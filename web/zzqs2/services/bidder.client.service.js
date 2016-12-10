/**
 * Created by Wayne on 15/12/7.
 */

zhuzhuqs.factory('BidderService', ['config','HttpService', function (config, HttpService) {
  return {
    getDetailList: function () {
      return HttpService.getDataFromServer(config.serverAddress + '/bidder/list/all/detail');
    },
    inviteBidderByPhone: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/bidder/invite', params);
    },
    removeCompanyBidder: function(params){
      return HttpService.postDataToServer(config.serverAddress + '/bidder/remove-company-bidder', params)
    }
  };
}]);