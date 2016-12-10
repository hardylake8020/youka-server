zhuzhuqs.directive('zzExportDialog', function () {
  return {
    restrict:'A',
    templateUrl:'directive/zz_export_dialog/order_export_dialog.client.directive.html',
    replace:false,
    scope:{
    },
    controller:'OrderExportController'
  };
});