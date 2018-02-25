const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

let UserSchema = new Schema({
  username: {
              type: String,
              required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  created: {type: Date, default: Date.now},
  vcardProfiles: [{
    type: Schema.Types.ObjectId,
    ref: 'VCardProfile',
  }],
});

// hashes password with bcrypt
UserSchema.pre('save', function(next) {
  let user = this;
  console.log('pre fire');
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        console.log(hash);
        next();
      });
    });
  } else {
    return next();
  }
});

// Create method to compare password input to password saved in database
UserSchema.methods.comparePassword = function(pw, cb) {
  bcrypt.compare(pw, this.password, function(err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema, 'users');
