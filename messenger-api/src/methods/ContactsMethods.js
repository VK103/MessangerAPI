import { Router } from 'express';
import { check } from 'express-validator/check';
import { withToken, withValidate, asyncWrap } from '../utils';

import ContactsModel from '../models/ContactsModel';
import UsersModel from '../models/UserModel';

const router = Router();

router.route('/contacts/sync').post(
  [check('phone_numbers').exists()],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const { phone_numbers } = req.body;
    const phoneNumbers = phone_numbers.split(',');

    console.log(phoneNumbers);

    const existingContacts = await ContactsModel.findOne({
      user_id: req.token.user_id
    });

    if (existingContacts) {
      existingContacts.phoneNumbers = phoneNumbers;
      await existingContacts.save();
      res.out(1);
    } else {
      const newContactsSyncData = new ContactsModel({
        user_id: req.token.user_id,
        phoneNumbers
      });

      await newContactsSyncData.save();
      res.out(1);
    }
  })
);

router.route('/contacts/get').post(
  withToken,
  asyncWrap(async (req, res) => {
    const contacts = await ContactsModel.findOne({
      user_id: req.token.user_id
    }).lean();

    if (contacts) {
      const users = await UsersModel.find({
        phone: { $in: contacts.phoneNumbers }
      });

      res.out(users);
    } else {
      res.out([]);
    }
  })
);

export default router;
