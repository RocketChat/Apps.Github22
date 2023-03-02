import {
    IHttp,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IMessageReactionContext } from "@rocket.chat/apps-engine/definition/messages";
import { IGithubIssueReaction } from "../definitions/githubIssueReaction";
import { GithubApp } from "../GithubApp";
import { isAvailableReaction } from "../helpers/githubIssueReaction";
import { createIssueReaction, removeIssueReaction } from "../helpers/githubSDK";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubIssueReactionStorage } from "../persistance/githubIssueReaction";

export async function HandleIssueReaction(
    app: GithubApp,
    context: IMessageReactionContext,
    read: IRead,
    http: IHttp,
    persistence: IPersistence
) {
    if (context.message.customFields?.["issue"]) {
        const { includes_emoji, emoji } = isAvailableReaction(context);
        // when user reacts to those 6 emojis
        if (includes_emoji) {
            const user = context.user;
            const auth = await getAccessTokenForUser(
                read,
                user,
                app.oauth2Config
            );

            if (auth) {
                const { issue_number, owner, repo_name } =
                    context.message?.customFields;
                const token = auth.token;
                const persistanceRead = await read.getPersistenceReader();
                const githubIssueReactionStorage =
                    new GithubIssueReactionStorage(
                        persistence,
                        persistanceRead
                    );

                // NOTE: isReacted field of context was retrieving undefined until RC-SERVER version 5.4.3 which is fixed in 6.0.0
                if (context.isReacted) {
                    const response = await createIssueReaction(
                        repo_name,
                        owner,
                        issue_number,
                        http,
                        token,
                        emoji,
                        user.id
                    );

                    if (response.error == undefined) {
                        const issueReactionData =
                            response as IGithubIssueReaction;
                        await githubIssueReactionStorage.updateIssueReactionData(
                            user,
                            issueReactionData
                        );
                    }
                } else {
                    // when user removes the reaction

                    const issueReactionData: IGithubIssueReaction = {
                        user_id: user.id,
                        reaction: emoji,
                        repo_name,
                        issue_number,
                    };

                    const issueReactionResponse =
                        await githubIssueReactionStorage.getIssueReactionData(
                            user,
                            issueReactionData
                        );
                    // meaning there are no reactions involved with this associations
                    if (issueReactionResponse === false) {
                        return;
                    }

                    const githubIssueReactionData =
                        issueReactionResponse as IGithubIssueReaction;

                    const reaction_id =
                        githubIssueReactionData.reaction_id as string;

                    const response = await removeIssueReaction(
                        repo_name,
                        owner,
                        issue_number,
                        http,
                        token,
                        reaction_id
                    );

                    if (response === true) {
                        await githubIssueReactionStorage.removeIssueReactionData(
                            user,
                            githubIssueReactionData
                        );
                    }
                }
            }
        }
    }
}
