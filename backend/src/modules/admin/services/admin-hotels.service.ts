import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity';

@Injectable()
export class AdminHotelsService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  async list(): Promise<object[]> {
    const hotels = await this.hotelRepository.find({ order: { name: 'ASC' } });
    return hotels.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      country: h.country,
    }));
  }
}
