const { initializeApp } = require('firebase-admin/app');

initializeApp();

Object.assign(
  exports,
  require('./accountWorkflows'),
  require('./eventWorkflows'),
  require('./impactWorkflows'),
  require('./partnerInquiry'),
  require('./publicStats'),
  require('./mediaLifecycle'),
);
