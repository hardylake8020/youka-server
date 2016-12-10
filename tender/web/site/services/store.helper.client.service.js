/**
 * Created by Wayne on 15/10/9.
 */
'use strict';

tender.factory('StoreHelper', ['localStorageService', 'http', function (localStorageService, http) {
  function handleCities(cities) {
    if (!cities) {
      return {};
    }
    var newCities = {};
    var provinces = [];
    var newName;
    var regExp = /黑龙江|内蒙古/;
    for (var province in cities) {
      if (regExp.test(province)) {
        newName = province.substr(0,3);
      }
      else {
        newName = province.substr(0,2);
      }

      newCities[newName] = cities[province];
      provinces.push(newName);
      provinces.sort(function (a, b) {
        return a.localeCompare(b);
      });
    }

    return {
      provinces: provinces,
      cities: newCities
    };
  }

  var storeHelper = {
    getCities: function (callback) {
      var cities = localStorageService.get('cities');
      if (!cities || cities.length === 0) {
        http.get('/city/get').then(function (data) {
          if (!data || data.err) {
            console.log(data);
            return callback({err: '获取城市数据失败'});
          }

          var newData = handleCities(data);
          storeHelper.setCities(newData);
          return callback(null, newData);
        }, function (err) {
          console.log(err);
          return callback({err: '获取城市数据失败'});
        });
      }
      else {
        return callback(null, cities);
      }
    },
    setCities: function (cities) {
      return localStorageService.set('cities', cities);
    },
    getSalesmen: function (callback) {
      var salesmen = localStorageService.get('salesmen');
      if (!salesmen || salesmen.length === 0) {
        http.get('/salesman/list/all/basic').then(function (data) {
          if (!data || data.err) {
            console.log(data);
            return callback({err: '获取关注人数据失败'});
          }

          storeHelper.setSalesmen(data);
          return callback(null, data);
        }, function (err) {
          console.log(err);
          return callback({err: '获取关注人数据失败'});
        });
      }
      else {
        return callback(null, salesmen);
      }
    },
    setSalesmen: function (salesmen) {
      return localStorageService.set('salesmen', salesmen);
    },
    reset: function () {
      this.setCities(null);
      this.setSalesmen(null);
    }
  };

  return storeHelper;
}]);