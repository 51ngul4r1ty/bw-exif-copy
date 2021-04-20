Using
=====

* exif-copy {source file} {target file}

Future Enhancements
===================

Some fields aren't stored in the EXIF Metadata table that's collected while analyzing the file, so we could still add these:
* GPSMapDatum
* GPSStatus
* GPSTimeStamp
* GPSVersionID

Troubleshooting Utils
=====================

Searching Exif Buffer
---------------------

One technique that can be used is to search for specific data in the exifBuffer using indexOfStringInExifBuffer.

For example, if you saw "WGS-84" using some other EXIF utility and wanted to find where it is using this codebase (in particular exifBufferDecoder.ts)
you can use the following function call (this is a GPS Info tag search):
```
const relativeOffset = indexOfStringInExifBuffer(exifBuffer, "WGS-84");
```
Another example (this is a camera model number search):
```
const relativeOffset = indexOfStringInExifBuffer(exifBuffer, "SLT-A77V");
```
