module.exports = {
    apps: [{
        name: "20055-cumulon-protocol-portal-service",
        script: "main.js",
        max_memory_restart: '2048M',
        node_args: '--max-old-space-size=2048',
        args: 'enable-monitor --mode=development',
        env: {
            PORT: 20055,
            NODE_ENV: 'development',
        }
    }]
}
