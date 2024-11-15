const { ObjectId } = require('mongodb');

class NotificationRepository {
    constructor(db) {
        this.db = db;
    }

    // Get all notifications for a user
    async getAllNotifications(userId) {
        try {
            const user = await this.db.collection('users').findOne({ _id: new ObjectId(userId) });
            return user ? user.notifications : [];
        } catch (err) {
            throw new Error('Error fetching notifications: ' + err.message);
        }
    }

    // Mark a notification as read
    async markNotificationAsRead(userId, notificationId) {
        try {
            const result = await this.db.collection('users').updateOne(
                { _id: new ObjectId(userId), 'notifications._id': new ObjectId(notificationId) },
                { $set: { 'notifications.$.read': true } }
            );
            return result;
        } catch (err) {
            throw new Error('Error reading notification: ' + err.message);
        }
    }

    // Create a new notification for a user
    async createNotification(userId, { title, message, link }) {
        const newNotification = {
            _id: new ObjectId(),
            title,
            message,
            link,
            createdAt: new Date(),
            read: false
        };
        try {
            await this.db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $setOnInsert: { notifications: [] } });
            const result = await this.db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $push: { notifications: newNotification } }
            );
            return result;
        } catch (err) {
            throw new Error('Error creating notification: ' + err.message);
        }
    }

    // Delete a notification
    async deleteNotification(userId, notificationId) {
        try {
            const result = await this.db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $pull: { notifications: { _id: new ObjectId(notificationId) } } }
            );
            return result;
        } catch (err) {
            throw new Error('Error deleting notification: ' + err.message);
        }
    }
}

module.exports = NotificationRepository;
