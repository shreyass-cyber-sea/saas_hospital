export default () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-default-key-for-dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});
