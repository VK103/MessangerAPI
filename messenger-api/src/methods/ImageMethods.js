import { Router } from 'express';
import { check } from 'express-validator/check';
import {
    withToken,
    withValidate,
    asyncWrap,
    validStringUnsanitized,
    ErrorAPI
} from '../utils';

const multer = require('multer');
const fs = require('fs');

// Set Destination of File
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.png')
    }
})

var upload = multer({ storage: storage })

const router = Router();

router.route('/image/upload').post(

    upload.single('image'),
    asyncWrap(async (req, res) => {
        if (req.file && req.file.filename) {
            //return res.json({ status: true, message: "Image uplaod successfully.", data: req.file })
            res.out(req.file)
        } else {
            res.out(0)
            //return res.json({ status: false, message: "'Something went wrong, please try again.", data: {} })
        }
    })
);

export default router;
