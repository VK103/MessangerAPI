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

router.route('/friend/request').post(
    /***
     * Two Types
     * 1.request
     * 2.accept
     * 3.decline
     */
    [check('type').exists()],
    [check('receiver_id').exists()],
    withValidate,
    withToken,
    asyncWrap(async (req, res) => {

        var { receiver_id, type } = req.body;

        FriendModel.findOne({
            $or: [{ $and: [{ sender_id: req.token.user_id }, { receiver_id: receiver_id }] },
            { $and: [{ sender_id: receiver_id }, { receiver_id: req.token.user_id }] }]
        }, async function (err, friend) {

            if (err) {
                throw new ErrorAPI(0);
            }

            if (type === 'request') {

                if (friend) {
                    res.out(friend);
                } else {
                    let newFriend = new FriendModel()
                    newFriend.sender_id = req.token.user_id
                    newFriend.receiver_id = receiver_id
                    await newFriend.save()
                    res.out(newFriend);
                }

                // For notification
                const sender = await UserModel.findOne(
                    { _id: req.token.user_id },
                    { first_name: 1, last_name: 1, picture: 1, username: 1 }
                );

                let recipient_id = receiver_id;

                req.notification.sendRequestPushNotification({
                    recipient_id,
                    sender,
                    message: sender.first_name + " " + sender.last_name + " " + "Sent you request.",
                    title: 'New Request',
                });

            }
            if (type === 'accept') {
                friend.accept = true
                await friend.save()
                res.out(friend);
            }
            if (type === 'decline') {
                await friend.remove()
                res.out(friend);
            }
            //res.out('Please enter valid type.');

        })

    })
);


router.route('/friend/list').post(
    /***
     * Two Types
     * 1.friend
     * 2.requested
     * 3.all
     */
    [check('page_id').exists()],
    [check('page_length').exists()],
    [check('type').exists()],
    withValidate,
    withToken,
    asyncWrap(async (req, res) => {

        var { page_id, page_length, type } = req.body;

        //Paging
        let pageNo = page_id ? (page_id - 1) : 0;
        let pageSize = page_length ? page_length : 10

        if (type === 'all') {
            var query = UserModel.find(
                { _id: { $ne: req.token.user_id } },
                {
                    first_name: 1,
                    last_name: 1,
                    phone: 1,
                    email: 1,
                    picture: 1,
                    username: 1,
                    status: 1
                })
                .limit(pageSize)
                .skip(pageSize * pageNo)
                .sort([['timestamp', -1]])

            query.exec(async function (err, users) {

                if (err) {
                    throw new ErrorAPI(0);
                }

                if (users) {

                    let arrUsers = []
                    for (const user of users) {

                        let isFriend = await FriendModel.findOne({
                            $or: [{ $and: [{ sender_id: req.token.user_id }, { receiver_id: user._id }] },
                            { $and: [{ sender_id: user._id }, { receiver_id: req.token.user_id }] }]
                        })

                        //isFriend ? user.isFriend = true : user.isFriend = false
                        if (isFriend && isFriend.accept == true) {
                            user.status = "accepted"
                        } else if (isFriend && isFriend.accept == false) {
                            user.status = "requested"
                        } else {
                            user.status = "none"
                        }

                        console.log('user1: ', user._id, "  ", 'user2: ', req.token.user_id);

                        arrUsers.push(user)
                    }

                    res.out(arrUsers)
                }

            })
        } else if (type === 'friend') {
            var query = UserModel.find(
                { _id: { $ne: req.token.user_id } },
                {
                    first_name: 1,
                    last_name: 1,
                    phone: 1,
                    email: 1,
                    picture: 1,
                    username: 1,
                    status: 1
                })
                .limit(pageSize)
                .skip(pageSize * pageNo)
                .sort([['timestamp', -1]])

            query.exec(async function (err, users) {

                if (err) {
                    throw new ErrorAPI(0);
                }

                if (users) {

                    let arrUsers = []
                    for (const user of users) {

                        let isFriend = await FriendModel.findOne({
                            $or: [{ $and: [{ sender_id: req.token.user_id }, { receiver_id: user._id }, { accept: true }] },
                            { $and: [{ sender_id: user._id }, { receiver_id: req.token.user_id }, { accept: true }] }]
                        })

                        //isFriend ? user.isFriend = true : user.isFriend = false
                        if (isFriend) { user.status = "accepted" }
                        console.log('user1: ', user._id, "  ", 'user2: ', req.token.user_id);
                        if (isFriend) arrUsers.push(user)
                    }

                    res.out(arrUsers)
                }

            })
        } else if (type === 'requested') {

            var query = UserModel.find(
                { _id: { $ne: req.token.user_id } },
                {
                    first_name: 1,
                    last_name: 1,
                    phone: 1,
                    email: 1,
                    picture: 1,
                    username: 1,
                    status: 1
                })
                .limit(pageSize)
                .skip(pageSize * pageNo)
                .sort([['timestamp', -1]])

            query.exec(async function (err, users) {

                if (err) {
                    throw new ErrorAPI(0);
                }

                if (users) {

                    let arrUsers = []
                    for (const user of users) {

                        let isFriend = await FriendModel.findOne({
                            $and: [{ sender_id: user._id }, { receiver_id: req.token.user_id }, { accept: false }]
                        })

                        //isFriend ? user.isFriend = true : user.isFriend = false
                        if (isFriend) { user.status = "requested" }
                        console.log('user1: ', user._id, "  ", 'user2: ', req.token.user_id);
                        if (isFriend) arrUsers.push(user)
                    }

                    res.out(arrUsers)
                }

            })
        } else {
            res.out(0)
        }


    })
);


export default router;
