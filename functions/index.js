const admin = require('firebase-admin');

admin.initializeApp();

Object.assign(
  exports,
  require('./accountWorkflows'),
  require('./eventWorkflows'),
  require('./impactWorkflows'),
  require('./partnerInquiry'),
  require('./publicStats'),
  require('./mediaLifecycle'),
);
