import {
    IModify,
    IRead,
    IPersistence,
    IHttp,
} from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    ButtonStyle,
    TextObjectType,
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { IGist } from "../definitions/Gist";
import { IGistFile } from "../definitions/GistFile";
import { ModalsEnum } from "../enum/Modals";
import { OcticonIcons } from "../enum/OcticonIcons";
import {
    getBasicUserInfo,
    getUserAssignedIssues,
    getUserGist,
    loadGist,
} from "../helpers/githubSDK";
import {
    getInteractionRoomData,
    storeInteractionRoomData,
} from "../persistance/roomInteraction";

export async function userGistModal({
    access_token,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    access_token: string;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.USER_ISSUE_VIEW;
    const block = modify.getCreator().getBlockBuilder();
    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    if (user?.id) {
        let roomId;
        if (room?.id) {
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        } else {
            roomId = (
                await getInteractionRoomData(
                    read.getPersistenceReader(),
                    user.id
                )
            ).roomId;
        }
    }

    const userInfo = await getBasicUserInfo(http, access_token);

    const usersGist: IGist[] = await getUserGist(
        http,
        userInfo.username ?? "",
        access_token
    );

    block.addContextBlock({
        elements : [
            block.newMarkdownTextObject("*Tip* : You can directly enter `/gh gist 1` to send the most recent gist created by you.")
        ]
    })
    for(const val of usersGist){

        block.addContextBlock({
            elements : [
                block.newImageElement({
                    imageUrl : val['owner']['avatar_url'],
                    altText : "Created by"
                }),
                block.newPlainTextObject(val['owner']['login']),
                block.newImageElement({
                    imageUrl : OcticonIcons.PENCIL,
                    altText : "Updated at",
                }),
                block.newPlainTextObject(new Date(val.updated_at).toISOString())
            ]
        })

        block.addActionsBlock({
            elements : [
                block.newButtonElement({
                    value : JSON.stringify(val),
                    text : {
                        text : "Share in chat 🚀",
                        type : TextObjectType.PLAINTEXT
                    },
                    style : ButtonStyle.PRIMARY,
                    actionId : ModalsEnum.SHARE_GIST_ACTION
                })
            ]
        })

        const files = new Map<string, IGistFile>(Object.entries(val.files));
        for(const [_key, value] of files){
            const gistContent = await loadGist(
                http,
                value.raw_url,
                access_token
            );
            block.addSectionBlock({
                text: {
                    text: value.filename,
                    type: TextObjectType.PLAINTEXT,
                },
            });
            block.addSectionBlock({
                text: {
                    text: `\`\`\`${value.language}\n ${gistContent} \n\`\`\``,
                    type: TextObjectType.MARKDOWN,
                },
            });
        }

        block.addDividerBlock();
    }

    return {
        id: viewId,
        title: {
            text: "Your Gists",
            type: TextObjectType.PLAINTEXT,
        },
        blocks: block.getBlocks(),
    };
}
