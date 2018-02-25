const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserSchema = new Schema({
  username: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  created: {type: Date, default: Date.now},
  vcardProfiles: [{
    type: Schema.Types.ObjectId,
    ref: 'VCardProfile',
  }],
});

module.exports = mongoose.model('User', UserSchema, 'users');
