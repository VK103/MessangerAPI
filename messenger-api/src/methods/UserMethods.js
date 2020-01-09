import { Router } from 'express';
import { check } from 'express-validator/check';
import {
  withToken,
  withValidate,
  asyncWrap,
  validStringUnsanitized,
  ErrorAPI
} from '../utils';

import UserModel from '../models/UserModel';

const router = Router();

router.route('/users/checkUsernameAvailable').post(
  [check('username').exists()],
  withValidate,
  asyncWrap(async (req, res) => {
    const { username } = req.body;

    if (username.length < 4) {
      throw new ErrorAPI(124);
    }

    if (!validStringUnsanitized('a-z0-9_-', username)) {
      throw new ErrorAPI(123);
    }

    const user = await UserModel.findOne({ username }, { username: 1 });
    if (user) {
      throw new ErrorAPI(123);
    }

    res.out(true);
  })
);

router.route('/users/getCurrentUser').post(
  withToken,
  asyncWrap(async (req, res) => {
    const user = await UserModel.findOne(
      { _id: req.token.user_id },
      {
        first_name: 1,
        last_name: 1,
        phone: 1,
        picture: 1
      }
    );

    res.out(user);
  })
);

router.route('/users/search').post(
  [check('username').exists()],
  withValidate,
  asyncWrap(async (req, res) => {
    const username = new RegExp(`^${req.body.username}`, 'i');
    const users = await UserModel.find(
      { username },
      {
        first_name: 1,
        last_name: 1,
        phone: 1,
        picture: 1,
        username: 1
      }
    ).limit(10);

    res.out(users);
  })
);

export default router;
