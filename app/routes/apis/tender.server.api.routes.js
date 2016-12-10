'use strict';

var tenderApi = require('../../controllers/apis/api.tender');
var signFilter = require('../../filters/apis/api.signature');

module.exports = function (app) {
    app.route('/api/tender/create').post(signFilter.validSignature, tenderApi.createTender);
    app.route('/api/tender/createbatch').post(signFilter.validSignature, tenderApi.createTenders);
    app.all('/api/tender/query-bid-winner', signFilter.validSignature, tenderApi.queryBidWinner);
};