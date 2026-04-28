import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  getUsers() {
    return this.usersService.findAll();
  }

  deleteUser(id: string) {
    return this.usersService.removeById(id);
  }

  makeAdmin(id: string) {
    return this.usersService.promoteToAdmin(id);
  }
}
