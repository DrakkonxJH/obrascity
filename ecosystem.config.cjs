module.exports = {
  apps: [
    {
      name: "planobras-worker",
      cwd: "/home/julio-sousa/Documentos/planobras/obras-saas",
      script: "npm",
      args: "run worker:start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 30,
      min_uptime: "10s",
      restart_delay: 5000,
      watch: false,
      out_file: "/tmp/planobras-worker.out.log",
      error_file: "/tmp/planobras-worker.err.log",
      time: true,
    },
  ],
};
