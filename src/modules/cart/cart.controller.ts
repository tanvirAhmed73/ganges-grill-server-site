import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAccessPayload } from '../auth/interfaces/jwt-access-payload.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { CartService } from './cart.service';

@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('cart')
  getCart(@Query('email') email?: string) {
    return this.cartService.findByEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart')
  postCart(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() body: CreateCartItemDto,
  ) {
    return this.cartService.create(body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/:id')
  deleteCart(@Param('id') id: string) {
    return this.cartService.remove(id);
  }
}
