import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IGitHubSearchResultData } from "../definitions/searchResultData";

export class GithubSearchResultStorage {
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}

    public async updateSearchResult(
        room: IRoom,
        user: IUser,
        searchResult: IGitHubSearchResultData
    ): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `githubSearchResult`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    room.id
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    `${user.id}`
                ),
            ];
            await this.persistence.updateByAssociations(
                associations,
                searchResult,
                true
            );
        } catch (error) {
            console.warn("Add Search Result Error :", error);
            return false;
        }
        return true;
    }

    public async getSearchResults(
        roomId: string,
        user: IUser,
    ): Promise<IGitHubSearchResultData> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `githubSearchResult`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    roomId
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    `${user.id}`
                ),
            ];
            let searchResults: Array<IGitHubSearchResultData> =
                (await this.persistenceRead.readByAssociations(
                    associations
                )) as Array<IGitHubSearchResultData>;
            
            if(searchResults?.length<1){
                console.warn("No Search Result Found ",searchResults );
                throw new Error("No Search Result Found");
            }
            return searchResults[0];
        } catch (error) {
            console.warn("No Search Result Found " );
            throw new Error("No Search Result Found");
        }
    }

    public async deleteSearchResults(
        roomId: string,
        user: IUser,
    ): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `githubSearchResult`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    roomId
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    `${user.id}`
                ),
            ];
            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn("Delete Search Result Error :", error);
            return false;
        }
        return true;
    }
};