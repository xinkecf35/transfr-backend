/* eslint-disable no-var */
'use strict';
var conn = new Mongo();
var db = conn.getDB('transfr');
var cursor = db.vcards.find({address: {$exists: true}});
while (cursor.hasNext()) {
  var card = cursor.next();
  if (typeof card.address.length == 'number') {
    card.address.forEach((address) => {
      address.value = ';;' + address.value + ';;;;';
    });
  } else {
    card.address.value = ';;' + card.address.value + ';;;;';
  }
  /*
  requests.push({
    'updateOne': {
      'filter': {'_id': card._id},
      'update': {'$set': {'address.$[].value': ';;' card.address.$[].value + ';;;;'}}
    },
  });
  */
  db.vcards.save(card);
  printjson(card);
}
