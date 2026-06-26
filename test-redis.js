const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Testing Redis connection to: ${redisUrl}`);

const redis = new Redis(redisUrl);

redis.ping()
  .then((res) => {
    console.log('PING response:', res);
    console.log('Redis connectivity: SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Redis connectivity: FAILURE');
    console.error(err);
    process.exit(1);
  });
