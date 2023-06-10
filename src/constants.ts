export const STORAGE_PREFIX = "pauseExts";
export const syncModeKey = 'syncMode';
export const groupNumKey = `${STORAGE_PREFIX}GroupNum`;
export const advancedKey = `${STORAGE_PREFIX}Advanced`;
export const getGroupInfoKey = (groupId: number) =>
  `${STORAGE_PREFIX}Group${groupId}`;
export const getExtInfoKey = (extId: string) => `${STORAGE_PREFIX}${extId}`;
