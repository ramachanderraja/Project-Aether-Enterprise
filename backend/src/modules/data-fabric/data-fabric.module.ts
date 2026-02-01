import { Module } from '@nestjs/common';
import { DataFabricController } from './data-fabric.controller';
import { DataFabricService } from './data-fabric.service';

@Module({
  imports: [],
  controllers: [DataFabricController],
  providers: [DataFabricService],
  exports: [DataFabricService],
})
export class DataFabricModule {}
