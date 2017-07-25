/**
 * Created by elinaguo on 16/6/13.
 */
'use strict';
zhuzhuqs.directive('playerAudio', [function () {
  return {
    restrict: 'E',
    templateUrl: 'directive/player_audio/player_audio.client.view.html',
    replace: true,
    scope: {
      config: '='
    },
    controller: function ($scope, $element) {
      $scope.onPlay = function (element) {
        if ($scope.config.onPlay) {
          $scope.config.onPlay(element);
        }
      };
    }
  };
}]);
