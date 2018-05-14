const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let VCardProfile = new Schema({
  name: {type: String, required: true},
  fullName: {type: String, required: true},
  telephone: String,
  organization: String,
  address: String,
  nickname: String,
  note: String,
  birthday: String,
  impp: String,
});

module.exports = mongoose.model('VCardProfile', VCardProfile, 'vcard_profiles');
