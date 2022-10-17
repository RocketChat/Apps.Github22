import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function contributorListMessage({
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
    let gitResponse: any;
    if(accessToken?.token){
        gitResponse = await http.get(`https://api.github.com/repos/${repository}/contributors`, {
            headers: {
                Authorization: `token ${accessToken?.token}`,
                "Content-Type": "application/json",
            },
        });
    } else {
        gitResponse = await http.get(
            `https://api.github.com/repos/${repository}/contributors`
        );
    }
    const resData = gitResponse.data;
    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`*CONTRIBUTOR LIST*`);

    if (room) {
        textSender.setRoom(room);
    }

    await modify.getCreator().finish(textSender);
    resData.forEach(async (contributor, ind) => {
        if (ind < 20) {
            const login = contributor.login;
            const html_url = contributor.html_url;

            const textSender = await modify
                .getCreator()
                .startMessage()
                .setText(`[ ${login} ](${html_url})`);

            if (room) {
                textSender.setRoom(room);
            }

            await modify.getCreator().finish(textSender);
        }
    });
}
