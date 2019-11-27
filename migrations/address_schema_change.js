/* eslint-disable no-var */
'use strict';
var conn = new Mongo();
var db = conn.getDB('transfr');
var cursor = db.vcards.find({address: {$exists: true}});
while (cursor.hasNext()) {
  var card = cursor.next();
  card.address = {type: 'Default', value: card.address};
  db.vcards.save(card);
  printjson(card);
}
