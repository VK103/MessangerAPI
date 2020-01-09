const crypto = require('crypto');
const Socket = require('socket.io');
const redisAdapter = require('socket.io-redis');
const redis = require('redis');
const config = require('./config');

const io = Socket(config.port, { path: '/' });

if (config.redis.pass) {
  const pub = redis.createClient(config.redis.port, config.redis.host, {
    auth_pass: config.redis.pass
  });
  const sub = redis.createClient(config.redis.port, config.redis.host, {
    auth_pass: config.redis.pass
  });
  io.adapter(redisAdapter({ pubClient: pub, subClient: sub }));
} else {
  io.adapter(redisAdapter(config.redis));
}

function checkToken(user_id, user_token) {
  const token = crypto
    .createHash('md5')
    .update(user_id + config.socket_secret)
    .digest('hex');

  return user_token === token;
}

// Authentication
io.use((socket, next) => {
  const query = socket.request._query;
  if (query.token && checkToken(query.user_id, query.token)) {
    return next();
  }

  next(new Error('Authentication error'));
});

io.on('connection', socket => {
  const query = socket.request._query;

  if (query.user_id) {
    socket.join(query.user_id);
  }
});

console.log(`
  Socket running at port ${config.port};
  Redit running at  ${config.redis.host}:${config.redis.port}
`);
