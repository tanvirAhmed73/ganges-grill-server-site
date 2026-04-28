import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('user')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getUser() {
    return this.adminService.getUsers();
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('admin/:id')
  makeAdmin(@Param('id') id: string) {
    return this.adminService.makeAdmin(id);
  }
}
