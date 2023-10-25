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
    repo: string,
): Promise<void> {
    const reminders = await getAllReminders(read);

    if (reminders.length === 0) {
        await persistence.createWithAssociation(
            [
                {
                    userid: user.id,
                    username: user.username,
                    repos: [repo],
                    unsubscribedPR: [],
                }
            ],
            assoc
        );
        return;
    }
    if (
        !isReminderExist(reminders, {
            userid: user.id,
            username: user.username,
            repos: [repo],
            unsubscribedPR: []
        })
    ) {
        reminders.push({
            userid: user.id,
            username: user.name,
            repos: [repo],
            unsubscribedPR: []
        });
        await persistence.updateByAssociation(assoc, reminders);
    } else {
        const idx = reminders.findIndex((u: IReminder) => u.userid === user.id)

        if (!reminders[idx].repos.includes(repo)) {
            reminders[idx].repos.push(repo);
        }

        await persistence.updateByAssociation(assoc, reminders)
    }
}

export async function unsubscribedPR(read: IRead, persistence: IPersistence, repo: string, Prnum: number, user: IUser): Promise<void> {
    const reminders = await getAllReminders(read);
    const repository = repo.trim();
    const PullRequestNumber = Prnum;
    const index = reminders.findIndex((reminder: IReminder) => reminder.userid === user.id);
    const reminder = reminders[index] as IReminder
    const unsubscribPR = reminder.unsubscribedPR.find((value) => value.repo === repository);

    if (unsubscribPR) {
        const idx = reminder.unsubscribedPR.findIndex((value) => value.repo === repository);
        const unsubscribPRnums = reminder.unsubscribedPR[idx].prnum;
        if (!unsubscribPRnums.includes(PullRequestNumber)) {
            unsubscribPRnums.push(PullRequestNumber);
        }
    } else {
        reminder.unsubscribedPR.push({
            repo: repository,
            prnum: [PullRequestNumber]
        })
    }
    
    await persistence.updateByAssociation(assoc, reminders)
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

export async function getUserReminder(read:IRead,User:IUser):Promise<IReminder>{
    const reminders = await getAllReminders(read);
    const index = reminders.findIndex((reminder)=>reminder.userid === User.id);
    return reminders[index];
}

export async function removeRepoReminder(read:IRead,persistence:IPersistence,repository:string,User:IUser){
    const reminders = await getAllReminders(read);

    const idx = reminders.findIndex((u: IReminder) => u.userid === User.id);
    const repoindex = reminders[idx].repos.findIndex((repo)=>repo == repository);

    reminders[idx].repos.splice(repoindex,1);

    await persistence.updateByAssociation(assoc, reminders);   
}