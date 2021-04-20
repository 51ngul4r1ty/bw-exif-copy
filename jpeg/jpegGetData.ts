import { clampTo8bit } from "./jpegUtils.ts";

export function getData(width: number, height: number) {
    const scaleX = this.width / width;
    const scaleY = this.height / height;

    let component1, component2, component3, component4;
    let component1Line, component2Line, component3Line, component4Line;
    let x, y;
    let offset = 0;
    let Y, Cb, Cr, K, C, M, Ye, R, G, B;
    let colorTransform;
    let dataLength = width * height * this.components.length;
    this.memoryManager.requestMemoryAllocation(dataLength);
    let data = new Uint8Array(dataLength);
    switch (this.components.length) {
      case 1:
        component1 = this.components[0];
        for (y = 0; y < height; y++) {
          component1Line =
            component1.lines[0 | (y * component1.scaleY * scaleY)];
          for (x = 0; x < width; x++) {
            Y = component1Line[0 | (x * component1.scaleX * scaleX)];

            data[offset++] = Y;
          }
        }
        break;
      case 2:
        // PDF might compress two component data in custom colorspace
        component1 = this.components[0];
        component2 = this.components[1];
        for (y = 0; y < height; y++) {
          component1Line =
            component1.lines[0 | (y * component1.scaleY * scaleY)];
          component2Line =
            component2.lines[0 | (y * component2.scaleY * scaleY)];
          for (x = 0; x < width; x++) {
            Y = component1Line[0 | (x * component1.scaleX * scaleX)];
            data[offset++] = Y;
            Y = component2Line[0 | (x * component2.scaleX * scaleX)];
            data[offset++] = Y;
          }
        }
        break;
      case 3:
        // The default transform for three components is true
        colorTransform = true;
        // The adobe transform marker overrides any previous setting
        if (this.adobe && this.adobe.transformCode) colorTransform = true;
        else if (typeof this.opts.colorTransform !== "undefined")
          colorTransform = !!this.opts.colorTransform;

        component1 = this.components[0];
        component2 = this.components[1];
        component3 = this.components[2];
        for (y = 0; y < height; y++) {
          component1Line =
            component1.lines[0 | (y * component1.scaleY * scaleY)];
          component2Line =
            component2.lines[0 | (y * component2.scaleY * scaleY)];
          component3Line =
            component3.lines[0 | (y * component3.scaleY * scaleY)];
          for (x = 0; x < width; x++) {
            if (!colorTransform) {
              R = component1Line[0 | (x * component1.scaleX * scaleX)];
              G = component2Line[0 | (x * component2.scaleX * scaleX)];
              B = component3Line[0 | (x * component3.scaleX * scaleX)];
            } else {
              Y = component1Line[0 | (x * component1.scaleX * scaleX)];
              Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
              Cr = component3Line[0 | (x * component3.scaleX * scaleX)];

              R = clampTo8bit(Y + 1.402 * (Cr - 128));
              G = clampTo8bit(
                Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128)
              );
              B = clampTo8bit(Y + 1.772 * (Cb - 128));
            }

            data[offset++] = R;
            data[offset++] = G;
            data[offset++] = B;
          }
        }
        break;
      case 4:
        if (!this.adobe)
          throw new Error("Unsupported color mode (4 components)");
        // The default transform for four components is false
        colorTransform = false;
        // The adobe transform marker overrides any previous setting
        if (this.adobe && this.adobe.transformCode) colorTransform = true;
        else if (typeof this.opts.colorTransform !== "undefined")
          colorTransform = !!this.opts.colorTransform;

        component1 = this.components[0];
        component2 = this.components[1];
        component3 = this.components[2];
        component4 = this.components[3];
        for (y = 0; y < height; y++) {
          component1Line =
            component1.lines[0 | (y * component1.scaleY * scaleY)];
          component2Line =
            component2.lines[0 | (y * component2.scaleY * scaleY)];
          component3Line =
            component3.lines[0 | (y * component3.scaleY * scaleY)];
          component4Line =
            component4.lines[0 | (y * component4.scaleY * scaleY)];
          for (x = 0; x < width; x++) {
            if (!colorTransform) {
              C = component1Line[0 | (x * component1.scaleX * scaleX)];
              M = component2Line[0 | (x * component2.scaleX * scaleX)];
              Ye = component3Line[0 | (x * component3.scaleX * scaleX)];
              K = component4Line[0 | (x * component4.scaleX * scaleX)];
            } else {
              Y = component1Line[0 | (x * component1.scaleX * scaleX)];
              Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
              Cr = component3Line[0 | (x * component3.scaleX * scaleX)];
              K = component4Line[0 | (x * component4.scaleX * scaleX)];

              C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
              M =
                255 -
                clampTo8bit(
                  Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128)
                );
              Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
            }
            data[offset++] = 255 - C;
            data[offset++] = 255 - M;
            data[offset++] = 255 - Ye;
            data[offset++] = 255 - K;
          }
        }
        break;
      default:
        throw new Error("Unsupported color mode");
    }
    return data;
  }

