const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`🚀 Master process ${process.pid} đang chạy`);

  // 🎯 Fork workers cho mỗi CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 📊 Monitor worker processes
  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} đã chết. Restarting...`);
    cluster.fork();
  });

  // 📈 Log số worker đang chạy
  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} đã online`);
  });

} else {
  // 🎯 Worker process
  console.log(`⚡ Worker ${process.pid} đã khởi động`);
  
  // Import và chạy app
  require('./index.js');
}
