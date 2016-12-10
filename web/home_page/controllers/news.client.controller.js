/**
 * Created by zhuzhu on 15/10/14.
 */

$(function(){

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {

      var newsLink = bodyElement.find('.zz-home-header .link .news');
      newsLink.addClass('current');
      var menu = new initMenu();
      new Operation(bodyElement);
    });
  });

});

function Operation(bodyElement) {
  var allElement = {
    all : bodyElement.find('.all'),
    companyNews : bodyElement.find('.dynamic'),
    industryNews : bodyElement.find('.information'),
    mediaReport : bodyElement.find('.report'),
    Search: bodyElement.find('.search'),
    typeItems: bodyElement.find('.link .item'),
    listContainer: bodyElement.find('.list-container'),
    template: bodyElement.find('#template'),
    pagination: bodyElement.find('#page'),
    resultTip: bodyElement.find('.description .result-tip'),
    companyNewsCount: bodyElement.find('.description .classification .company-news .count'),
    industryNewsCount: bodyElement.find('.description .classification .industry-news .count'),
    mediaReportCount: bodyElement.find('.description .classification .media-report .count')
  };

  var params = GetQueryParams();
  var articleType = params['current_type'] || '';
  var currentPage = 0;

  allElement.typeItems.click(function () {
    var currentItem = $(this);

    if (currentItem.hasClass('select')) {
      return false;
    }

    allElement.typeItems.removeClass('select');
    currentItem.addClass('select');

    articleType = currentItem.attr('data-value');
    currentPage = 0;

    getArticleList();
  });
  allElement.Search.submit(function(e){
    currentPage = 0;
    getArticleList();

    return false;
  });

  function getArticleList() {
    allElement.listContainer.empty();
    var searchText = allElement.Search.find('.text').val() || '';
    allElement.resultTip.hide();

    $.ajax({
      data: {search: {text: searchText, type: articleType, currentPage: currentPage + 1}},
      type: 'get',
      url: '/news/list/read',
      dataType: 'json'
    })
      .done(function (result) {
        if (result.list && result.list.length > 0) {
          formatData(result.list);
          allElement.template.tmpl(result.list).appendTo(allElement.listContainer);
        }
        else {
          allElement.resultTip.show();
        }
        result.totalCount = parseInt(result.totalCount) || 0;
        result.limit = parseInt(result.limit) || 5;

        refreshPagination(result.totalCount, result.limit, currentPage);
      })
      .fail(function (err) {
        console.log('get list err' + err);
      });
  }
  function formatData(dataList) {
    dataList.forEach(function (item) {
      if (item.cover) {
        item.cover = 'http://7xiwrb.com1.z0.glb.clouddn.com/' + item.cover;
      }

      if (item.created) {
        item.created = new Date(item.created).Format('yy-MM-dd');
      }

      item.current_type = articleType;
    });
  }

  function getAllCount() {
    $.ajax({
      data: {},
      type: 'get',
      url: '/news/count/all',
      dataType: 'json'
    })
      .done(function (result) {
        var allCount;
        if (!result || result.err) {
          return console.log('get article count failed');
          allCount = {
            companyNewsCount:0,
            industryNewsCount:0,
            mediaReportCount:0
          };
        }
        else {
          allCount = result;
        }

        refreshCount(allCount);
      })
      .fail(function (err) {
        console.log('get article count failed');
      });
  }
  function refreshCount(allCount) {
    allElement.companyNewsCount.text(allCount.companyNewsCount);
    allElement.industryNewsCount.text(allCount.industryNewsCount);
    allElement.mediaReportCount.text(allCount.mediaReportCount);
  }

  function initPagination(totalCount, pageSize, pageBtnCount) {
    allElement.pagination.page({
      total: totalCount,
      pageSize: pageSize,
      pageBtnCount: pageBtnCount,
      showFirstLastBtn: true,
      firstBtnText: '首页',
      lastBtnText: '尾页',
      prevBtnText: "上一页",
      nextBtnText: "下一页"
    });

    allElement.pagination.on("pageClicked", function (event, pageIndex) {
      currentPage = pageIndex;
      if (currentPage < 0) {
        currentPage = 0;
      }
      console.log('page: ' + currentPage);

      getArticleList();
    });
  }
  function refreshPagination(totalCount, pageSize, pageIndex) {
    var pageObject = allElement.pagination.data('page');
    pageObject.refreshPagination(totalCount, pageSize, pageIndex);
  }

  function chooseCurrentTable() {
    switch(articleType) {
      case 'company_news':
        allElement.companyNews.click();
        break;
      case 'industry_news':
        allElement.industryNews.click();
        break;
      case 'media_report':
        allElement.mediaReport.click();
        break;
      default:
        allElement.all.click();
        break;
    }
  }

  function init() {
    getAllCount();
    initPagination(0, 1, 7);

    chooseCurrentTable();
  }

  init();
}