module.exports = {
  apps: [
    {
      name: "obrascity-worker",
      cwd: "/home/julio-sousa/Documentos/obrascity/obrascity",
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
      out_file: "/tmp/obrascity-worker.out.log",
      error_file: "/tmp/obrascity-worker.err.log",
      time: true,
    },
  ],
};
