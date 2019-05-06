require('dotenv').config();
const mongoose = require('mongoose');
const dbURI = process.env.DATABASE_URI;
const VCard = require('../models/vcard');

const data = [
  {
    name: 'Xinke Chen',
    fullName: 'Chen;Xinke',
    description: 'Work',
    telephone: [{telephone: '215-634-1128', type: 'Work'}],
    email: [
      {email: 'xic90@pitt.edu', type: 'Work'},
      {email: 'xinkecf35@gmail.com', type: 'Home'},
    ],
  },
  {
    name: 'Xinke Chen',
    fullName: 'Chen;Xinke',
    description: 'Personal',
    telephone: [{telephone: '215-480-2006', type: 'Home'}],
    email: [
      {email: 'xic90@pitt.edu', type: 'Work'},
      {email: 'xinkecf35@gmail.com', type: 'Home'},
    ],
  },
];

mongoose.connect(dbURI, {useNewUrlParser: true});
