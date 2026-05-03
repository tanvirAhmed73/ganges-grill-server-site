import { Controller, Get } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  /** Single payload for the homepage — replaces importing static TS arrays in the frontend. */
  @Get('home')
  getHome() {
    return this.discoveryService.getHomePayload();
  }
}
