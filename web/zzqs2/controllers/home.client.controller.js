angular.module('zhuzhuqs').controller('HomeController',
  ['$rootScope', '$scope', '$state', 'HomeService', 'GlobalEvent', 'Auth',
    function ($rootScope, $scope, $state, HomeService, GlobalEvent, Auth) {

      var panelItems = HomeService.getPanelItems();
      var user = Auth.getUser();

      if (!user) {
        console.log('user is empty, need signin');
        return;
      }

      panelItems.forEach(function (item) {
        var hasPermission = false;
        user.roles.forEach(function (role) {
          if (role == 'admin' || role == item.role)
            hasPermission = true;
        });

        item.visible = hasPermission;
      });


      $scope.items = panelItems;
      $scope.onMenu = function (btn) {
        //$scope.$emit(GlobalEvent.onChangeMenu, btn);
        HomeService.setviewSubHandle(btn.viewSubHandle ? btn.viewSubHandle : []);
        if (btn.params) {
          $state.go(btn.state, {params: btn.params});
        }
        else {
          if (btn.type === 'external_link') {
            goExternalLink(btn);
            return;
          }
          if (btn.state == 'home') {
            $scope.$emit(GlobalEvent.onShowDevelopmentTips, btn.label);
            return;
          }
          if (btn.state == 'export') {
            $scope.$emit(GlobalEvent.onShowExportDialog, btn.label);
            return;
          }
          $state.go(btn.state);
        }

      };

      function goExternalLink(btn) {
        if (btn.type !== 'external_link') {
          return;
        }

        return window.location.href = '/tender/entrance_page?state=' + btn.state + '&access_token=' + Auth.getToken();
      }
    }]);