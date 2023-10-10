import {
	IPersistence,
	IPersistenceRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IGitHubIssueData } from '../definitions/githubIssueData';

export class GithubRepoIssuesStorage {
	constructor(
		private readonly persistence: IPersistence,
		private readonly persistenceRead: IPersistenceRead,
	) {}

	public async updateIssueData(
		room: IRoom,
		user: IUser,
		repositoryIssues: IGitHubIssueData,
	): Promise<boolean> {
		try {
			const associations: Array<RocketChatAssociationRecord> = [
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.MISC,
					`githubRepoIssues`,
				),
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.ROOM,
					room.id,
				),
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.USER,
					`${user.id}`,
				),
			];
			await this.persistence.updateByAssociations(
				associations,
				repositoryIssues,
				true,
			);
		} catch (error) {
			console.warn('Add Repository Issues Error :', error);
			return false;
		}
		return true;
	}

	public async getIssueData(
		roomId: string,
		user: IUser,
	): Promise<IGitHubIssueData> {
		try {
			const associations: Array<RocketChatAssociationRecord> = [
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.MISC,
					`githubRepoIssues`,
				),
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.ROOM,
					roomId,
				),
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.USER,
					`${user.id}`,
				),
			];
			const searchResults: Array<IGitHubIssueData> =
				(await this.persistenceRead.readByAssociations(
					associations,
				)) as Array<IGitHubIssueData>;

			if (searchResults?.length < 1) {
				console.warn('No Repo Issues Found ', searchResults);
				throw new Error('No Repo Issues Found');
			}
			return searchResults[0];
		} catch (error) {
			console.warn('No Repo Issues Found ');
			throw new Error('No Repo Issues Found');
		}
	}

	public async deleteIssueData(
		roomId: string,
		user: IUser,
	): Promise<boolean> {
		try {
			const associations: Array<RocketChatAssociationRecord> = [
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.MISC,
					`githubRepoIssues`,
				),
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.ROOM,
					roomId,
				),
				new RocketChatAssociationRecord(
					RocketChatAssociationModel.USER,
					`${user.id}`,
				),
			];
			await this.persistence.removeByAssociations(associations);
		} catch (error) {
			console.warn('Delete Repo Issues Error :', error);
			return false;
		}
		return true;
	}
}
