/**
 * Created by elinaguo on 15/5/20.
 */
/**
 * Created by elinaguo on 15/5/16.
 */
/**
 * function: 分页UI
 * author: elina
 *
 *  html代码
 *  <zz-list config="listConfig"></zz-list>
 *  angularjs代码
 *
 */


tender.directive('zzList', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_list/zz_list.client.directive.view.html',
    replace: true,
    transclude: true,
    scope: {
      config: '='
    },
    link: function (scope, element, attributes) {
      scope.enableOptionalCount = 0;
      scope.isSelectedAll = false;
      scope.isShowFieldOption = false;
      scope.selectedRows = [];

      //<editor-fold desc="Interface for parent">
      scope.config.load = function (callback) {
        refreshDisplay();
        if (!callback) {
          return;
        }

        callback();
        return;
      };

      scope.config.reLoad = function (callback) {
        scope.config.isSelectedAll = false;
        refreshDisplay();
        if (!callback)
          return;

        return callback();
      };
      //</editor-fold>

      //<editor-fold desc="Row Event Relation">

      scope.toggleSelectAll = function () {
        scope.isSelectedAll = !scope.isSelectedAll;

        scope.selectedRows.splice(0, scope.selectedRows.length);

        for (var i = 0; i < scope.config.rows.length; i++) {
          var currentRow = scope.config.rows[i];
          if (!currentRow.rowConfig.notOptional) {
            currentRow.selected = scope.isSelectedAll;

            if (scope.isSelectedAll) {
              scope.selectedRows.push(currentRow);
            }
          }
        }

        notify('selectedHandler', scope.selectedRows);
      };

      scope.onRowSelected = function (currentRow, event) {
        if (currentRow.rowConfig.notOptional) {
          return;
        }

        currentRow.selected = !currentRow.selected;
        if (currentRow.selected) {
          scope.selectedRows.push(currentRow);
        } else {
          for (var i = 0; i < scope.selectedRows.length; i++) {
            if (scope.selectedRows[i]._id === currentRow._id) {
              scope.selectedRows.splice(i, 1);
            }
          }
        }

        //update selected all
        if (scope.selectedRows.length === scope.enableOptionalCount) {
          scope.isSelectedAll = true;
        }
        else {
          scope.isSelectedAll = false;
        }

        notify('selectedHandler', scope.selectedRows, event);
      };

      scope.onRowClick = function (currentRow) {
        notify('rowClickHandler', currentRow);
      };

      scope.onRowInfoEdit = function (currentRow) {
        notify('rowInfoEditHandler', currentRow);
      };

      scope.onRowDelete = function (currentRow) {
        notify('rowDeleteHandler', currentRow);
      };

      scope.onRowExpand = function (currentRow) {
        closeAllRowExpand();
        currentRow.isExpand = !currentRow.isExpand;
      };

      scope.onSortItemClick = function (field, item) {
        field.curSort = item;
        field.isExpanded = false;
        notify('headerSortChangedHandler', field);
      };

      scope.onSearchItemSubmit = function (field) {
        field.isExpanded = false;
        notify('headerKeywordsChangedHandler', field);
      };

      scope.onHeaderFieldClick = function (field, event) {
        field.isExpanded = !field.isExpanded;
        event.stopPropagation();
      };

      scope.$on(GlobalEvent.onBodyClick, function () {
        for (var i = 0; i < scope.config.fields.length; i++) {
          scope.config.fields[i].isExpanded = false;
        }

        if (scope.isShowFieldOption) {
          scope.isShowFieldOption = false;
          notify('saveDisplayFields');
        }

      });

      scope.onFieldSettingAreaClick = function(event) {
        stopBubble(event);
      };

      scope.onFieldOptionButtonClick = function (event) {
        scope.isShowFieldOption = !scope.isShowFieldOption;

        if (!scope.isShowFieldOption) {
          notify('saveDisplayFields');
        }

        stopBubble(event);
      };
      scope.onFiledOptionColumnClick = function (fieldItem, event) {
        stopBubble(event);

        if (!scope.config.selectOptions || scope.config.selectOptions.length <= 0) {
          return;
        }

        if (fieldItem.isSelected) {
          fieldItem.isSelected = false;

          notify('updateDisplayFields');
        }
        else {
          var selectedCount = 0;
          scope.config.selectOptions.forEach(function (optionItem) {
            if (optionItem.isSelected) {
              selectedCount += 1;
            }
          });

          if (selectedCount < scope.config.fields_length) {
            fieldItem.isSelected = !fieldItem.isSelected;

            notify('updateDisplayFields');
          }

          //超过最大长度，则选不中。
        }
      };

      //</editor-fold>

      //<editor-fold desc="Private function">
      function closeAllRowExpand() {
        for (var i = 0; i < scope.config.rows.length; i++) {
          scope.config.rows[i].isExpand = false;
        }
      }

      function stopBubble(e) {
        if (e && e.stopPropagation)
          e.stopPropagation(); //非IE
        else
          window.event.cancelBubble = true; //IE
      }

      function initConfig() {
        if (scope.config.isOptional === undefined || scope.config.isOptional === null) {
          scope.config.isOptional = true;
        }
        if (scope.config.selectionOption === undefined || scope.config.selectionOption === null) {
          scope.config.selectionOption = {columnWidth: 1};
        }
        if (scope.config.handleOption === undefined || scope.config.handleOption === null) {
          scope.config.handleOption = {columnWidth: 2};
        }
        if (scope.config.isFieldSetting === undefined || scope.config.isFieldSetting === null) {
          scope.config.isFieldSetting = true;
        }

        if (scope.config.rowExpand === undefined || scope.config.rowExpand === null) {
          scope.config.rowExpand = {
            isSupport: false,
            text: '展开'
          };
        }
        if (scope.config.rowExpand.enable === undefined || scope.config.rowExpand.enable === null) {
          scope.config.rowExpand.enable = false;
        }
        if (scope.config.rowExpand.expandText === undefined || scope.config.rowExpand.expandText === '') {
          scope.config.rowExpand.expandText = '展开';
        }
        if (scope.config.rowExpand.cancelText === undefined || scope.config.rowExpand.cancelText === '') {
          scope.config.rowExpand.cancelText = '取消';
        }

        if (scope.config.rowExpand.selfCloseButton === undefined || scope.config.rowExpand.selfCloseButton === '') {
          scope.config.rowExpand.selfCloseButton = false;
        }

        if (scope.config.isSelectedAll === undefined || scope.config.isSelectedAll === null) {
          scope.config.isSelectedAll = false;
        }

        if (!scope.config.selectedRows) {
          scope.config.selectedRows = [];
        }

        if (!scope.config.fields_length) {
          scope.config.fields_length = 7; //默认显示7个字段
        }

        refreshDisplay();
      };

      function refreshDisplay() {
        scope.enableOptionalCount = 0;
        scope.selectedRows.splice(0, scope.selectedRows.length);
        scope.isSelectedAll = false;

        if (scope.config.fields && scope.config.fields.length > 0) {
          for (var i = 0; i < scope.config.fields.length; i++) {
            if (!scope.config.fields[i].columnWidth) scope.config.fields[i].columnWidth = 1;

            scope.config.fields[i].columnWidthStyle = 'zz-list-col-' + scope.config.fields[i].columnWidth;

            if (scope.config.fields[i].self_column_class) {
              scope.config.fields[i].columnWidthStyle += (' ' + scope.config.fields[i].self_column_class);
            }

            scope.config.fields[i].isExpanded = false;
          }
          for (var i = 0; i < scope.config.rows.length; i++) {
            scope.config.rows[i].selected = false;
            scope.config.rows[i].isExpand = false;

            if (!scope.config.rows[i].disabled) {
              scope.enableOptionalCount++;
            }
          }
        }
        if (!scope.config.selectionOption.columnWidth) {
          scope.config.selectionOption.columnWidth = 1;
        }
        scope.config.selectionOptionColumnWidthStyle = 'zz-list-col-' + scope.config.selectionOption.columnWidth;
        if (!scope.config.handleOption.columnWidth) {
          scope.config.handleOption.columnWidth = 2;
        }
        scope.config.handleOptionColumnWidthStyle = 'zz-list-col-' + scope.config.handleOption.columnWidth;

      }

      //</editor-fold>

      function notify(notifyType, params, event) {
        if (scope.config.events) {
          if (scope.config.events[notifyType] && scope.config.events[notifyType].length > 0) {
            for (var i = 0; i < scope.config.events[notifyType].length; i++) {
              var currentEvent = scope.config.events[notifyType][i];
              if (currentEvent && typeof(currentEvent) === 'function') {
                currentEvent(params, event);
              }
            }
          }
        }
      };

      initConfig();
    }
  };
}]);
