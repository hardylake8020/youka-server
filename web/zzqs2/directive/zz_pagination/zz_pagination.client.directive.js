/**
 * Created by elinaguo on 15/5/16.
 */
/**
 * function: 分页UI
 * author: elina
 *
 *  html代码
 *  <zz-pagination config="pagination"></zz-pagination>
 *
 *  angularjs代码
    $scope.pagination= {
                  currentPage: 1,                     //default
                  limit: 20,                          //default   每页显示几条
                  pageNavigationCount: 5,             //default   分页显示几页
                  totalCount: 0,
                  pageCount: 0,
                  limitArray: [10, 20, 30, 40, 100],  //default   每页显示条数数组
                  pageList: [1],                      //显示几页的数字数组
                  canSeekPage: true,                  //default   是否可以手动定位到第几页
                  canSetLimit: true,                  //default   是否可以设置每页显示几页
                  isShowTotalInfo: true,              //default   是否显示总记录数信息
                  onCurrentPageChanged: null or function(callback){
                                                  //do something
                                                  function(data){
                                                    //data.totalCount, data.limit
                                                    callback(data);
                                                  }
                                                }
              };
    $scope.pagination.render(); //渲染pagination
 *  }
 *
 */




zhuzhuqs.directive('zzPagination',[function(){
  return {
    restrict: 'EA',
    template: '<div class="zz-pagination" ng-show="config.pageCount>0">'
                +'<div class="pagination_info">'
                    +'<div ng-show="config.isShowTotalInfo" class="base_info">总数: {{config.totalCount}}</div>'
                    +'<div ng-show="config.canSetLimit" class="limit_set"><span>每页显示:</span>'
                        +'<select ng-options="limitItem for limitItem in config.limitArray" ng-change="config.changePageLimit()" ng-model="config.limit" ></select>'
                    +'</div>'
                    +'<div ng-show="config.canSeekPage" class="currentPage_set">'
                      +'<span>跳转至第</span>'
                      +'<input  ng-model="config.currentPage" ng-change="config.seekPage(config.currentPage);"/>'
                      +'<span>页</span>'
                    +'</div>'
                +'</div>'
                +'<div class="page_list">'
                  +'<ul>'
                    +'<li ng-show="config.currentPage > 1" ng-click="config.changePage(1);"><a>首页</a></li>'
                    +'<li ng-show="config.currentPage > 1" ng-click="config.changePage(config.currentPage - 1);"><a>上一页</a></li>'
                    +'<li ng-repeat="pageNumber in config.pageList" ng-click="config.changePage(pageNumber);" ng-class="(config.currentPage == pageNumber)?\'current\':\'\'"><a>{{pageNumber}}</a></li>'
                    +'<li ng-show="config.currentPage < config.pageCount" ng-click="config.changePage(config.currentPage + 1);"><a>下一页</a></li>'
                    +'<li ng-show="config.currentPage < config.pageCount" ng-click="config.changePage(config.pageCount)"><a>最后</a></li>'
                  +'</ul>'
                +'</div>'
              +'</div>',
    replace: true,
    scope: {
      config: '='
    },

    link: function(scope, element, attributes){
      if(!scope.config){
        scope.config = {};
      }

      scope.config.render = function(){
        initConfig();
        refreshPageNavigation();
      };

      scope.config.changePage = function(newPage){
        switchPage(newPage);
      };

      scope.config.seekPage = function(newPage){
        if(!newPage)
          return;

        newPage = parseInt(newPage);
        if(newPage > scope.config.pageCount){
          return;
        }

        switchPage(newPage);
      };

      scope.config.changePageLimit = function(){
        scope.config.currentPage = 1;
        //limit已经通过ng－model改变
        scope.config.onCurrentPageChanged(function(data){
          //data.limit =  parseInt(data.limit);
          data.totalCount = data.totalCount;
          data.pageCount = Math.ceil(data.totalCount / data.limit);
        });
      };
      //
      //scope.$watch(function(){
      //    console.log('page changed');
      //    return scope.config.pageCount + scope.config.currentPage;
      //  },
      //  function(){
      //    console.log('currentPage changed');
      //    refreshPageNavigation();
      //  });

      scope.$watchCollection('config',function(){
        console.log('currentPage changed');
        refreshPageNavigation();
      });


      function initConfig(){
        if(!scope.config.currentPage || scope.config.currentPage === 0){
          scope.config.currentPage = 1;
        }

        if(!scope.config.limit || scope.config.limit === 0){
          scope.config.limit = 20;
        }

        if(!scope.config.totalCount){
          scope.config.totalCount = 0;
        }

        if(!scope.config.pageCount){
          scope.config.pageCount = 0;
        }

        if(!scope.config.limitArray || scope.config.limitArray.length === 0){
          scope.config.limitArray = [10,20,30,50,100];
        }

        if(!scope.config.pageNavigationCount || scope.config.pageNavigationCount === 0){
          scope.config.pageNavigationCount = 5;
        }

        if(scope.config.isShowTotalInfo === undefined || scope.config.isShowTotalInfo == null){
          scope.config.isShowTotalInfo = true;
        }

        if(scope.config.canSetLimit === undefined || scope.config.canSetLimit == null){
          scope.config.canSetLimit = true;
        }

        if(scope.config.canSeekPage === undefined || scope.config.canSeekPage == null){
          scope.config.canSeekPage = true;
        }

        if(!scope.config.onChange){
          scope.onChange = function(){
            console.log('Turn to the '+scope.config.currentPage + ' page');
          };
        }
      };

      function refreshPageNavigation(){
        if(scope.config.currentPage === '' || scope.config.currentPage <= 0){
          return scope.config.currentPage = 1;
        }

        scope.config.pageList.splice(0, scope.config.pageList.length);

        if(scope.config.pageCount > scope.config.pageNavigationCount){
          var length = ((scope.config.currentPage + scope.config.pageNavigationCount - 1) > scope.config.pageCount) ? scope.config.pageCount : (scope.config.currentPage + scope.config.pageNavigationCount -1 );
          var currentViewNumber = length - scope.config.pageNavigationCount + 1;
          for(var i=currentViewNumber; i<= length;i++){
            scope.config.pageList.push(i);
          }
        }else{
          for(var i=1;i<= scope.config.pageCount;i++){
            scope.config.pageList.push(i);
          }
        }
      };

      function switchPage(newPage){
        if(newPage === scope.config.currentPage ){
          return;
        }
        scope.config.currentPage = newPage;

        if(!scope.config.onCurrentPageChanged){
          console.log('currentPage changed!');
          return;
        }

        scope.config.onCurrentPageChanged(function(data){
          //data.limit =  parseInt(data.limit);
          data.totalCount = data.totalCount;
          data.pageCount = Math.ceil(data.totalCount / data.limit);
        });
      };
    }
  };
}]);
