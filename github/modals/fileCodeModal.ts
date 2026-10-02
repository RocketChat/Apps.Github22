import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalsEnum } from "../enum/Modals";
import { AppEnum } from "../enum/App";
// import { getRoomTasks, getUIData, persistUIData } from '../lib/persistence';
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";

// The button value is a github.com diff or raw file link that comes back from the client.
// The token goes only to the API URL rebuilt from its parts, never to the link itself.
function githubApiRequest(url: string): { url: string; accept: string } | undefined {
    if (/\/\.{1,2}(\/|$)/.test(url)) {
        return undefined;
    }
    const diff = url.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)\.diff$/);
    if (diff) {
        return {
            url: `https://api.github.com/repos/${diff[1]}/${diff[2]}/pulls/${diff[3]}`,
            accept: "application/vnd.github.diff",
        };
    }
    const raw = url.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/raw\/([0-9a-f]{40})\/(.+)$/);
    if (raw) {
        return {
            url: `https://api.github.com/repos/${raw[1]}/${raw[2]}/contents/${raw[4]}?ref=${raw[3]}`,
            accept: "application/vnd.github.raw",
        };
    }
    return undefined;
}


export async function fileCodeModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    accessToken,
}: {
    data;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    accessToken?: IAuthData;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.CODE_VIEW;

    const block = modify.getCreator().getBlockBuilder();

    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    if (user?.id) {
        let roomId;
        const apiRequest = accessToken?.token ? githubApiRequest(data.value) : undefined;
        let pullRawData = apiRequest
            ? await http.get(apiRequest.url, {
                  headers: { Authorization: `token ${accessToken?.token}`, Accept: apiRequest.accept },
              })
            : await http.get(data.value);
        if (apiRequest && pullRawData.statusCode === 401) {
            pullRawData = await http.get(data.value);
        }
        const pullData = pullRawData.content;
        block.addSectionBlock({
            text: { text: `${pullData}`, type: TextObjectType.MARKDOWN },
        });

        // shows indentations in input blocks but not inn section block
        // block.addInputBlock({
        //     blockId: ModalsEnum.CODE_VIEW,
        //     label: { text: ModalsEnum.CODE_VIEW_LABEL, type: TextObjectType.PLAINTEXT },
        //     element: block.newPlainTextInputElement({
        //         initialValue : `${pullData}`,
        //         multiline:true,
        //         actionId: ModalsEnum.CODE_INPUT,
        //     })
        // });
    }

    block.addDividerBlock();

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: AppEnum.DEFAULT_TITLE,
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        blocks: block.getBlocks(),
    };
}
