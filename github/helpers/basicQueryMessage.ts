import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { issueListMessage } from "../lib/issuesListMessage";
import { contributorListMessage } from "../lib/contributorListMessage";
import { pullRequestListMessage } from "../lib/pullRequestListMessage";
import { repoDataMessage } from "../lib/repoDataMessage";
import { helperMessage } from "../lib/helperMessage";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";

export async function basicQueryMessage({
    query,
    repository,
    room,
    read,
    persistence,
    modify,
    http,
    accessToken,
}: {
    query: String,
    repository: String,
    room: IRoom;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
    accessToken?: IAuthData
}) {

    switch (query) {
        case "issues": {
            await issueListMessage({ repository, room, read, persistence, modify, http, accessToken });
            break;
        }
        case "contributors": {
            await contributorListMessage({ repository, room, read, persistence, modify, http, accessToken });
            break;
        }
        case "pulls": {
            await pullRequestListMessage({ repository, room, read, persistence, modify, http, accessToken });
            break;
        }
        case "repo": {
            await repoDataMessage({ repository, room, read, persistence, modify, http, accessToken })
            break;
        }
        default:
            await helperMessage({ room, read, persistence, modify, http });
    }
}
