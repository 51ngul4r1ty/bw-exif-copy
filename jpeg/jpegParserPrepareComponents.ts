import { MemoryManager } from "../misc/memoryManager.ts"
import { Frame } from "./jpegParser.ts";

export function prepareComponents(frame: Frame, memoryManager: MemoryManager) {
    let maxH = 0;
    let maxV = 0;
    let component, componentId;
    for (componentId in frame.components) {
      if (frame.components.hasOwnProperty(componentId)) {
        component = frame.components[componentId];
        if (maxH < component.h) maxH = component.h;
        if (maxV < component.v) maxV = component.v;
      }
    }
    let mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
    let mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
    for (componentId in frame.components) {
      if (frame.components.hasOwnProperty(componentId)) {
        component = frame.components[componentId];
        let blocksPerLine = Math.ceil(
          (Math.ceil(frame.samplesPerLine / 8) * component.h) / maxH,
        );
        let blocksPerColumn = Math.ceil(
          (Math.ceil(frame.scanLines / 8) * component.v) / maxV,
        );
        let blocksPerLineForMcu = mcusPerLine * component.h;
        let blocksPerColumnForMcu = mcusPerColumn * component.v;
        let blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
        let blocks = [];

        // Each block is a Int32Array of length 64 (4 x 64 = 256 bytes)
        memoryManager.requestMemoryAllocation(blocksToAllocate * 256);

        for (let i = 0; i < blocksPerColumnForMcu; i++) {
          let row = [];
          for (let j = 0; j < blocksPerLineForMcu; j++) {
            row.push(new Int32Array(64));
          }
          blocks.push(row);
        }
        component.blocksPerLine = blocksPerLine;
        component.blocksPerColumn = blocksPerColumn;
        component.blocks = blocks;
      }
    }
    frame.maxH = maxH;
    frame.maxV = maxV;
    frame.mcusPerLine = mcusPerLine;
    frame.mcusPerColumn = mcusPerColumn;
  }
