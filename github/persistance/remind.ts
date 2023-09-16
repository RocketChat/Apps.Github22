import {
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IReminder } from '../definitions/Reminder';

const assoc = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'reminder'
);

export async function CreateReminder(
    read: IRead,
    persistence: IPersistence,
    user: IUser,
    repo:string,
): Promise<void> {
    const reminders = await getAllReminders(read);

    if (reminders.length === 0) {
        await persistence.createWithAssociation(
            [
                {
                    userid:user.id,
                    username:user.username,
                    repos:[repo]
                }
            ],
            assoc
        );
        return;
    }
    if (
        !isReminderExist(reminders, {
            userid:user.id,
            username:user.username,
            repos: [repo]
        })
    ) {
        reminders.push({
            userid:user.id,
            username:user.name,
            repos: [repo]
        });
        await persistence.updateByAssociation(assoc, reminders);
    } else {
        const idx = reminders.findIndex((u:IReminder)=>u.userid === user.id)

        if(!reminders[idx].repos.includes(repo)){
            reminders[idx].repos.push(repo);
        }

        await persistence.updateByAssociation(assoc,reminders)
    }
}

export async function RemoveReminder(
    read: IRead,
    persistence: IPersistence,
    user: IReminder
): Promise<void> {
    const reminders = await getAllReminders(read);

    if (!reminders || !isReminderExist(reminders, user)) {
        return;
    }

    const idx = reminders.findIndex((u: IReminder) => u.userid === user.userid);
    reminders.splice(idx, 1);
    await persistence.updateByAssociation(assoc, reminders);
}

export async function getAllReminders(read: IRead): Promise<IReminder[]> {
    const data = await read.getPersistenceReader().readByAssociation(assoc);
    return data.length ? (data[0] as IReminder[]) : [];
}

function isReminderExist(reminders: IReminder[], targetUser: IReminder): boolean {
    return reminders.some((user) => user.userid === targetUser.userid);
}


