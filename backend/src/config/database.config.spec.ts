import databaseConfig from './database.config';

describe('database.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns a ConfigFactory with key containing "database"', () => {
    expect(databaseConfig.KEY).toContain('database');
  });

  it('returns postgres config with defaults', () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.NODE_ENV;

    const config = databaseConfig() as Record<string, unknown>;
    expect(config.type).toBe('postgres');
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.username).toBe('hotel_user');
    expect(config.password).toBe('hotel_pass');
    expect(config.database).toBe('hotel_booking');
    expect(config.synchronize).toBe(true);
  });

  it('disables synchronize in production', () => {
    process.env.NODE_ENV = 'production';
    const config = databaseConfig() as Record<string, unknown>;
    expect(config.synchronize).toBe(false);
  });

  it('enables logging in development', () => {
    process.env.NODE_ENV = 'development';
    const config = databaseConfig() as Record<string, unknown>;
    expect(config.logging).toBe(true);
  });

  it('enables ssl in production', () => {
    process.env.NODE_ENV = 'production';
    const config = databaseConfig() as Record<string, unknown>;
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
  });

  it('uses env vars when provided', () => {
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '5433';
    process.env.DB_USER = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'mydb';

    const config = databaseConfig() as Record<string, unknown>;
    expect(config.host).toBe('db.example.com');
    expect(config.port).toBe(5433);
    expect(config.username).toBe('admin');
    expect(config.password).toBe('secret');
    expect(config.database).toBe('mydb');
  });
});
