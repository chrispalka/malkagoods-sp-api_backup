import express, { Router } from 'express';
import serverless from 'serverless-http';

const api = express();

const router = Router();
router.get('/hello', (req, res) => res.send('Hello World!'));

api.use('/api/', router);

export const handler = serverless(api);

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const serverless = require('serverless-http');

// const app = express();

// app.use(cors());

// const router = express.Router();

// router.get('/', (req, res) => {
//   res.json({
//     hello: 'hi!',
//   });
// });

// router.post('/createReport', async (req, res) => {
//   let body = JSON.parse(Buffer.from(req.body, 'base64').toString());

//   const { firstName, lastName, email, phone, message } = body.data;
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     name: 'www.gmail.com',
//     auth: {
//       user: process.env.EMAIL_ADDRESS,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   const mailOptionsToDava = {
//     from: process.env.EMAIL_ADDRESS,
//     to: process.env.EMAIL_ADDRESS_TO,
//     subject: `New contact request from: ${firstName} ${lastName}`,
//     text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n${
//       phone !== '' ? 'Phone: ' + phone : ''
//     }\n${message !== '' ? 'Message: \n\n' + message : ''}
//     `,
//   };
//   const mailOptionsToRequester = {
//     from: process.env.EMAIL_ADDRESS,
//     to: email,
//     subject: `Auto-Reply From Dava Solutions`,
//     text: `Hello ${firstName},\n\nThank you for reaching out. \n\nA member of our team will get back to you as soon as possible. \n\nFor a faster response, you may text us at: (678) 424-7208.`,
//   };

//   Promise.all([
//     transporter.sendMail(mailOptionsToDava),
//     transporter.sendMail(mailOptionsToRequester),
//   ])
//     .then((response) => {
//       res.status(200).send('success');
//       console.log(response);
//     })
//     .catch((err) => {
//       res.status(404);
//       console.log(err);
//     });

//   // transporter.sendMail(mailOptionsToRequester, (err, res) => {
//   //   if (err) {
//   //     console.log(err);
//   //     res.status(404)
//   //   } else {
//   //     res.status(200).send('success')
//   //   }
//   // });
// });

// app.use('/.netlify/functions/api', router);

// module.exports = app;
// module.exports.handler = serverless(app);
