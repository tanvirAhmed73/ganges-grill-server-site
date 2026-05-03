import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtAccessPayload } from '../auth/interfaces/jwt-access-payload.interface';
import { CreateRestaurantProductDto } from './dto/create-product.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateRestaurantProductDto } from './dto/update-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantOwnerGuard } from './restaurant-owner.guard';
import { RestaurantOwnerService } from './restaurant-owner.service';

@ApiTags('restaurant-owner')
@Controller('restaurant-owner')
@UseGuards(JwtAuthGuard, RestaurantOwnerGuard)
@ApiBearerAuth('access-token')
export class RestaurantOwnerController {
  constructor(private readonly restaurantOwnerService: RestaurantOwnerService) {}

  @Get('me/restaurant')
  @ApiOperation({ summary: 'Current vendor profile (one restaurant per owner).' })
  getMyRestaurant(@Req() req: Request & { user: JwtAccessPayload }) {
    return this.restaurantOwnerService.getMyRestaurant(req.user.sub);
  }

  @Patch('me/restaurant')
  @ApiOperation({ summary: 'Update listing details, address, and branding image URL.' })
  updateMyRestaurant(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantOwnerService.updateMyRestaurant(req.user.sub, dto);
  }

  @Get('me/products')
  @ApiOperation({ summary: 'All menu items for your restaurant.' })
  listProducts(@Req() req: Request & { user: JwtAccessPayload }) {
    return this.restaurantOwnerService.listProducts(req.user.sub);
  }

  @Post('me/products')
  @ApiOperation({ summary: 'Add a product to your menu.' })
  createProduct(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: CreateRestaurantProductDto,
  ) {
    return this.restaurantOwnerService.createProduct(req.user.sub, dto);
  }

  @Patch('me/products/:id')
  @ApiOperation({ summary: 'Update a product.' })
  updateProduct(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantProductDto,
  ) {
    return this.restaurantOwnerService.updateProduct(req.user.sub, id, dto);
  }

  @Delete('me/products/:id')
  @ApiOperation({ summary: 'Remove a product (blocked if referenced by past orders).' })
  deleteProduct(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.restaurantOwnerService.deleteProduct(req.user.sub, id);
  }

  @Get('me/orders')
  @ApiOperation({ summary: 'Incoming customer orders for your restaurant.' })
  listOrders(
    @Req() req: Request & { user: JwtAccessPayload },
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.restaurantOwnerService.listOrders(req.user.sub, query.status);
  }

  @Get('me/orders/:id')
  @ApiOperation({ summary: 'Single order with line items.' })
  getOrder(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.restaurantOwnerService.getOrder(req.user.sub, id);
  }

  @Patch('me/orders/:id/status')
  @ApiOperation({ summary: 'Advance order status (accept, prepare, dispatch, etc.).' })
  updateOrderStatus(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.restaurantOwnerService.updateOrderStatus(req.user.sub, id, dto);
  }
}
