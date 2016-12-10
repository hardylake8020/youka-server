zhuzhuqs.factory('OrderService',
  ['$http', '$q', 'config', 'HttpService',
    function ($http, $q, config, HttpService) {
      return {
        createOrder: function (order, groupId) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order', {
            order: order,
            group_id: groupId
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        updateUnAssignedOrder: function (order, groupId) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/update', {
            order: order,
            group_id: groupId
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        deleteUnAssignedOrder: function (order_id) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/delete', {
            order_id: order_id
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        updateAssignedOrder: function (order, groupId) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/assignedorder/update', {
            order: order,
            group_id: groupId
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        deleteAssignedOrder: function (order_id) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/assignedorder/delete', {
            order_id: order_id
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;

        },
        batchDeleteOrders: function (order_ids) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/batchdelete', {
            order_ids: order_ids
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        batchCreate: function (infos, groupId) {
          return HttpService.postDataToServer(config.serverAddress + '/order/batchcreate', {
            infos: infos,
            group_id: groupId
          });
        },
        exportOrderPdf: function (orderId) {
          window.open(config.serverAddress + '/resources/pdf_templates/pdf?order_id=' + orderId);
        },
        exportOrder: function (filter) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/export', {
            params: filter
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        assignOrder: function (info) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/multiassign', info)
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        batchAssign: function (assignInfo) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/batchassign', {assignInfo: assignInfo})
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        continueAssignOrder: function (info) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/continueassign', info)
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getUnsignedOrder: function (currentPage, limit, sortName, sortValue, searchArray) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/unassigned', {
            currentPage: currentPage,
            limit: limit,
            sortName: sortName,
            sortValue: sortValue,
            searchArray: searchArray
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAllOrders: function (currentPage, limit, sortName, sortValue, searchArray) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/all', {
            currentPage: currentPage,
            limit: limit,
            sortName: sortName,
            sortValue: sortValue,
            searchArray: searchArray
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAbnormalOrders: function (currentPage, limit, sortName, sortValue, searchArray) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/abnormal', {
            currentPage: currentPage,
            limit: limit,
            sortName: sortName,
            sortValue: sortValue,
            searchArray: searchArray
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAbnormalOrderCount: function () {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/abnormal/count')
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getOrders: function (currentPage, limit, sortName, sortValue, searchName, searchValue) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order', {
            params: {
              currentPage: currentPage,
              limit: limit,
              sortName: sortName,
              sortValue: sortValue,
              searchName: searchName,
              searchValue: searchValue
            }
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAssignedOrderDetail: function (id, viewer) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/assignedOrderDetail', {
            params: {
              order_id: id,
              viewer: viewer
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getOrderById: function (id) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/detail', {
            params: {
              order_id: id
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getEventsByOrderId: function (orderId, viewer) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/transport_event', {
            params: {
              order_id: orderId,
              viewer: viewer
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getTracesByOrderId: function (orderId, viewer) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/trace', {
            params: {
              order_id: orderId,
              viewer: viewer
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        shareOrders: function (orderIds, allRecipients, isInputEmail) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/share', {
            order_ids: orderIds,
            recipients: allRecipients,
            isInputEmail: isInputEmail
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getCooperateCompanys: function () {
          var q = $q.defer();
          $http.get(config.serverAddress + '/company/partnercompanystaff').
            success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getRemainOrderCreateCount: function () {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/remainOrderCreateCount').
            success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getDriverOrders: function (driverNumber) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/map/alldriverorders', {
            params: {
              showNumber: driverNumber
            }
          })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getStatusString: function (status) {
          var statusString = '';

          switch (status) {
            case 'unAssigned':
              statusString = '未分配';
              break;
            case 'assigning':
              statusString = '分配中';
              break;
            case 'unPickupSigned':
            case 'unPickuped':
              statusString = '未提货';
              break;
            case 'unDeliverySigned':
            case 'unDeliveried':
              statusString = '未交货';
              break;
            case 'pickupSign':
              statusString = '提货签到';
              break;
            case 'pickup':
              statusString = '提货';
              break;
            case 'deliverySign':
              statusString = '交货签到';
              break;
            case 'delivery':
              statusString = '交货';
              break;
            case 'halfway':
              statusString = '中途事件';
              break;
            case 'completed':
              statusString = '已完成';
              break;
            default:
              break;
          }
          return statusString;
        },
        //获取被分享运单列表
        getSharedOrders: function (currentPage, limit) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/sharedorderlist', {params: {currentPage: currentPage, limit: limit}})
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        //获取被分享运单的事件信息
        getSharedOrderEventById: function (orderId) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/transport_event/sharedorderevent', {
            params: {
              order_id: orderId
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getSharedOrderAssignInfo: function (id) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/sharedorderassigninfo', {
            params: {
              order_id: id
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getSharedOrderTracesByOrderId: function (orderId) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/trace/sharedOrderTrace', {
            params: {
              order_id: orderId
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        updateOrderAssign: function (orderId, assignInfos) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/update/assigninfo', {
            'order_id': orderId,
            'assign_infos': assignInfos
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        handleAbnormalOrder: function (orderId) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/abnormal/handle', {
            params: {
              order_id: orderId
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getOperationOrderCount: function () {
          return HttpService.getDataFromServer(config.serverAddress + '/order/operation/count');
        },
        getSenderPickupAddressList: function (senderName, inputAddress) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/pickup_address/get', {
            params: {
              sender_name: senderName,
              pickup_address: inputAddress
            }
          }).success(function (data) {
            q.resolve(data);
          })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        }
      }
    }]);
