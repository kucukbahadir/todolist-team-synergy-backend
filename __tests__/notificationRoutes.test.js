const { ObjectId } = require('mongodb');
const NotificationRepository = require('../repositories/NotificationRepository');

describe('NotificationRepository', () => {
    let mockDB;
    let notificationRepository;

    beforeEach(() => {
        mockDB = {
            collection: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
        };
        notificationRepository = new NotificationRepository(mockDB);
    });

    test('getAllNotifications - should return notifications for a user', async () => {
        const userId = new ObjectId();
        const mockNotifications = [{ _id: new ObjectId(), title: 'Test', read: false }];
        mockDB.findOne.mockResolvedValue({ _id: userId, notifications: mockNotifications });

        const result = await notificationRepository.getAllNotifications(userId);
        expect(mockDB.collection).toHaveBeenCalledWith('users');
        expect(mockDB.findOne).toHaveBeenCalledWith({ _id: userId });
        expect(result).toEqual(mockNotifications);
    });

    test('markNotificationAsRead - should mark a notification as read', async () => {
        const userId = new ObjectId();
        const notificationId = new ObjectId();
        const mockResult = { modifiedCount: 1 };
        mockDB.updateOne.mockResolvedValue(mockResult);

        const result = await notificationRepository.markNotificationAsRead(userId, notificationId);
        expect(mockDB.collection).toHaveBeenCalledWith('users');
        expect(mockDB.updateOne).toHaveBeenCalledWith(
            { _id: userId, 'notifications._id': notificationId },
            { $set: { 'notifications.$.read': true } }
        );
        expect(result).toEqual(mockResult);
    });

    test('createNotification - should add a new notification to the user', async () => {
        const userId = new ObjectId();
        const notificationData = { title: 'New', message: 'Message', link: 'https://example.com' };
        const mockResult = { modifiedCount: 1 };
        mockDB.updateOne.mockResolvedValue(mockResult);

        const result = await notificationRepository.createNotification(userId, notificationData);
        expect(mockDB.collection).toHaveBeenCalledWith('users');
        expect(mockDB.updateOne).toHaveBeenCalledWith(
            { _id: userId },
            { $setOnInsert: { notifications: [] } }
        );
        expect(mockDB.updateOne).toHaveBeenCalledWith(
            { _id: userId },
            { $push: { notifications: expect.objectContaining({ title: 'New', read: false }) } }
        );
        expect(result).toEqual(mockResult);
    });

    test('deleteNotification - should remove a notification from the user', async () => {
        const userId = new ObjectId();
        const notificationId = new ObjectId();
        const mockResult = { modifiedCount: 1 };
        mockDB.updateOne.mockResolvedValue(mockResult);

        const result = await notificationRepository.deleteNotification(userId, notificationId);
        expect(mockDB.collection).toHaveBeenCalledWith('users');
        expect(mockDB.updateOne).toHaveBeenCalledWith(
            { _id: userId },
            { $pull: { notifications: { _id: notificationId } } }
        );
        expect(result).toEqual(mockResult);
    });
});
