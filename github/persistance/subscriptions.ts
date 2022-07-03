import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ISubscription } from '../definitions/subscription';

export class Subscription {
    constructor(private readonly persistence: IPersistence, private readonly persistenceRead: IPersistenceRead, private readonly user: IUser) { }

    public async createSubscription(repoName: string, event: string, webhookId: string, room: IRoom): Promise<boolean> {

        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `subsciption`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `repo:${repoName}`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id),
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, event),
                new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${this.user.id}`)
            ];
            let subscriptionRecord: ISubscription = {
                webhookId: webhookId,
                user: this.user.id,
                repoName: repoName,
                room: room.id,
                event: event
            }
            await this.persistence.updateByAssociations(associations, subscriptionRecord, true);

        } catch (error) {
            console.warn('Subsciption Error :', error)
            return false;
        }
        return true;
    }

    public async getSubscribedRooms(repoName: string, event: string): Promise<Array<ISubscription>> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `subsciption`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `repo:${repoName}`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, event),
            ];
            let subsciptions: Array<ISubscription> = await this.persistenceRead.readByAssociations(associations) as Array<ISubscription>;
            return subsciptions;
        } catch (error) {
            console.warn('Get Subscribed Rooms Error :', error)
            let subsciptions: Array<ISubscription> = [];
            return subsciptions;
        }
    }

    public async getSubscriptions(roomId: string): Promise<Array<ISubscription>> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `subsciption`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId),
            ];
            let subsciptions: Array<ISubscription> = await this.persistenceRead.readByAssociations(associations) as Array<ISubscription>;
            return subsciptions;
        } catch (error) {
            console.warn('Get Subsciption Error :', error)
            let subsciptions: Array<ISubscription> = [];
            return subsciptions;
        }
    }

    public async deleteSubscriptions(repoName: string, event: string): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `subsciption`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `repo:${repoName}`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, event),
            ];
            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn('Delete Subsciption Error :', error)
            return false;
        }
        return true;
    }

    public async deleteAllRoomSubscriptions(roomId: string): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `subsciption`),
                new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId),
            ];
            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn('Delete All Room Subsciption Error :', error)
            return false;
        }
        return true;
    }

}