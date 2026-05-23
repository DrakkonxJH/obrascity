module.exports = {
  apps: [
    {
      name: "obrasflow-worker",
      cwd: "/home/julio-sousa/Documentos/obrasflow/obras-saas",
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
      out_file: "/tmp/obrasflow-worker.out.log",
      error_file: "/tmp/obrasflow-worker.err.log",
      time: true,
    },
  ],
};
