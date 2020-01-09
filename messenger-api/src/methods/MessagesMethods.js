import { Router } from 'express';
import { check } from 'express-validator/check';
import { withToken, withValidate, asyncWrap, ErrorAPI } from '../utils';

import MessagesModel from '../models/MessagesModel';
import DialogsModel from '../models/DialogsModel';
import UserModel from '../models/UserModel';

async function getDialog(sender_id, recipient_id) {
  let dialog = await DialogsModel.findOne(
    {
      $or: [
        { members: [sender_id, recipient_id] },
        { members: [recipient_id, sender_id] }
      ]
    },
    { _id: 1, members: 1 }
  );

  if (!dialog) {
    // Is exist recipient user
    const existUser = await UserModel.findOne(
      { _id: recipient_id },
      { _id: 1 }
    ).lean();

    if (!existUser) {
      throw new ErrorAPI(7);
    }

    const dialogs = new DialogsModel({ members: [sender_id, recipient_id] });
    dialog = await dialogs.save();

    return dialog;
  }

  return dialog;
}

const router = Router();

router.route('/messages/send').post(
  [check('recipient_id').exists(), check('text').exists(), check('attachment')],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const { recipient_id, text, attachment } = req.body;
    const sender_id = req.token.user_id;

    const dialog = await getDialog(sender_id, recipient_id);
    const messages = new MessagesModel({
      ...(attachment && { attachment }),
      dialog_id: dialog._id,
      recipient_id,
      sender_id,
      text
    });

    let message = await messages.save();

    res.out(message);

    // For notification
    const sender = await UserModel.findOne(
      { _id: sender_id },
      { first_name: 1, last_name: 1, picture: 1, username: 1 }
    );

    req.notification.to(recipient_id).emit('newMessage', {
      dialog_id: dialog._id,
      message,
      sender
    });

    req.notification.sendPushNotification({
      recipient_id,
      sender,
      message
    });
  })
);

router.route('/messages/getDialogs').post(
  [check('offset')],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const user_id = req.token.user_id;
    const offset = parseInt(req.body.offset, 10) || 0;

    let dialogs = await MessagesModel.aggregate([
      {
        $match: {
          $or: [{ recipient_id: user_id }, { sender_id: user_id }]
        }
      },
      {
        $sort: {
          date: -1
        }
      },
      {
        $group: {
          _id: '$dialog_id',
          unread_count: {
            $sum: {
              $cond: [{ $eq: ['$sender_id', user_id] }, 0, '$unread']
            }
          },
          last_message: { $first: '$$ROOT' }
        }
      },

      { $skip: offset },
      { $limit: 20 },

      {
        $lookup: {
          from: 'dialogs',
          localField: 'last_message.dialog_id',
          foreignField: '_id',
          as: 'dialog'
        }
      },

      { $unwind: '$dialog' },

      {
        $lookup: {
          from: 'users',
          let: {
            members: '$dialog.members',
            recipient_id: '$last_message.recipient_id',
            sender_id: '$last_message.sender_id'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$_id', '$$members'] },
                    {
                      $cond: {
                        if: { $eq: ['$$recipient_id', '$$sender_id'] }, // If the dialog with itself
                        then: {}, // do nothing
                        else: { $ne: ['$_id', user_id] } // Cut out yourself from all dialogs, except the dialog with himself.
                      }
                    }
                  ]
                }
                //_id: { $ne: user_id } // Cut out yourself from all dialogs
              }
            },
            {
              $project: {
                first_name: '$first_name',
                last_name: '$last_name',
                username: '$username',
                picture: '$picture'
              }
            }
          ],
          as: 'member'
        }
      },

      {
        $sort: {
          last_message: -1
        }
      },

      {
        $project: {
          last_message: 1,
          unread_count: 1,
          member: { $arrayElemAt: ['$member', 0] }
        }
      }
    ]);

    const unread_count = await MessagesModel.find({
      recipient_id: user_id,
      sender_id: { $ne: user_id },
      unread: 1
    }).countDocuments();

    res.out({
      unread_count,
      items: dialogs
    });
  })
);

router.route('/messages/getHistory').post(
  [check('recipient_id').exists(), check('offset')],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const offset = parseInt(req.body.offset, 10) || 0;

    const dialog = await getDialog(req.token.user_id, req.body.recipient_id);
    const messages = await MessagesModel.aggregate([
      { $match: { dialog_id: dialog._id } },
      { $sort: { date: -1 } },
      { $skip: offset },
      { $limit: 20 }
    ]);

    res.out({
      dialog_id: dialog._id,
      messages
    });
  })
);

router.route('/messages/markAsRead').post(
  [
    check('recipient_id').exists(),
    check('dialog_id').exists(),
    check('message_ids').exists()
  ],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const { recipient_id, dialog_id, message_ids } = req.body;
    const ids = message_ids.split(',');

    await MessagesModel.updateMany(
      {
        _id: { $in: ids },
        dialog_id
      },
      { unread: 0 }
    );

    req.notification.to(recipient_id).emit('markAsRead', {
      recipient_id: req.token.user_id,
      dialog_id,
      ids
    });

    res.out(1);
  })
);

router.route('/messages/deleteDialog').post(
  [check('dialog_id').exists()],
  withValidate,
  withToken,
  asyncWrap(async (req, res) => {
    const { dialog_id } = req.body;
    const selfID = req.token.user_id.toString();

    const dialog = await DialogsModel.findOne(
      { _id: dialog_id },
      { members: 1 }
    );

    if (!dialog) {
      throw new ErrorAPI(0, 'Not found dialog');
    }

    const userInDialog = dialog.members.findIndex(
      id => id.toString() === selfID
    );
    if (userInDialog === -1) {
      throw new ErrorAPI(0, 'Access error');
    }

    await MessagesModel.deleteMany({
      dialog_id
    });

    res.out(1);
  })
);

export default router;
