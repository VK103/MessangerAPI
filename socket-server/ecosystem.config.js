module.exports = {
  apps: [
    {
      name: 'socket-server',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      env_staging: {
        NODE_ENV: 'staging'
      }
    }
  ]
};
