const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shortId = require('shortid'); // I write my own for giggles
const ID_LENGTH = 9;

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
  profileId: {type: String, required: true},
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

VCardSchema.pre('validate', function(next) {
  let card = this;
  if (this.isNew) {
    card.profileId = shortId.generate(ID_LENGTH);
    let uniqueQuery = this.constructor.findOne({profileId: card.profileId});
    uniqueQuery.exec().then(function(result) {
      if (result) {
        card.profileId = shortId.generate(ID_LENGTH);
      }
    }).catch(function(error) {
      next(err);
    });
  }
  next();
});

VCardSchema.methods.setOptionalAttributes =
  function setOptionalAttributes(body) {
    let card = this;
    optionalAttributes.forEach(function(attribute) {
      if (attribute in body) {
        card[attribute] = body[attribute];
      }
    });
  };

// Verify that required attributes are in body
VCardSchema.statics.verifyBody = function verifyBody(body) {
  if (!(('name' in body) && ('fullName' in body) && ('description' in body))) {
    return false;
  }
  return true;
};

module.exports = mongoose.model('VCard', VCardSchema, 'vcards');
