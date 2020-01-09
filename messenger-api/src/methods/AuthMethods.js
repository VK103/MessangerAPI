import crypto from 'crypto';
import { Router } from 'express';
import { check } from 'express-validator/check';
import { withToken, withValidate, asyncWrap, ErrorAPI } from '../utils';
import config from '../config';

import UserModel from '../models/UserModel';
import AccessTokenModel from '../models/AccessTokenModel';

const router = Router();

const getToken = async (req, res) => {
  const { phone, password } = req.body;

  const user = await UserModel.findOne({ phone });

  if (!user || !user.checkPassword(password)) {
    throw new ErrorAPI(1002);
  }

  // Generation tokens
  const token = crypto.randomBytes(32).toString('base64');
  const socket_token = crypto
    .createHash('md5')
    .update(user._id + config.socket_secret)
    .digest('hex');

  const newToken = new AccessTokenModel({
    user_id: user._id,
    token
  });

  await newToken.save();

  res.out({
    access_token: token,
    socket_token,
    _id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    picture: user.picture
  });
};

router
  .route('/auth/signIn')
  .post(
    [check('phone').exists(), check('password').exists()],
    withValidate,
    asyncWrap(getToken)
  );

router.route('/auth/signUp').post(
  [
    check('phone').exists(),
    check('first_name').exists(),
    check('last_name').exists(),
    check('password').exists(),
    check('username').exists()
  ],
  withValidate,
  asyncWrap(async (req, res) => {
    const { phone, first_name, last_name, password, username } = req.body;

    const existUser = await UserModel.findOne({ phone }, { _id: 1 }).lean();
    if (existUser) {
      throw new ErrorAPI(1004);
    }

    let user = new UserModel({
      phone,
      first_name,
      last_name,
      password,
      username
    });

    await user.save();

    getToken(req, res);
  })
);

router.route('/auth/deactivateToken').post(
  withToken,
  asyncWrap(async (req, res) => {
    await req.token.remove();
    res.out(1);
  })
);

export default router;
