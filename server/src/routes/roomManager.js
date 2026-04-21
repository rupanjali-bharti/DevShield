// Stores active room info in memory
const rooms = new Map();

const createRoom = (roomId, repoUrl) => {
  rooms.set(roomId, {
    roomId,
    repoUrl,
    users: [],
    createdAt: new Date()
  });
  return rooms.get(roomId);
};

const getRoom = (roomId) => {
  return rooms.get(roomId);
};

const addUserToRoom = (roomId, user) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.users.push(user);
  return room;
};

const removeUserFromRoom = (roomId, socketId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.users = room.users.filter(u => u.socketId !== socketId);

  // If no users left, room is empty
  if (room.users.length === 0) {
    rooms.delete(roomId);
    return null;
  }
  return room;
};

const getRoomUsers = (roomId) => {
  const room = rooms.get(roomId);
  return room ? room.users : [];
};

module.exports = {
  createRoom,
  getRoom,
  addUserToRoom,
  removeUserFromRoom,
  getRoomUsers
};