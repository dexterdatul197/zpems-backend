const crypto = require('crypto');
const oauth1a = require('oauth-1.0a');
const axios = require('axios');
const Settings = require('../models/settings.model');
const mongoose = require('mongoose');

// accountId: "",
// consumerKey: "",
// consumerSecret: "",
// tokenId: "",
// tokenSecret: "",

let CONSUMERKEY, CONSUMERSECRET, TOKENKEY, TOKENSECRET, REALM;

async function loadNetsuitConnectionSettings() {
  const settings = await Settings.findOne(); // replace with your actual query

  const { accountId, consumerKey, consumerSecret, tokenId, tokenSecret } =
    settings.netsuiteConnectionInfo;

  CONSUMERKEY = consumerKey;
  CONSUMERSECRET = consumerSecret;
  TOKENKEY = tokenId;
  TOKENSECRET = tokenSecret;
  REALM = accountId;

  console.log('settings loaded', settings);
}

mongoose.connection.on('connected', () => {
  loadNetsuitConnectionSettings().catch(console.error);
});

class Oauth1Helper {
  static getAuthHeaderForRequest(request) {
    const oauth = oauth1a({
      consumer: {
        key: CONSUMERKEY,
        secret: CONSUMERSECRET,
      },
      signature_method: 'HMAC-SHA256',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha256', key)
          .update(base_string)
          .digest('base64');
      },
      realm: REALM, // Replace 'your_realm' with the actual realm
      version: '1.0', // Specify OAuth version 1.0
    });
    const authorization = oauth.authorize(request, {
      key: TOKENKEY,
      secret: TOKENSECRET,
    });
    return oauth.toHeader(authorization);
  }
}

const createExpenseReport = async (body) => {
  const request = {
    url: `https://${REALM.toLowerCase()}.suitetalk.api.netsuite.com/services/rest/record/v1/expensereport`, // 8066958
    method: 'POST',
  };

  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  //   console.log(authHeader);

  const response = await axios.post(request.url, body, {
    headers: {
      Authorization: authHeader['Authorization'],
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const updateExpenseReport = async (id, body) => {
  const request = {
    url: `https://${REALM.toLowerCase()}.suitetalk.api.netsuite.com/services/rest/record/v1/expensereport/${id}?replace=expense`, // 8066958
    method: 'PATCH',
  };

  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  //   console.log(authHeader);

  const response = await axios.patch(request.url, body, {
    headers: {
      Authorization: authHeader['Authorization'],
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const executeSuiteQLQuery = async (query) => {
  const request = {
    url: `https://${REALM.toLowerCase()}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`,
    method: 'POST', // TODO: is this correct? what is it for?
  };

  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);

  const response = await axios.post(
    request.url,
    {
      // q: 'SELECT * FROM expensecategory',
      q: query,
    },
    {
      headers: {
        Authorization: authHeader['Authorization'],
        'Content-Type': 'application/json',
        Prefer: 'transient',
      },
    }
  );
  return response.data;
};

const createTimeEntry = async (body) => {
  const request = {
    url: `https://${REALM.toLowerCase()}.suitetalk.api.netsuite.com/services/rest/record/v1/timebill`,
    method: 'POST',
  };

  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  //   console.log(authHeader);

  const response = await axios.post(request.url, body, {
    headers: {
      Authorization: authHeader['Authorization'],
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const updateTimeEntry = async (id, body) => {
  const request = {
    url: `https://${REALM.toLowerCase()}.suitetalk.api.netsuite.com/services/rest/record/v1/timebill/${id}`,
    method: 'PATCH',
  };

  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  //   console.log(authHeader);

  const response = await axios.patch(request.url, body, {
    headers: {
      Authorization: authHeader['Authorization'],
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

module.exports = {
  loadNetsuitConnectionSettings,
  executeSuiteQLQuery,
  createExpenseReport,
  updateExpenseReport,
  createTimeEntry,
  updateTimeEntry,
};
