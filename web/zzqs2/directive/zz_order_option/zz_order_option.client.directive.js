/**
 * Created by Wayne on 16/1/14.
 */

zhuzhuqs.directive('zzOrderOption', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_order_option/zz_order_option.client.directive.view.html',
    replace: true,
    transclude: true,
    scope: {
      config: '='
    },
    link: function (scope, element, attributes) {
      var srcConfig;

      scope.config.removePhotoItem = function (index, photoArray, photoConfig) {
        if (photoArray.length === 0 || index < 0 || index >= photoArray.length) {
          return;
        }

        if (photoArray[index].isPlate) {
          photoConfig.isPlate = false;
        }

        photoArray.splice(index, 1);
      };
      scope.config.addPhotoItem = function (photoArray) {
        photoArray.push({name: ''});
      };
      scope.config.addPlatePhotoItem = function (photoArray, photoConfig) {
        if (photoConfig.isPlate) {
          return;
        }

        photoArray.push({name: '拍车牌', isPlate: true});
        photoConfig.isPlate = true;
      };

      scope.config.load = function (configuration) {
        srcConfig = configuration;
        if (!configuration) {
          return;
        }
        convertConfigToOptionPage(configuration);
      };
      scope.config.getData = function () {
        var dstData = getOptionPageData();
        var errorStr = checkConfiguration(dstData);
        var isModify = false;
        if (!srcConfig) {
          isModify = true;
        }
        else {
          isModify = compareConfiguration(srcConfig, dstData.config);
        }

        return {
          err: errorStr,
          isModify: isModify,
          config: dstData.config
        };
      };

      function convertConfigToOptionPage(orderConfig) {
        var option = scope.config;

        option.entrance.isOpen = orderConfig.must_entrance || false;
        option.entrance_photo.isOpen = orderConfig.must_entrance_photo || false;
        option.entrance_photo.isPlate = false;
        option.take_photo.isOpen = orderConfig.must_take_photo || false;
        option.take_photo.isPlate = false;
        option.confirm_detail.isOpen = orderConfig.must_confirm_detail || false;

        option.entrance_photo_array = [];
        if (orderConfig.entrance_photos && orderConfig.entrance_photos.length > 0) {
          orderConfig.entrance_photos.forEach(function (item) {
            if (item.isPlate) {
              option.entrance_photo_array.push({name: item.name, isPlate: true});
              option.entrance_photo.isPlate = true;
            }
            else {
              option.entrance_photo_array.push({name: item.name});
            }
          });
        }
        else {
          option.entrance_photo_array.push({name: '拍货物'});
        }

        option.take_photo_array = [];
        if (orderConfig.take_photos && orderConfig.take_photos.length > 0) {
          orderConfig.take_photos.forEach(function (item) {
            if (item.isPlate) {
              option.take_photo_array.push({name: item.name, isPlate: true});
              option.take_photo.isPlate = true;
            }
            else {
              option.take_photo_array.push({name: item.name});
            }
          });
        }
        else {
          option.take_photo_array.push({name: '拍货物'});
        }
      }
      function getOptionPageData() {
        var config = {};
        var invalidConfig = [];
        var option = scope.config;

        config.must_entrance = option.entrance.isOpen || false;
        config.must_entrance_photo = option.entrance_photo.isOpen || false;
        config.must_take_photo = option.take_photo.isOpen || false;
        config.must_confirm_detail = option.confirm_detail.isOpen || false;

        config.entrance_photos = [];
        option.entrance_photo_array.forEach(function (item) {
          if (item.name) {
            config.entrance_photos.push({
              name: item.name
            });
            if (item.isPlate) {
              config.entrance_photos[config.entrance_photos.length-1].isPlate = true;
            }
          }
          else {
            invalidConfig.push('entrance_photo_array');
          }
        });
        config.take_photos = [];
        option.take_photo_array.forEach(function (item) {
          if (item.name) {
            config.take_photos.push({
              name: item.name
            });
            if (item.isPlate) {
              config.take_photos[config.take_photos.length-1].isPlate = true;
            }
          }
          else {
            invalidConfig.push('take_photo_array');
          }
        });

        return {
          config: config,
          invalid: invalidConfig
        };
      }
      function checkConfiguration(data) {
        var str = '';
        if (data.invalid.length > 0) {

          if (data.invalid[0] === 'entrance_photo_array' && data.config.must_entrance_photo) {
            str = '进场拍照有未编辑步骤，请编辑文字';
            return scope.config.title + str;
          }

          if (data.invalid[0] === 'take_photo_array' && data.config.must_take_photo) {
            str = '拍照有未编辑步骤，请编辑文字';
            return scope.config.title + str;
          }
        }

        if (data.config.must_entrance_photo && data.config.entrance_photos.length === 0) {
          str = '强制进场拍照后，必须设置拍照步骤';
          return scope.config.title + str;
        }
        if (data.config.must_take_photo && data.config.take_photos.length === 0) {
          str = '强制拍照后，必须设置拍照步骤';
          return scope.config.title + str;
        }

        return '';
      }
      function compareConfiguration(src, dst) {
        if (src.must_entrance !== dst.must_entrance) {
          return true;
        }
        if (src.must_entrance_photo !== dst.must_entrance_photo) {
          return true;
        }
        if (src.must_take_photo !== dst.must_take_photo) {
          return true;
        }
        if (src.must_confirm_detail !== dst.must_confirm_detail) {
          return true;
        }

        if (src.entrance_photos.length !== dst.entrance_photos.length) {
          return true;
        }
        else {
          for (var i = 0; i < src.entrance_photos.length; i++) {
            if (src.entrance_photos[i].name !== dst.entrance_photos[i].name) {
              return true;
            }
          }
        }

        if (src.take_photos.length !== dst.take_photos.length) {
          return true;
        }
        else {
          for (var i = 0; i < src.take_photos.length; i++) {
            if (src.take_photos[i].name !== dst.take_photos[i].name) {
              return true;
            }
          }
        }

        return false;
      }
    }
  };
}]);
