import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('returns status ok with timestamp', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
  });
});
