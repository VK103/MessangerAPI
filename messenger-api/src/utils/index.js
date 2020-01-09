import { validationResult, check } from 'express-validator/check';
import AccessTokenModel from '../models/AccessTokenModel';
import ErrorMessages from './ErrorMessages';

export const asyncWrap = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const withToken = [
  check('access_token').exists(),
  asyncWrap(async (req, res, next) => {
    const { access_token } = req.body;

    const token = await AccessTokenModel.findOne({
      token: access_token
    });

    if (!token) {
      throw new ErrorAPI(5);
    }

    req.token = token;
    next();
  })
];

export const withValidate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ErrorAPI(100, undefined, errors.array());
  }

  next();
};

export function ErrorAPI(code = 0, message, payload) {
  this.message = message || ErrorMessages[code] || '';
  this.code = code;
  this.name = 'Error API';
  this.payload = payload;
}

export const errorsMiddleware = (err, req, res, next) => {
  res.json({
    error: {
      code: err.code || 0,
      message: err.message,
      ...(err.payload && {
        payload: err.payload
      }),
      ...(err.stack && {
        stack: err.stack
      })
    }
  });
};

export const outMiddleware = (req, res, next) => {
  res.out = response => {
    res.json({ response });
  };
  next();
};

export function timestamp() {
  return +new Date();
}

export function validStringUnsanitized(allowed, str) {
  let re = new RegExp('^[' + allowed + ']+$');
  return re.test(str);
}
