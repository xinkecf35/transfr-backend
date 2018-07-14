const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const optionalAttributes = [
  'telephone',
  'organization',
  'address',
  'nickname',
  'note',
  'birthday',
  'impp',
];

let VCardSchema = new Schema({
  name: {type: String, required: true},
  fullName: {type: String, required: true},
  description: {type: String, required: true},
  telephone: String,
  organization: String,
  address: String,
  nickname: String,
  note: String,
  birthday: String,
  impp: String,
});
// Verify that required attributes are in body
VCardSchema.statics.verifyBody = function verifyBody(body) {
  if (!(('name' in body) && ('fullName' in body))) return false;
  return true;
};

VCardSchema.statics.setOptionalAttributes =
  function setOptionalAttributes(body, card) {
    optionalAttributes.forEach(function(attribute) {
      if (attribute in body) {
        card[attribute] = body[attribute];
      }
    });
  };

module.exports = mongoose.model('VCard', VCardSchema, 'vcards');
