import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IGithubIssueReaction } from "../definitions/githubIssueReaction";

export class GithubIssueReactionStorage {
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}

    public async updateIssueReactionData(
        user: IUser,
        issueReaction: IGithubIssueReaction
    ): Promise<boolean> {
        try {
            const { issue_number, repo_name, reaction } = issueReaction;
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    user.id
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    repo_name
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    issue_number
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    reaction
                ),
            ];

            await this.persistence.updateByAssociations(
                associations,
                issueReaction,
                true
            );
        } catch (error) {
            console.warn("update Issue Reaction Issue Error :", error);
            return false;
        }

        return true;
    }

    public async getIssueReactionData(
        user: IUser,
        issueReaction: IGithubIssueReaction
    ): Promise<IGithubIssueReaction | boolean> {
        try {
            const { issue_number, repo_name, reaction } = issueReaction;
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    user.id
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    repo_name
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    issue_number
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    reaction
                ),
            ];

            const githubIssueReactionData =
                (await this.persistenceRead.readByAssociations(
                    associations
                )) as Array<IGithubIssueReaction>;

            if (githubIssueReactionData.length < 1) {
                console.warn(
                    "No Issue Reaction Data Found ",
                    githubIssueReactionData
                );
                return false;
            }

            return githubIssueReactionData[0];
        } catch (error) {
            console.warn("Error While Fetching Issue ReactionId:", error);
            throw new Error("No Related Issue Reaction Found");
        }
    }

    public async removeIssueReactionData(
        user: IUser,
        issueReaction: IGithubIssueReaction
    ): Promise<boolean> {
        try {
            const { issue_number, repo_name, reaction } = issueReaction;
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    user.id
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    repo_name
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    issue_number
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    reaction
                ),
            ];

            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn("Error While Remove Issue Reaction Data: ", error);
            return false;
        }

        return true;
    }
}
