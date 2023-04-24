import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { getRepoUrl } from "../helpers/githubSDK";


export async function repoDataMessage({
    repository,
    room,
    read,
    persistence,
    modify,
    http,
    accessToken,
}: {
    repository : String,
    room: IRoom;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
    accessToken?: IAuthData;
}){
    let gitResponse:any;
    let url = getRepoUrl(repository);

    if(accessToken?.token){
        gitResponse = await http.get(url, {
            headers: {
                Authorization: `token ${accessToken?.token}`,
                "Content-Type": "application/json",
            },
        });
    } else {
        gitResponse = await http.get(
            url
        );
    }
    const resData = gitResponse.data;
    const fullName =
        "[" +
        resData.full_name +
        "](" +
        resData.html_url +
        ")" +
        " ▫️ ";
    const stars =
        "` ⭐ Stars " + resData.stargazers_count + " ` ";
    const issues = "` ❗ Issues " + resData.open_issues + " ` ";
    const forks = "` 🍴 Forks " + resData.forks_count + " ` ";
    let tags = "";
    if (
        resData &&
        resData.topics &&
        Array.isArray(resData.topics)
    ) {
        resData.topics.forEach((topic: string) => {
            let tempTopic = " ` ";
            tempTopic += topic;
            tempTopic += " ` ";
            tags += tempTopic;
        });
    }

    const description = resData.description || 'No description provided.';

    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(
            fullName +
                stars +
                issues +
                forks +
                "`" +
                description +
                "`" +
                tags
        );
    if (room) {
        textSender.setRoom(room);
    }
    await modify.getCreator().finish(textSender);
}
