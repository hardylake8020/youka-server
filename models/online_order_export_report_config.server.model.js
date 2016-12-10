/**
 * Created by wd on 16/05/24.
 */

'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

    var OnlineOrderExportReportConfigSchema = new Schema({
        company_id: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        fields: {
            type: String,
            default: ''
        }
    });

    OnlineOrderExportReportConfigSchema.plugin(timestamps, {
        createdAt: 'created',
        updatedAt: 'updated'
    });

    appDb.model('OnlineOrderExportReportConfig', OnlineOrderExportReportConfigSchema);

};
