import {
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { IAuthData } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { IUser } from '@rocket.chat/apps-engine/definition/users';


export interface NewIUser {
    userid:string,
    username:string,
    repos: string[];
}

const assoc = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'reminder'
);

/**
 * Returns all users from the database
 * @param read - accessor to the environment
 * @param persistence
 * @param user - user to be added
 * @param repo - repo to be added for reminder
 */
export async function persistreminder(
    read: IRead,
    persistence: IPersistence,
    user: IUser,
    // figmaData: IFigmaUserData
    repo:string,
): Promise<void> {
    const users = await getAllUsers(read);

    console.log(users);

    if (users.length === 0) {
        console.log('!users')
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
        !isUserPresent(users, {
            userid:user.id,
            username:user.username,
            repos: [repo]
        })
    ) {
        console.log('!iuserPrest ')
        users.push({
            userid:user.id,
            username:user.name,
            repos: [repo]
        });
        await persistence.updateByAssociation(assoc, users);
    } else {
        // console.log('error: user was already present in db');
        console.log('user present')
        const idx = users.findIndex((u:NewIUser)=>u.userid === user.id)

        if(!users[idx].repos.includes(repo)){
            users[idx].repos.push(repo);
        }

        await persistence.updateByAssociation(assoc,users)
    }
}

/**
 * Returns all users from the database
 * @param read - accessor to the environment
 * @param persistence - persistance to the environment
 * @param user - user to be removed
 */
export async function remove(
    read: IRead,
    persistence: IPersistence,
    user: NewIUser
): Promise<void> {
    const users = await getAllUsers(read);

    if (!users || !isUserPresent(users, user)) {
        return;
    }

    const idx = users.findIndex((u: NewIUser) => u.userid === user.userid);
    users.splice(idx, 1);
    await persistence.updateByAssociation(assoc, users);
}


/**
 * Returns all users from the database
 * @param read - accessor to the environment
 */
export async function getAllUsers(read: IRead): Promise<NewIUser[]> {
    const data = await read.getPersistenceReader().readByAssociation(assoc);
    return data.length ? (data[0] as NewIUser[]) : [];
}

/**
 * Returns true if the provided value is present in the array.
 * @param users - The array to search in.
 * @param  targetUser - The value to search for.
 */

function isUserPresent(users: NewIUser[], targetUser: NewIUser): boolean {
    return users.some((user) => user.userid === targetUser.userid);
}
