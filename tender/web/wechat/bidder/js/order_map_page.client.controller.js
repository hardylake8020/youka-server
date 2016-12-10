$(function () {
  var order = document.getElementById('error3').getAttribute('data-value');
  try {
    order = JSON.parse(order);
  }
  catch(e) {
    return alert('无效运单!');
  }

  var bodyElement = $('body');

  var zzOrderMap = new ZZOrderMap();
  bodyElement.append(zzOrderMap.element);

  zzOrderMap.init();
  zzOrderMap.show(order, getEvents(order));
});

function getEvents(order) {
  var events = [].concat(order.pickup_sign_events, order.pickup_events, order.delivery_sign_events, order.delivery_events, order.halfway_events);
  events.sort(function (a, b) {
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });

  return events;
}
