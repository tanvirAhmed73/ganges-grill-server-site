import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RestaurantOwnerController } from './restaurant-owner.controller';
import { RestaurantOwnerGuard } from './restaurant-owner.guard';
import { RestaurantOwnerService } from './restaurant-owner.service';

@Module({
  imports: [PrismaModule],
  controllers: [RestaurantOwnerController],
  providers: [RestaurantOwnerService, RestaurantOwnerGuard],
  exports: [RestaurantOwnerService],
})
export class RestaurantOwnerModule {}
