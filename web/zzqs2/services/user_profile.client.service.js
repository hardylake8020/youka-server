/**
 * Created by Wayne on 15/7/10.
 */

'use strict';

zhuzhuqs.factory('UserProfileService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    getUserProfile: function () {
      return this.getDataFromServer('/userprofile');
    },
    setFollowCustomizeColumns: function (columns) {
      return this.postDataToServer('/customizecolumnsfollow', {customize_columns_follow: columns});
    },
    setAssignCustomizeColumns: function (columns) {
      return this.postDataToServer('/customizecolumnsassign', {customize_columns_assign: columns});
    },
    setMaxPageCount: function (params) {
      return this.getDataFromServer('/userprofile/max_page_count', params);
    },
    getDataFromServer: function (url, params) {
      var q = $q.defer();
      if (!params) {
        $http.get(url)
          .success(function (data) {
            q.resolve(data);
          })
          .error(function (err) {
            q.reject(err)
          });
      }
      else {
        $http.get(url, {
          params: params
        })
          .success(function (data) {
            q.resolve(data);
          })
          .error(function (err) {
            q.reject(err)
          });
      }

      return q.promise;
    },
    postDataToServer: function (url, params) {
      var q = $q.defer();
      $http.post(url, params)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    }
  };

}]);