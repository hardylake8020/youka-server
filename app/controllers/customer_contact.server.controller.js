/**
 * Created by elinaguo on 15/3/26.
 */

'use strict';

var appDb = require('../../libraries/mongoose').appDb,
  customerContactError = require('../errors/customer_contact'),
  CustomerContact = appDb.model('CustomerContact');

exports.getByCompanyId = function (req, res, next) {
  var company_id = req.body.company_id;
  CustomerContact.find({company: company_id}, function (err, customer_contacts) {
    if (err) {
      return res.send({err: customerContactError.internal_system_error});
    }
    else {
      return res.send(customer_contacts);
    }
  });
};

exports.getCustomers = function (req, res, next) {
  var user = req.user || {};
  if (!user.company) {
    return res.send([]);
  }

  CustomerContact.find({company: user.company}, function (err, customerContacts) {
    if (err || !customerContacts) {
      return res.send({err: customerContactError.internal_system_error});
    }
    return res.send(customerContacts);
  });
};

exports.getCustomersByFilter = function (req, res, next) {
  var user = req.user || {};
  var customer_name = req.query.customer_name || '';
  if (!user.company) {
    return res.send([]);
  }

  CustomerContact.find({
    company: user.company,
    customer_name: {$regex: customer_name, $options: 'i'}
  }).limit(10).select('customer_name').exec(function (err, names) {
    if (err || !names) {
      return res.send({err: customerContactError.internal_system_error});
    }
    return res.send(names);
  });
};

exports.create = function (req, res, next) {
  var company_id = req.body.company_id || '';
  var customer_name = req.body.customer_name || '';
  CustomerContact.findOne({company: company_id, customer_name: customer_name}, function (err, customerContact) {
    if (err) {
      return res.send({err: customerContactError.internal_system_error});
    }
    else if (customerContact) {
      return res.send({err: customerContactError.contact_exist});
    }
    else {
      var newCustomerContact = new CustomerContact({
        company: company_id,
        customer_name: customer_name
      });
      newCustomerContact.save(function (err, customerContactEntity) {
        if (err) {
          return res.send({err: customerContactError.internal_system_error});
        }
        else {
          return res.send(customerContactEntity);
        }
      });
    }
  });
};
