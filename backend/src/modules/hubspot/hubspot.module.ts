import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { HubspotSyncService } from './hubspot-sync.service';
import { HubspotController } from './hubspot.controller';

@Module({
  controllers: [HubspotController],
  providers: [HubspotService, HubspotSyncService],
  exports: [HubspotService, HubspotSyncService],
})
export class HubspotModule {}
