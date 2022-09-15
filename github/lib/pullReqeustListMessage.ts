import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function pullRequestListMessage({
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
}) {
  
    let gitResponse:any;
    if(accessToken?.token){
        gitResponse = await http.get(`https://api.github.com/repos/${repository}/pulls`, {
            headers: {
                Authorization: `token ${accessToken?.token}`,
                "Content-Type": "application/json",
            },
        });
    } else {
        gitResponse = await http.get(
            `https://api.github.com/repos/${repository}/pulls`
        );
    }
    const resData = gitResponse.data;
    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`*PULL REQUESTS*`);

    if (room) {
        textSender.setRoom(room);
    }

    await modify.getCreator().finish(textSender);
    resData.forEach(async (pull, ind) => {
        if (ind < 10) {
            const url = pull.html_url;
            const textSender = await modify
                .getCreator()
                .startMessage()
                .setText(`[ #${pull.number} ](${url})  *${pull.title}*`);

            if (room) {
                textSender.setRoom(room);
            }
            await modify.getCreator().finish(textSender);
        }
    });
}
