const ENV = {
  development: {
    port: 4000, // node server port
    socket_secret: 'SOCKET SECRET',
    redis: {
      host: 'localhost',
      port: 6379
    }
  },
  production: {
    port: 4000, // node server port
    socket_secret: 'SOCKET SECRET',
    redis: {
      host: '<redis-host>',
      port: 6379,
      pass: '<redis-password>' // Optional, if the password for redis exists
    }
  },
  staging: {
    port: 4000, // node server port
    socket_secret: 'SOCKET SECRET',
    redis: {
      host: '<redis-host>',
      port: 6379,
      pass: '<redis-password>' // Optional, if the password for redis exists
    }
  }
};

function getEnvVars(env) {
  console.log('NODE_ENV', env);
  const config = ENV[env];

  if (config) return config;
  return ENV.development;
}

module.exports = getEnvVars(process.env.NODE_ENV);
