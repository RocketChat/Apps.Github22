import { IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';

interface INotificationsStatus {
    status: boolean;
}

export class NotificationsController {
    private read: IRead;
    private persistence: IPersistence;
    private association: RocketChatAssociationRecord;
    private userAssociation: RocketChatAssociationRecord;

    constructor(read: IRead, persistence: IPersistence, user: IUser) {
        this.read = read;
        this.persistence = persistence;
        this.association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            `github-notifications`,
        );

        this.userAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            user.id,
        );
    }

    public async getNotificationsStatus(): Promise<INotificationsStatus> {

        const [record] = await this.read
            .getPersistenceReader()
            .readByAssociations([this.association, this.userAssociation]);

        return record as INotificationsStatus;
    }

    public async setNotificationsStatus(status: boolean): Promise<boolean> {
        await this.persistence.createWithAssociations({ status } , [this.association, this.userAssociation]);
        return status;
    }

    public async updateNotificationsStatus(status: boolean) {
        const notificationsStatus = await this.getNotificationsStatus();

        if (!notificationsStatus) {
            return await this.setNotificationsStatus(status);
        }

        await this.persistence.updateByAssociations([this.association, this.userAssociation], { status });

        return status;
    }

    public async deleteNotifications(): Promise<void> {
        await this.persistence.removeByAssociations([this.association, this.userAssociation]);
    }
}