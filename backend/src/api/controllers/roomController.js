const Room = require("../../models/Room");
const User = require("../../models/User");

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { roomName, description, isPrivate } = req.body

    if (!roomName) return res.status(400).json({ error: "Room name is required" })
    if (!req.user?._id) return res.status(401).json({ error: "Unauthorized" })

    const room = new Room({
      name: roomName,          // map frontend roomName → backend name
      description: description || "",
      isPrivate: isPrivate || false,
      owner_id: req.user._id,  // add owner_id
      collaborators: [req.user._id],
    })

    await room.save()

    res.status(201).json({ room })
  } catch (error) {
    console.error("Error creating room:", error)
    res.status(500).json({ error: error.message || "Internal Server Error" })
  }
}

// Get a single room
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate(
      "collaborators",
      "name email"
    );
    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json({ room });
  } catch (error) {
    console.error("Get Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Join a room
exports.joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (!room.collaborators.includes(req.user._id)) {
      room.collaborators.push(req.user._id);
      await room.save();
    }

    res.json({ room });
  } catch (error) {
    console.error("Join Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Leave a room
exports.leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.collaborators = room.collaborators.filter(
      (userId) => userId.toString() !== req.user._id.toString()
    );
    await room.save();

    res.json({ message: "Left the room successfully" });
  } catch (error) {
    console.error("Leave Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Unauthorized" });

    await room.remove();
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all rooms for a user
exports.getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ collaborators: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ data: rooms });
  } catch (error) {
    console.error("Get User Rooms Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
