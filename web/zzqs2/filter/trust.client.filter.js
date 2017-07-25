/**
 * Created by elinaguo on 16/6/12.
 */
'use strict';

zhuzhuqs.filter('trustUrl', ['$sce', function ($sce) {
  return function (recordingUrl) {
    return $sce.trustAsResourceUrl(recordingUrl);
  };
}]);

zhuzhuqs.filter('trustHtml', ['$sce', function ($sce) {
  return function (text) {
    return $sce.trustAsHtml(text);
  };
}]);

