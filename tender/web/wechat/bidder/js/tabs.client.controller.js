/**
 * Created by Wayne on 16/1/28.
 */

function ZZTabs(tabStatusChanged) {
  var self = this;
  var tabs = {};
  this.element = $('\
  <div class="zz-tab-container">\
  </div>\
  ');

  this.update = function (tabArray) {
    if (!tabArray || tabArray.length ===0) {
      return;
    }
    initTabs(tabArray);
  };
  this.showTab = function (type) {
    showTab(type);
  };

  function showTab(currentSelectTabType) {
    unSelectPrevTab(currentSelectTabType);
    tabs[currentSelectTabType].select();

    tabStatusChanged(currentSelectTabType);
  }

  function tabClickHandle(currentSelectTabType) {
    unSelectPrevTab(currentSelectTabType);

    if (tabStatusChanged) {
      tabStatusChanged(currentSelectTabType);
    }
  }
  function unSelectPrevTab(currentSelectTabType) {
    for (var name in tabs) {
      if (name != currentSelectTabType && tabs[name].isSelect()) {
        tabs[name].unSelect();
        break;
      }
    }
  }

  function clearTabs() {
    tabs = {};
    self.element.empty();
  }
  function initTabs(tabArray) {
    clearTabs();

    var tabItemWidth = 100 / tabArray.length;
    tabArray.forEach(function (item) {
      var tabItem = new ZZTab(item, tabItemWidth, tabClickHandle);
      self.element.append(tabItem.element);
      tabs[item.type] = tabItem;
    });
  }
}

//tabInfo = {name, type}
function ZZTab(tabInfo, width, tabClickHandle) {
  var self = this;

  this.element = $('\
  <div class="zz-tab-item">\
    <p class="text"></p>\
    <p class="bottom-bar"></p>\
  </div>\
  ');

  this.element.css('width', width + '%');
  this.element.attr('type', tabInfo.type);
  this.element.find('.text').text(tabInfo.name);
  this.type = tabInfo.type;

  this.element.click(function (e) {
    if (isSelect()) {
      return stopBubble(e);
    }

    selectSelf();
  });

  this.isSelect = function () {
    return isSelect();
  };
  this.unSelect = function () {
    unSelectSelf();
  };
  this.select = function() {
    selectSelf();
  };

  function isSelect() {
    return self.element.hasClass('select');
  }
  function selectSelf() {
    self.element.addClass('select');

    if (tabClickHandle) {
      tabClickHandle(self.type);
    }
  }
  function unSelectSelf() {
    self.element.removeClass('select');
  }
}


function ZZTabViews(itemClickHandle, listType) {
  var self = this;
  var tabViews = {};

  this.element = $('\
  <div class="zz-tab-view-container">\
  </div>\
  ');

  this.showTabView = function (type) {
    showTabView(type);
  };

  function showTabView(currentSelectTabViewType) {
    unSelectPrevTabView(currentSelectTabViewType);

    if (tabViews[currentSelectTabViewType]) {
      tabViews[currentSelectTabViewType].select();
    }
  }
  this.update = function (tabViewArray) {
    initTabViews(tabViewArray);
  };

  this.refresh = function (type) {
    if (tabViews[type]) {
      tabViews[type].refresh();
    }
  };

  function unSelectPrevTabView(currentSelectTabViewType) {

    for (var name in tabViews) {
      if (name !== currentSelectTabViewType && tabViews[name].isSelect()) {
        tabViews[name].unSelect();
        break;
      }
    }
  }
  function clearTabViews() {
    tabViews = {};
    self.element.empty();
  }
  function initTabViews(tabViewArray) {
    clearTabViews();

    tabViewArray.forEach(function (item) {
      var tabViewItem = new ZZTabView(item, itemClickHandle, listType);
      self.element.append(tabViewItem.element);
      tabViews[item.type] = tabViewItem;
    });
  }
}

function ZZTabView(tabViewInfo, itemClickHandle, listType) {
  var self = this;
  this.element = $('\
  <div class="zz-tab-view">\
  </div>\
  ');
  this.element.attr('type', tabViewInfo.type);
  this.type = tabViewInfo.type;

  var dataList = new (eval(listType))(this.type, itemClickHandle);
  this.element.append(dataList.element);

  var dropload = this.element.dropload({
    domUp: {
      domClass: 'dropload-up',
      domRefresh: '<div class="dropload-refresh">↓下拉刷新</div>',
      domUpdate: '<div class="dropload-update">↑释放更新</div>',
      domLoad: '<div class="dropload-load"><span class="loading"></span></div>'
    },
    domDown: {
      domClass: 'dropload-down',
      domRefresh: '<div class="dropload-refresh">↑上拉加载更多</div>',
      domUpdate: '<div class="dropload-update">↓释放加载</div>',
      domLoad: '<div class="dropload-load"><span class="loading"></span></div>'
    },
    loadUpFn: function (me) {
      if (dataList.isLoading) {
        return me.resetload();
      }
      dataList.refresh(function (result) {
        if (result)
          me.resetload();
      });
    },
    loadDownFn: function (me) {
      if (dataList.isLoading) {
        return me.resetload();
      }
      dataList.loadMore(function (result) {
        if (result)
          me.resetload();
      });
    }
  });


  this.refresh = function () {
    dataList.refresh(function (result) {});
  };
  this.isSelect = function () {
    return isSelect();
  };
  this.unSelect = function () {
    unSelectSelf();
  };
  this.select = function() {
    selectSelf();
  };
  function isSelect() {
    return self.element.hasClass('select');
  }
  function selectSelf() {
    self.element.addClass('select');
    dataList.load(function(){});
  }
  function unSelectSelf() {
    self.element.removeClass('select');
  }
}

















