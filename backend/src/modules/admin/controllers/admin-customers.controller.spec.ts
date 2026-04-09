import { Test } from '@nestjs/testing';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCustomersService } from '../services/admin-customers.service';

describe('AdminCustomersController', () => {
  let controller: AdminCustomersController;
  const mockService = {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminCustomersController],
      providers: [{ provide: AdminCustomersService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminCustomersController>(AdminCustomersController);
    jest.clearAllMocks();
  });

  it('delegates list to customersService.list', async () => {
    const expected = [{ id: 'c-1', name: 'Customer' }];
    mockService.list.mockResolvedValue(expected);

    const result = await controller.list();

    expect(mockService.list).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('delegates getById to customersService.getById', async () => {
    const expected = { id: 'c-1', name: 'Customer' };
    mockService.getById.mockResolvedValue(expected);

    const result = await controller.getById('c-1');

    expect(mockService.getById).toHaveBeenCalledWith('c-1');
    expect(result).toEqual(expected);
  });

  it('delegates create to customersService.create', async () => {
    const dto = { email: 'new@test.com', name: 'New' };
    const expected = { id: 'c-new', ...dto };
    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('delegates update to customersService.update', async () => {
    const dto = { name: 'Updated' };
    const expected = { id: 'c-1', name: 'Updated' };
    mockService.update.mockResolvedValue(expected);

    const result = await controller.update('c-1', dto);

    expect(mockService.update).toHaveBeenCalledWith('c-1', dto);
    expect(result).toEqual(expected);
  });

  it('delegates remove to customersService.remove', async () => {
    mockService.remove.mockResolvedValue(undefined);

    await controller.remove('c-1');

    expect(mockService.remove).toHaveBeenCalledWith('c-1');
  });
});
