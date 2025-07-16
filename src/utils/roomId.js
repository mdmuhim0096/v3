export const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 10); // 8-character ID
};
