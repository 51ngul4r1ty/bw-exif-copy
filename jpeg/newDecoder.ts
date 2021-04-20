// based on jpeg-js

import { MemoryManager } from "../misc/memoryManager.ts"

export class JpegImage {
  private memoryManager: MemoryManager;
  constructor(private opts: any, maxMemoryUsage: number) {
    this.memoryManager = new MemoryManager(maxMemoryUsage);
  }

// TODO: Implement later
//   load(path: string) {
//     var xhr = new XMLHttpRequest();
//     xhr.open("GET", path, true);
//     xhr.responseType = "arraybuffer";
//     xhr.onload = function () {
//       // TODO catch parse error
//       var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
//       parse(data);
//       if (this.onload) this.onload();
//     }.bind(this);
//     xhr.send(null);
//   }

}
