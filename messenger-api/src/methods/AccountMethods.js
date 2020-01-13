import { Router } from 'express';
import { check } from 'express-validator/check';
import {
  withToken,
  withValidate,
  asyncWrap,
  ErrorAPI,
  validStringUnsanitized
} from '../utils';

import DeviceTokenModel from '../models/DeviceTokenModel';
import UserModel from '../models/UserModel';

const router = Router();
var nodemailer = require('nodemailer');

router.route('/account/registerDevice').post(
  [
    check('device_platform'),
    check('device_year'),
    check('system_version'),
    check('token').exists()
  ],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const exisingToken = await DeviceTokenModel.findOne({
      token: req.body.token,
      user_id: req.token.user_id
    });

    if (exisingToken) {
      res.out(exisingToken._doc);
    } else {
      const newDeviceToken = new DeviceTokenModel({
        user_id: req.token.user_id,
        ...req.body
      });

      const savedItem = await newDeviceToken.save();
      res.out(savedItem);
    }
  })
);

router.route('/account/unregisterDevice').post(
  [check('token').exists()],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const device = await DeviceTokenModel.findOne({
      token: req.body.token,
      user_id: req.token.user_id
    });

    if (!device) {
      throw new ErrorAPI(0, 'Device token undefined');
    }

    await device.remove();
    res.out(1);
  })
);

router.route('/account/changeInfo').post(
  [
    check('first_name').exists(),
    check('last_name').exists(),
    check('username').exists()
  ],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const { first_name, last_name, username } = req.body;
    const user = await UserModel.findOne({ _id: req.token.user_id });

    user.first_name = first_name;
    user.last_name = last_name;

    if (username !== user.username) {
      if (username.length < 4) {
        throw new ErrorAPI(124);
      }

      if (!validStringUnsanitized('a-z0-9_-', username)) {
        throw new ErrorAPI(123);
      }

      user.username = username;
    }

    await user.save();

    res.out({ first_name, last_name, username });
  })
);

router.route('/account/changePassword').post(
  [check('password').exists()],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const user = await UserModel.findOne({ _id: req.token.user_id });
    user.password = req.body.password;
    await user.save();

    res.out(1);
  })
);


router.route('/account/forgetPassword').post(
  [check('email').exists()],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {

    var randomstring = Math.random().toString(36).slice(-8);

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'vaibhavakabari10@gmail.com',
        pass: 'fgxmrsqqznhalylp'
      }
    });

    var mailOptions = {
      from: 'vaibhavakabari10@gmail.com',
      to: req.body.email,
      subject: 'New Password from Messanger',
      text: 'Your App Password is ' + randomstring
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.out(1);
  })
);


router.route('/account/changePicture').post(
  [
    check('url').exists(),
    check('width').exists(),
    check('height').exists(),
    check('preview').exists()
  ],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const user = await UserModel.findOne({ _id: req.token.user_id });
    user.picture = { ...req.body };
    await user.save();

    res.out(user.picture);
  })
);

router.route('/account/removePicture').post(
  withToken,
  asyncWrap(async (req, res) => {
    const user = await UserModel.findOne({ _id: req.token.user_id });
    user.picture = {};
    await user.save();

    res.out(user.picture);
  })
);

export default router;
