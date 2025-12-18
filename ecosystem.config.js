module.exports = {
  apps: [
    {
      name: 'japexclean',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/japexclean',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/japexclean-error.log',
      out_file: '/var/log/pm2/japexclean-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
