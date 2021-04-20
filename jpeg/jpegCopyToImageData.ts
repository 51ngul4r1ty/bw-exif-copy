// import { clampTo8bit } from "./jpegUtils.ts";

// TODO: Not sure what this actually does - but it isn't currently used
// export function copyToImageData(imageData: any, formatAsRGBA: any) {
//     let width = imageData.width,
//       height = imageData.height;
//     let imageDataArray = imageData.data;
//     let data = this.getData(width, height);
//     let i = 0,
//       j = 0,
//       x,
//       y;
//     let Y, K, C, M, R, G, B;
//     switch (this.components.length) {
//       case 1:
//         for (y = 0; y < height; y++) {
//           for (x = 0; x < width; x++) {
//             Y = data[i++];

//             imageDataArray[j++] = Y;
//             imageDataArray[j++] = Y;
//             imageDataArray[j++] = Y;
//             if (formatAsRGBA) {
//               imageDataArray[j++] = 255;
//             }
//           }
//         }
//         break;
//       case 3:
//         for (y = 0; y < height; y++) {
//           for (x = 0; x < width; x++) {
//             R = data[i++];
//             G = data[i++];
//             B = data[i++];

//             imageDataArray[j++] = R;
//             imageDataArray[j++] = G;
//             imageDataArray[j++] = B;
//             if (formatAsRGBA) {
//               imageDataArray[j++] = 255;
//             }
//           }
//         }
//         break;
//       case 4:
//         for (y = 0; y < height; y++) {
//           for (x = 0; x < width; x++) {
//             C = data[i++];
//             M = data[i++];
//             Y = data[i++];
//             K = data[i++];

//             R = 255 - clampTo8bit(C * (1 - K / 255) + K);
//             G = 255 - clampTo8bit(M * (1 - K / 255) + K);
//             B = 255 - clampTo8bit(Y * (1 - K / 255) + K);

//             imageDataArray[j++] = R;
//             imageDataArray[j++] = G;
//             imageDataArray[j++] = B;
//             if (formatAsRGBA) {
//               imageDataArray[j++] = 255;
//             }
//           }
//         }
//         break;
//       default:
//         throw new Error("Unsupported color mode");
//     }
//   }
