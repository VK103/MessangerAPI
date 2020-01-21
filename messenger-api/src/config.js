const ENV = {
  development: {
    port: 3000, // node server port
    mongoURI: 'mongodb://localhost:27017/messenger',
    socket_secret: 'SOCKET SECRET',
    redis: {
      host: 'localhost',
      port: 6379
    }
  },
  production: {
    port: 3000, // node server port
    mongoURI: 'mongodb://localhost:27017/messenger',
    socket_secret: 'SOCKET SECRET',
    redis: {
      host: 'localhost',
      port: 6379,
      //password: '<redis-password>' // Optional, if the password for redis exists
    }
  },
  staging: {
    port: 3000, // node server port
    mongoURI: 'mongodb://localhost:27017/messenger',
    socket_secret: 'SOCKET SECRET',
    redis: {
      host: 'localhost',
      port: 6379,
      //password: '<redis-password>' // Optional, if the password for redis exists
    }
  }
};

function getEnvVars(env) {
  const config = ENV[env];

  if (config) {
    return config;
  }

  console.log(config);

  return ENV.development;
}

export default getEnvVars(process.env.NODE_ENV);
