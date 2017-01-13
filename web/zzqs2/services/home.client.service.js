zhuzhuqs.factory('HomeService', ['Auth', 'OrderService', function (Auth, OrderService) {
  var viewSubHandle = [];

  function updateAbnormalOrderTopTip() {
    var that = this;
    OrderService.getAbnormalOrderCount().then(function (result) {
      if (!result || result.err) {
        console.log('get abnormal order count failed ' + result);
      } else {
        that.topTip = result.count;
      }
    }, function (err) {
      console.log('get abnormal order count failed ' + err);
    });
  }

  var panelItems = [
    // {
    //   "title": "运单创建",
    //   "subtitle": "批量或单个创建您的运单",
    //   "logo": "images/icon/icon_new.png",
    //   "role": 'user',
    //   "handle": [
    //     [
    //       {
    //         "label": "创建运单",
    //         "type": "link",//按钮标题
    //         "state": "order_create",
    //         "url": "/order_create"
    //       },
    //       {
    //         "label": "批量创建",
    //         "type": "link",
    //         "state": "order_batch_create",
    //         "url": "/order_batch_create"
    //       }
    //     ]
    //   ]
    // },
    {
      "title": "任务分配",
      "subtitle": "正在等待分配的运单数量",
      "logo": "images/icon/icon_distribution.png",
      "role": 'user',
      "handle": [
        [
          {
            "label": "运单操作",
            "type": "link",//按钮标题
            "state": "order_operation",
            "url": "/order_operation"
          }//,
          // {
          //   "label": "分配运单",
          //   "type": "link",//按钮标题
          //   "state": "order_assign",
          //   "url": "/order_assign"
          // },
          // {
          //   "label": "异常运单",
          //   "type": "link",
          //   "state": "abnormal_orders",
          //   "url": "/abnormal_orders",
          //   "topTip": 0,
          //   "updateTopTip": updateAbnormalOrderTopTip
          // }
        ]
      ]
    },
    {
      "title": "招标平台",
      "subtitle": "招标平台",
      "logo": "images/icon/icon_business.png",
      "role": "user",
      "handle": [
        [
          {
            "label": "创建标书",
            "type": "external_link",
            "server": "tender",
            "port": 3006,
            "state": "tender_create/",
            "url": "/tender_create"
          },
          {
            "label": "招标信息",
            "type": "external_link",
            "server": "tender",
            "port": 3006,
            "state": "tender_follow",
            "url": "/tender_follow"
          }
        ]
      ]
    }
  ];

  function getObjByHandelUrl(sta) {
    var each = true;
    var obj = null;
    if (sta != 'home') {
      panelItems.forEach(function (item) {
        for (var i = 0, len = item.handle.length; i < len; i++) {
          for (var j = 0, a = item.handle[i], l = a.length; j < l; j++) {
            var hd = a[j];
            if (each) {
              if (hd.state === sta) {
                each = false;
                obj = hd;
              }
            }
          }
        }
      });

    }
    return obj;
  }

  function getCurrentNavList(liststr) {
    //返回前几级列表
    var navlist = [];
    var _tmp = liststr.split('.');//计算.符号次数
    var state_level_str = '';
    for (var i = 0; i < _tmp.length; i++) {
      if (i === 0) {
        //顶级菜单
        state_level_str = _tmp[i];
        var tar = getObjByHandelUrl(state_level_str);
        if (tar) {
          navlist.push(deepCopyByObject(tar));
        }
      }
      else {
        if (i < _tmp.length - 1) {
          state_level_str += '.' + _tmp[i];
          navlist[i - 1].viewSubHandle.forEach(function (item) {
            if (item.state === state_level_str) {
              navlist.push(deepCopyByObject(item));
            }
          });
        }
      }
    }
    return navlist;
  }

  // 对象深拷贝
  function deepCopyByObject(source) {
    var result = {};
    for (var key in source) {
      result[key] = (typeof source[key]) === 'object' ? deepCopyByObject(source[key]) : source[key];
    }
    return result;
  }

  return {
    updatePanelItemsFromLocal: function (state) {
      panelItems.forEach(function (panelItem) {
        for (var i = 0, len = panelItem.handle.length; i < len; i++) {
          for (var j = 0, a = panelItem.handle[i], l = a.length; j < l; j++) {
            var labelItem = a[j];
            if (labelItem.state === state && labelItem.topTip && labelItem.topTip > 0) {
              labelItem.topTip--;
            }
          }
        }
      });
    },
    updatePanelItemsFromServer: function () {
      panelItems.forEach(function (panelItem) {
        for (var i = 0, len = panelItem.handle.length; i < len; i++) {
          for (var j = 0, a = panelItem.handle[i], l = a.length; j < l; j++) {
            var labelItem = a[j];
            if (labelItem.updateTopTip) {
              labelItem.updateTopTip();
            }
          }
        }
      });
    },
    getPanelItems: function () {
      return panelItems;
    },
    setviewSubHandle: function (hd) {
      viewSubHandle = hd;
    },
    getviewSubHandle: function () {
      var _arr = [];
      if (viewSubHandle.length > 0) {
        _arr = viewSubHandle;
      }
      else {
        var obj = Auth.getLatestUrl();
        var nav_list = [];
        if (obj && obj.state) {
          nav_list = getCurrentNavList(obj.state) ? getCurrentNavList(obj.state) : [];
        }
        var _current = nav_list[nav_list.length - 1];
        if (_current && _current.viewSubHandle) {
          _arr = _current.viewSubHandle;
        }
      }
      return _arr;
    },
    getObjByHandelUrl: getObjByHandelUrl,
    getCurrentNavList: getCurrentNavList
  }
}]);
