import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { MenuService } from './menu.service';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('menuItem')
  getMenuItem() {
    return this.menuService.findAll();
  }

  @Post('menuItem')
  createMenuItem(@Body() body: CreateMenuItemDto) {
    return this.menuService.create(body);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('menuItem/:id')
  menuDeleteById(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
