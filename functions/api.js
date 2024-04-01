import express, { Router } from 'express';
import serverless from 'serverless-http';
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const api = express();

const router = Router();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
  AUTH_URL,
  BASE_URL,
  MARKETPLACE_ID,
} = process.env;

router.get('/hello', (req, res) => res.send('Hello World!'));

router.get('/getInventory', (req, res) => {
  let accessToken;

  // get access token
  axios
    .post(AUTH_URL, {
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
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
          const data = response.data;
          // Split data into rows
          const rows = data.split('\n');

          // Extract column headers
          const headers = rows.shift().split('\t');
          const items = rows.map((row) => {
            const columns = row.split('\t');
            const item = {};
            headers.forEach((header, index) => {
              item[header] = columns[index];
            });
            return item;
          });
          return items; // Return the items object
        });
      };

      //get reportDocument
      const getReportDocument = (reportDocId) => {
        let url;
        axios(`${BASE_URL}/reports/2021-06-30/documents/${reportDocId}`, {
          headers,
        })
          .then((response) => {
            parseData(response.data.url).then((items) => {
              res.status(200).json({ items });
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
        axios(`${BASE_URL}/reports/2021-06-30/reports/${reportId}`, {
          headers,
        })
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
          marketplaceIds: [MARKETPLACE_ID],
          reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
          dataStartTime: '2024-03-25T20:11:24.000Z',
        };
        axios
          .post(`${BASE_URL}/reports/2021-06-30/reports`, data, { headers })
          .then((response) => {
            console.log('reportId: ', response.data.reportId);
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
    })
    .catch((err) => {
      console.log('Error: ', err);
    });
});

api.use('/api/', router);

export const handler = serverless(api);
