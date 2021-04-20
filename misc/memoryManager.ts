export class MemoryManager {
    // We cap the amount of memory used by jpeg-js to avoid unexpected OOMs from untrusted content.
    private totalBytesAllocated = 0;
    private maxMemoryUsageBytes = 0;
    constructor(maxMemoryUsage: number) {
        this.totalBytesAllocated = 0;
        this.maxMemoryUsageBytes = maxMemoryUsage;
    }
    requestMemoryAllocation(increaseAmount = 0) {
        var totalMemoryImpactBytes = this.totalBytesAllocated + increaseAmount;
        if (totalMemoryImpactBytes > this.maxMemoryUsageBytes) {
            var exceededAmount = Math.ceil((totalMemoryImpactBytes - this.maxMemoryUsageBytes) / 1024 / 1024);
            throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
        }

        this.totalBytesAllocated = totalMemoryImpactBytes;
    }

    getBytesAllocated() {
        return this.totalBytesAllocated;
    };

    getMaxMemoryUsageBytes() {
        return this.maxMemoryUsageBytes;
    };
}