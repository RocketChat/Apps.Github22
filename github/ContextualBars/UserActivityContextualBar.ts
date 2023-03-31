import { IHttp, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import {
    BlockBuilder,
    BlockElementType,
    ButtonStyle,
    IBlockElement,
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { uiKitModal } from "@rocket.chat/ui-kit";
import { IGithubActivity } from "../definitions/IGithubActivity";
import { ModalsEnum } from "../enum/Modals";
import { OcticonIcons } from "../enum/OcticonIcons";
import { getBasicUserInfo, getUserActivity } from "../helpers/githubSDK";

function extractComment(str: string): string {
    const regex = /^(?:>.*\n+)?(.*)/s;
    const match = str.match(regex);
    return match ? match[1] : "";
}

function LoadUserActivityEntry(
    activity: IGithubActivity,
    blocks: BlockBuilder
): void {
    // Three types of Activities need to be handled

    switch (activity.type) {
        case "IssuesEvent":
            blocks.addContextBlock({
                elements: [
                    blocks.newImageElement({
                        altText: "Issue Event Image",
                        imageUrl: OcticonIcons.ISSUE_OPEN,
                    }),
                    blocks.newMarkdownTextObject(
                        activity.payload.issue
                            ? `*${activity.payload.issue.title!}`
                            : ""
                    ),
                ],
            });
            blocks.addActionsBlock({
                elements: [
                    blocks.newButtonElement({
                        actionId: ModalsEnum.SHOW_ISSUE_VIEW_CONTEXTUAL_BAR,
                        value: JSON.stringify(activity),
                        text: blocks.newPlainTextObject("View Issue"),
                        style: ButtonStyle.PRIMARY
                    }),
                    blocks.newButtonElement({
                        actionId: "anything",
                        text: blocks.newPlainTextObject("Share Issue"),
                        style: ButtonStyle.PRIMARY
                    })
                ]
            })
            break;
        case "PullRequestEvent":
            blocks.addContextBlock({
                elements: [
                    blocks.newImageElement({
                        altText: "Pull Request Image",
                        imageUrl: OcticonIcons.PULL_REQUEST,
                    }),
                    blocks.newMarkdownTextObject(
                        activity.payload.pull_request
                            ? `*${activity.payload.pull_request.title!}*`
                            : ""
                    ),
                ],
            });
            blocks.addActionsBlock({
                elements: [
                    blocks.newButtonElement({
                        actionId: "anything",
                        text: blocks.newPlainTextObject("View Pull Request"),
                        style: ButtonStyle.PRIMARY
                    }),
                    blocks.newButtonElement({
                        actionId: "anything",
                        text: blocks.newPlainTextObject("Share Pull Request"),
                        style: ButtonStyle.PRIMARY
                    })
                ]
            })
            break;
        case "IssueCommentEvent":
            console.log(activity.payload.comment?.body);
            blocks.addContextBlock({
                elements: [
                    blocks.newImageElement({
                        altText: "Comment Image",
                        imageUrl: OcticonIcons.COMMENTS,
                    }),
                    blocks.newMarkdownTextObject(
                        activity.payload.comment
                            ? `*${extractComment(
                                  activity.payload.comment.body
                              ).substring(0, 100)}*`
                            : ""
                    ),
                ],
            });
            blocks.addActionsBlock({
                elements: [
                    blocks.newButtonElement({
                        actionId: "anything",
                        text: blocks.newPlainTextObject("View Comment"),
                        style: ButtonStyle.PRIMARY
                    }),
                    blocks.newButtonElement({
                        actionId: "anything",
                        text: blocks.newPlainTextObject("Share Comment"),
                        style: ButtonStyle.PRIMARY
                    })
                ]
            })
            break;
    }

    blocks.addContextBlock({
        elements: [
            blocks.newPlainTextObject(
                activity.repo ? activity.repo.name : "",
                true
            ),
        ],
    });

    blocks.addDividerBlock();
}

export async function UserActivityContextualBar(
    accessToken: string,
    modify: IModify,
    http: IHttp,
    pageNumber: number,
) {
    const blocks = modify.getCreator().getBlockBuilder();
    let No_More_Elements: boolean = false;

    const user = await getBasicUserInfo(http, accessToken)

    const data = await getUserActivity(
        http,
        user.username ?? "",
        accessToken,
        pageNumber,
        "MONTH",
        10
    );

    if (data.length === 0){
        No_More_Elements = true
    }

    data.forEach((activity) => {
        LoadUserActivityEntry(activity, blocks);
    });

    let actionsArray: IBlockElement[] = [];

    if ( pageNumber != 1 ) {
        actionsArray.unshift(
            blocks.newButtonElement({
                text: {
                    text: "Prev",
                    type: TextObjectType.PLAINTEXT,
                },
                actionId: ModalsEnum.SWITCH_ACTIVITY_PAGE_PREV,
                value: `${pageNumber}`,
                style: ButtonStyle.PRIMARY,
            }),
        );
    }

    if (!No_More_Elements){
        actionsArray.push(blocks.newButtonElement({
            text: {
                text: "Next",
                type: TextObjectType.PLAINTEXT,
            },
            actionId: ModalsEnum.SWITCH_ACTIVITY_PAGE_NEXT,
            value: `${pageNumber}`,
            style: ButtonStyle.PRIMARY,
        }))
    }

    blocks.addActionsBlock({
        elements: actionsArray,
    });

    return {
        // [6]
        id: "contextualbarId",
        title: blocks.newPlainTextObject("User's Activity"),
        blocks: blocks.getBlocks(),
    };
}
