/**
 * Created by Wayne on 15/11/20.
 */
'use strict';

/*
* 前后端统一，每增加一种类型的消息，都需要添加两条枚举。
*
*/

zhuzhuqs.constant('InformEnum',
  {
    web_socket_connection_success: '/socket/web/connection/success',
    web_abnormal_order_single: '/socket/web/abnormal_order/single',
    web_add_user: '/socket/web/user/add',
    web_abnormal_order_batch: '/socket/web/abnormal_order/batch',
    web_abnormal_order_clear: '/socket/web/abnormal_order/clear',

    onAddUser: 'onAddUser',
    onSingleAbnormalOrder: 'onSingleAbnormalOrder',
    onBatchAbnormalOrder: 'onBatchAbnormalOrder'
  }
);