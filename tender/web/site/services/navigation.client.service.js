/**
 * Created by Wayne on 15/10/11.
 */

tender.factory('Navigation', ['Auth', function (Auth) {
  var navigationList = [];

  function getUserNavList() {
    var currentUser = Auth.getUser();

    if (!currentUser) {
      return [];
    }

    var navList = [];
    navigationList.forEach(function (navItem) {
      var levelOne = {
        title: navItem.title,
        sub: []
      };

      if (navItem.sub && navItem.sub.length > 0) {
        navItem.sub.forEach(function (subItem) {
          for (var i = 0; i < currentUser.roles.length; i++) {
            if (subItem.roles.indexOf(currentUser.roles[i]) !== -1) {
              levelOne.sub.push(subItem);
              break;
            }
          }
        });
      }

      navList.push(levelOne);
    });

    return navList;
  }

  return {
    getList: getUserNavList
  };


}]);