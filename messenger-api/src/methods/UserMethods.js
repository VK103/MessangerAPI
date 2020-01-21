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
import FriendModel from '../models/FriendModel';

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
        email: 1,
        picture: 1
      }
    );

    res.out(user);
  })
);

router.route('/users/search').post(
  [check('username').exists()],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const username = new RegExp(`^${req.body.username}`, 'i');
    const users = await UserModel.find(
      //{ username },
      {
        $or: [
          { username: new RegExp(`^${req.body.username}`, 'i') },
          { first_name: new RegExp(`^${req.body.username}`, 'i') },
          { last_name: new RegExp(`^${req.body.username}`, 'i') }
        ]
      },
      {
        first_name: 1,
        last_name: 1,
        phone: 1,
        email: 1,
        picture: 1,
        username: 1
      }
    ).limit(10);
    
    let arrUsers = []
    for (var user of users) {

      let isFriend = await FriendModel.findOne({
        $or: [{ $and: [{ sender_id: req.token.user_id }, { receiver_id: user._id }, { accept: true }] },
        { $and: [{ sender_id: user._id }, { receiver_id: req.token.user_id }, { accept: true }] }]
      })

      let requestSent = await FriendModel.findOne(
        { $and: [{ sender_id: req.token.user_id }, { receiver_id: user._id }, { accept: false }] }
      )

      let requestReceive = await FriendModel.findOne(
        { $and: [{ sender_id: user._id }, { receiver_id: req.token.user_id }, { accept: false }] }
      )

      //isFriend ? user.isFriend = true : user.isFriend = false
      if (isFriend) {
        user.status = "accepted"
      } else if (requestSent) {
        user.status = "request_send"
      } else if (requestReceive) {
        user.status = "request_receive"
      } else {
        user.status = "none"
      }

      console.log('user1: ', user._id, "  ", 'user2: ', req.token.user_id);

      arrUsers.push(user)
    }

    res.out(arrUsers);
  })
);

export default router;
