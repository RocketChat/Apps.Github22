import { IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { IAuthData, IOAuth2ClientOptions } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'users');

export async function create(read: IRead, persistence: IPersistence, user: IUser): Promise<void> {
    const users = await getAllUsers(read);

    if (!users) {
        await persistence.createWithAssociation([user], assoc);
        return;
    }

    if (!isUserPresent(users, user)) {
        users.push(user);
        await persistence.updateByAssociation(assoc, users);
    }
}

export async function remove(read: IRead, persistence: IPersistence, user: IUser): Promise<void> {
    const users = await getAllUsers(read);

    if (!users || !isUserPresent(users, user)) {
        // @NOTE do nothing
        return;
    }

    const idx = users.findIndex((u: IUser) => u.id === user.id);
    users.splice(idx, 1);
    await persistence.updateByAssociation(assoc, users);
}

export async function getAllUsers(read: IRead): Promise<IUser[]> {
    const data = await read.getPersistenceReader().readByAssociation(assoc);
    return (data.length ? data[0] as IUser[] : []);
}

function isUserPresent(users: IUser[], targetUser: IUser): boolean {
    return users.some((user) => user.id === targetUser.id);
}

/**
  * This function needed to be copied from the apps engine due to difficulties trying to
  * get access to the auth client from inside a job processor.
  * @NOTE It relies on hardcoded information (config alias's suffix) to work and it might break if
  * the value changes
  */

export async function getAccessTokenForUser(read: IRead, user: IUser, config: IOAuth2ClientOptions): Promise<IAuthData | undefined> {
        const associations = [
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.USER,
                user.id,
            ),
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                `${config.alias}-oauth-connection`,
            ),
        ];

        const [ result ] = await read.getPersistenceReader().readByAssociations(associations) as unknown as Array<IAuthData | undefined>;

        return result;
}
