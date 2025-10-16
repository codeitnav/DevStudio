const User = require('../models/User');
const Room = require('../models/Room');
const File = require('../models/File');
const Folder = require('../models/Folder');
const fs = require('fs');
const path = require('path');

const cleanupGuestData = async () => {
  console.log('Running scheduled job: Cleaning up old guest data.');
  
  // Threshold for deletion - 24 hours ago
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - 24);

  try {
    const expiredGuests = await User.find({ 
      isGuest: true,
      createdAt: { $lt: threshold } 
    });

    if (expiredGuests.length === 0) {
      console.log('No expired guest accounts to clean up.');
      return;
    }

    console.log(`Found ${expiredGuests.length} expired guest account(s).`);

    for (const guest of expiredGuests) {
      const roomsToDelete = await Room.find({ owner: guest._id });

      for (const room of roomsToDelete) {
        const files = await File.find({ room: room._id });
        for (const file of files) {
          // Delete physical file if it exists
          if (file.path !== 'virtual' && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
        await File.deleteMany({ room: room._id });
        await Folder.deleteMany({ room: room._id });
        
        console.log(`- Deleted files and folders for room: ${room.name}`);
      }

      await Room.deleteMany({ owner: guest._id });
      await User.findByIdAndDelete(guest._id);
      console.log(`- Successfully deleted guest user: ${guest.username}`);
    }
    console.log('Guest data cleanup complete.');
  } catch (error) {
    console.error('Error during guest data cleanup:', error);
  }
};

module.exports = { cleanupGuestData };