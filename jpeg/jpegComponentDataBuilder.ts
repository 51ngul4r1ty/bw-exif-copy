import { Frame } from "./jpegParser.ts";
import { quantizeAndInverse } from "./jpegQuantizeAndInverse.ts";
import { MemoryManager } from "../misc/memoryManager.ts";

export class JpegComponentDataBuilder {
  private memoryManager: MemoryManager;
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }
  buildComponentData(frame: Partial<Frame>, component: any) {
    var lines = [];
    var blocksPerLine = component.blocksPerLine;
    var blocksPerColumn = component.blocksPerColumn;
    var samplesPerLine = blocksPerLine << 3;
    // Only 1 used per invocation of this function and garbage collected after invocation, so no need to account for its memory footprint.
    var R = new Int32Array(64),
      r = new Uint8Array(64);

    this.memoryManager.requestMemoryAllocation(
      samplesPerLine * blocksPerColumn * 8,
    );

    var i, j;
    for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
      var scanLine = blockRow << 3;
      for (i = 0; i < 8; i++) lines.push(new Uint8Array(samplesPerLine));
      for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
        quantizeAndInverse(component, component.blocks[blockRow][blockCol], r, R);

        var offset = 0,
          sample = blockCol << 3;
        for (j = 0; j < 8; j++) {
          var line = lines[scanLine + j];
          for (i = 0; i < 8; i++) line[sample + i] = r[offset++];
        }
      }
    }
    return lines;
  }
}
