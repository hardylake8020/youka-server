zhuzhuqs.factory('CompanyService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    createCompany: function (obj) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company', obj)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    createGroup: function (company_id, name) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group', {
        company_id: company_id,
        name: name
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getViewGroupList: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/group')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getExecuteGroupList: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/group/execute')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getUsersOfGroup: function (group_id) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/group/employees', {
        params: {
          group_id: group_id
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
    addUserToGroup: function (group_id, company_id, email) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group/invite/employee', {
        group_id: group_id,
        company_id: company_id,
        email: email
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    addUsersToGroup: function (usernames, company_id, group_id) {
      var params = {
        usernames: usernames,
        company_id: company_id,
        group_id: group_id
      };
      return this.postDataToServer('/group/invite/multiemployee', params);
    },
    getPartners: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/partners')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getPartnerCompanys: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/company')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getPartnerDrivers: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/driver')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getCompanyCustomers: function (data) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/customer_contact/user')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getCompanyCustomersByFilter: function (data) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/customer_contact/filter', {
        params: data
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getContactsByFilter: function (data) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/contact/keyword', {
        params: data
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },

    batchInviteCompany: function (companyInfos) {
      return this.postDataToServer(config.serverAddress + '/company/invite/batch', {
        company_infos: companyInfos
      });
    },
    inviteCompanyByName: function (name) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company/invitebycompanyname', {
        company_name: name
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    inviteCompanyByEmail: function (email) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company/invitebyusername', {
        username: email
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    inviteDriverByPhone: function (phone) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/driver/invite', {
        username: phone
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    inviteDriverByPhone1: function (phone) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/driver/invite1', {
        username: phone
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },

    getMatchCompanies: function (companyNameSegment) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company/matchname', {
        companyNameSegment: companyNameSegment
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    deleteGroup: function (groupId) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group/delete/user_group', {
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
    deleteUserFromGroup: function (groupId, userId) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group/delete/group_user', {
        group_id: groupId,
        group_user_id: userId
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },

    deleteInviteDriver: function (driverPhone) {
      return this.postDataToServer(config.serverAddress + '/company/invite_driver/delete', {
        driver_phone: driverPhone
      });
    },
    deleteCorporateDriver: function (driverId) {
      return this.postDataToServer(config.serverAddress + '/company/corporate_driver/delete', {
        driver_id: driverId
      });
    },
    deleteInviteCompanyById: function (inviteId) {
      return this.postDataToServer(config.serverAddress + '/company/invite_company/delete/id', {
        invite_id: inviteId
      });
    },
    deleteCorporateCompany: function (partnerId) {
      return this.postDataToServer(config.serverAddress + '/company/corporate_company/delete', {
        partner_id: partnerId
      });
    },
    updateCompanyInfo: function (info) {
      return this.postDataToServer(config.serverAddress + '/company/update', {
        address: info.address,
        type: info.type,
        name: info.name,
        employees: info.employees,
        contact_name: info.contact_name,
        contact_phone: info.contact_phone,
        business_license: info.business_license
      });
    },

    removeAddressById: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/address/remove/id', params);
    },
    getAddressList: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/address/list', params);
    },
    batchCreateAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/create/batch', params);
    },
    createAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/create/single', params);
    },
    updateAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/update', params);
    },
    captureAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/capture', params);
    },
    removeVehicleById: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/vehicle/remove/id', params);
    },
    getVehicleList: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/vehicle/list', params);
    },
    batchCreateVehicle: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/vehicle/create/batch', params);
    },
    createVehicle: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/vehicle/create/single', params);
    },
    updateVehicle: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/vehicle/update', params);
    },

    getConfiguration: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/configuration/read', params);
    },
    updateOrderConfiguration: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/configuration/order/update', params);
    },
    updatePushConfiguration: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/configuration/push/update', params);
    },
    getDataFromServer: function (url, params) {
      var q = $q.defer();
      $http.get(url, {params: params})
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err)
        });
      return q.promise;
    },
    postDataToServer: function (url, params) {
      var q = $q.defer();
      $http.post(url, params)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    findDriverEvaluations: function(params){
      return $q(function(resolve, reject){
        $http.get(config.serverAddress + '/company/find-driver-evaluations', {params : params})
        .success(function (data) {
          resolve(data);
        })
        .error(function (err) {
          reject(err);
        });
      });
    }
  };
}]);
