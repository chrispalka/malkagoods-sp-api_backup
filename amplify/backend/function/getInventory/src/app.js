/*
Use the following code to retrieve configured secrets from SSM:

*/
// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started.html

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const secret_name = 'malkagoods/sp-api-secret';

const client = new SecretsManagerClient({
  region: 'us-east-1',
});

const getSecret = async () => {
  try {
    return await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: 'AWSCURRENT', // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
  } catch (error) {
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }
};

/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	CLIENT_ID
	CLIENT_SECRET
	REFRESH_TOKEN
	AUTH_URL
	BASE_URL
	MARKETPLACE_ID
Amplify Params - DO NOT EDIT */

const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const axios = require('axios');

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/getInventory', async function (req, res) {
  const secretValue = await getSecret();
  const spClientSecret = secretValue.SecretString
    ? JSON.parse(secretValue.SecretString)['SP_CLIENT_SECRET']
    : null;
  let accessToken;

  const body = {
    grant_type: 'refresh_token',
    refresh_token: process.env.REFRESH_TOKEN,
    client_id: process.env.CLIENT_ID,
    client_secret: spClientSecret,
  };

  // get access token
  axios
    .post(process.env.AUTH_URL, body)
    .then((response) => {
      accessToken = response.data.access_token;

      // Once the access token is obtained, proceed with API calls
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-amz-access-token': accessToken,
      };

      const parseData = (url) => {
        return axios(url).then((response) => {
          const result = [];
          const data = response.data;
          // Split data into rows
          const rows = data.split('\n');

          // Extract column headers
          const asinIndex = rows.shift().split('\t').indexOf('asin1');
          rows.forEach((row) => {
            result.push(row.split('\t')[asinIndex]);
          });
          // const items = rows.map((row) => {
          //   const asin = row.split('\t')[asinIndex];
          //   const item = {};
          //   headers.forEach((header, index) => {
          //     item[header] = columns[index];
          //   });
          //   return item;
          // });
          return result; // Return the items object
        });
      };

      const uploadJSON = async (items) => {
        try {
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: 'products',
            Body: JSON.stringify(items),
            ContentType: 'application/json; charset=utf-8',
          };
          await S3.putObject(params).promise();
          console.log('Upload Complete');
          res.sendStatus(200);
        } catch (e) {
          console.log('Upload Error: ', e);
          res.sendStatus(422);
        }
      };

      const getItems = (asinArr) => {
        // ?marketplaceIds=ATVPDKIKX0DER
        axios(
          `${process.env.BASE_URL}/catalog/2022-04-01/items/${ASIN}?marketplaceIds=${process.env.MARKETPLACE_ID}`,
          {
            headers,
          }
        )
          .then((response) => {
            /*

              ***IMPLEMENT ***
              uploadJSON(items);

            */

            console.log(response.data);
          })
          .catch((error) => {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error(
                'Server responded with status code:',
                error.response.status
              );
              console.error('Response data:', error.response.data);
            } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('Error setting up the request:', error.message);
            }
            res.status(500).json({ error: 'Error fetching report document' });
          });
      };

      //get reportDocument
      const getReportDocument = (reportDocId) => {
        axios(
          `${process.env.BASE_URL}/reports/2021-06-30/documents/${reportDocId}`,
          {
            headers,
          }
        )
          .then((response) => {
            console.log(response.data.url);
            parseData(response.data.url).then((items) => {
              getItems(items);
            });
          })
          .catch((error) => {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error(
                'Server responded with status code:',
                error.response.status
              );
              console.error('Response data:', error.response.data);
            } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('Error setting up the request:', error.message);
            }
            res.status(500).json({ error: 'Error fetching report document' });
          });
      };

      //get reportDocId
      const getReportDocId = (reportId) => {
        axios(
          `${process.env.BASE_URL}/reports/2021-06-30/reports/${reportId}`,
          {
            headers,
          }
        )
          .then((response) => {
            if (response.data.processingStatus === 'DONE') {
              getReportDocument(response.data.reportDocumentId);
            } else {
              console.log('Report in progress...');
              setTimeout(() => {
                getReportDocId(response.data.reportId);
              }, 10000);
            }
            console.log(response.data);
          })
          .catch((error) => {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error(
                'Server responded with status code:',
                error.response.status
              );
              console.error('Response data:', error.response.data);
            } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('Error setting up the request:', error.message);
            }
          });
      };

      // create report
      const createReport = () => {
        const data = {
          marketplaceIds: [process.env.MARKETPLACE_ID],
          reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
          dataStartTime: '2024-03-25T20:11:24.000Z',
        };
        axios
          .post(`${process.env.BASE_URL}/reports/2021-06-30/reports`, data, {
            headers,
          })
          .then((response) => {
            getReportDocId(response.data.reportId);
          })
          .catch((error) => {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error(
                'Server responded with status code:',
                error.response.status
              );
              console.error('Response data:', error.response.data);
            } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('Error setting up the request:', error.message);
            }
          });
      };

      createReport();
      // getItem('B0B1QZFLDC');
    })
    .catch((err) => {
      console.log('Error: ', err);
    });
});

app.get('/inventory/*', function (req, res) {
  // Add your code here
  res.json({ success: 'get call succeed!', url: req.url });
});

// /****************************
//  * Example post method *
//  ****************************/

// app.post('/inventory', function (req, res) {
//   // Add your code here
//   res.json({ success: 'post call succeed!', url: req.url, body: req.body });
// });

// app.post('/inventory/*', function (req, res) {
//   // Add your code here
//   res.json({ success: 'post call succeed!', url: req.url, body: req.body });
// });

// /****************************
//  * Example put method *
//  ****************************/

// app.put('/inventory', function (req, res) {
//   // Add your code here
//   res.json({ success: 'put call succeed!', url: req.url, body: req.body });
// });

// app.put('/inventory/*', function (req, res) {
//   // Add your code here
//   res.json({ success: 'put call succeed!', url: req.url, body: req.body });
// });

// /****************************
//  * Example delete method *
//  ****************************/

// app.delete('/inventory', function (req, res) {
//   // Add your code here
//   res.json({ success: 'delete call succeed!', url: req.url });
// });

// app.delete('/inventory/*', function (req, res) {
//   // Add your code here
//   res.json({ success: 'delete call succeed!', url: req.url });
// });

// app.listen(3000, function () {
//   console.log('App started');
// });

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
