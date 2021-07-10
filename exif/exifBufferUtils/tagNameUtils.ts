export const buildTagFromBlockName = (blockName: string): string => {
    if (!blockName) {
        return blockName;
    }
    return `tag-${blockName.toLowerCase().replaceAll(' ', '-')}`;
};
