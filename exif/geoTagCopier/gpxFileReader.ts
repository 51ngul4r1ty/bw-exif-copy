import { xmlp } from "../../deps.ts";

const { PullParser } = xmlp;

export interface TrackPoint {
    latitude: string;
    longitude: string;
    elevation: string;
    time: string;
    src: string;
}

export interface ReadGpxFileContentsResult {
    trackPoints: TrackPoint[];
    errorMessage?: string;
}

export const readGpxFileContents = async (filePath: string): Promise<ReadGpxFileContentsResult> => {
    const parser = new PullParser();
    const uint8Array = await Deno.readFile(filePath);
    const events = parser.parse(uint8Array);
    const trackPoints: TrackPoint[] = [];

    events.next();

    const allEvents = [...events];

    const elementStack: string[] = [];

    let lastLat: string = ""; // latitude
    let lastLon: string = ""; // longitude
    let lastEle: string = ""; // elevation
    let lastTime: string = "";
    let lastSrc: string = "";

    let lastElement: string = "";

    allEvents.forEach(event => {
        if (event.name === "start_element") {
            elementStack.push(event?.element?.qName || "");
            const attributes = event.element?.attributes; 
            switch (event.element?.qName) {
                case "trkpt": {
                    attributes?.forEach(attribute => {
                        if (attribute.qName === "lat") {
                            lastLat = attribute.value;
                        }
                        if (attribute.qName === "lon") {
                            lastLon = attribute.value;
                        }
                    });
                    break;
                }
            }
        }

        if (elementStack.length) {
            lastElement = elementStack[elementStack.length - 1];
        } else {
            lastElement = "";
        }

        if (event.name === "end_element") {
            const elementName = event.element?.qName || "";
            if (elementStack.length) {
                const lastElement = elementStack[elementStack.length - 1];
                if (lastElement === elementName) {
                    elementStack.pop();
                } else {
                    console.log(`expected to end element ${lastElement}`);
                }
            }
            if (elementName === "trkpt") {
                trackPoints.push({
                    latitude: lastLat,
                    longitude: lastLon,
                    elevation: lastEle,
                    time: lastTime,
                    src: lastSrc
                })
            }
        }
        if (event.name === "text") {
            switch (lastElement) {
                case "ele": {
                    lastEle = event.text || "";
                    break;
                }
                case "time": {
                    lastTime = event.text || "";
                    break;
                }
                case "src": {
                    lastSrc = event.text || "";
                    break;
                }
            }
        }
    });

    let errorMessage: string = "";
    return {
        errorMessage,
        trackPoints
    };
};
