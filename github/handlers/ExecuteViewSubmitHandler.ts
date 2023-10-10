import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { ModalsEnum } from '../enum/Modals';
import { sendMessage, sendNotification } from '../lib/message';
import { getInteractionRoomData } from '../persistance/roomInteraction';
import { Subscription } from '../persistance/subscriptions';
import { GithubApp } from '../GithubApp';
import { getWebhookUrl } from '../helpers/getWebhookURL';
import { getAccessTokenForUser } from '../persistance/auth';
import { subscriptionsModal } from '../modals/subscriptionsModal';
import { messageModal } from '../modals/messageModal';
import { pullRequestCommentsModal } from '../modals/pullRequestCommentsModal';
import { githubSearchResultModal } from '../modals/githubSearchResultModal';
import { IGitHubSearchResult } from '../definitions/searchResult';
import { IGitHubSearchResultData } from '../definitions/searchResultData';
import { githubSearchErrorModal } from '../modals/githubSearchErrorModal';
import { GithubSearchResultStorage } from '../persistance/searchResults';
import { githubSearchResultShareModal } from '../modals/githubSearchResultsShareModal';
import {
	createSubscription,
	updateSubscription,
	createNewIssue,
	getIssueTemplates,
	githubSearchIssuesPulls,
	mergePullRequest,
	addNewPullRequestComment,
	getPullRequestData,
	getPullRequestComments,
	getRepoData,
	getRepositoryIssues,
	updateGithubIssues,
	addNewIssueComment,
	getIssuesComments,
	getIssueData,
} from '../helpers/githubSDK';
import { NewIssueModal } from '../modals/newIssueModal';
import { issueTemplateSelectionModal } from '../modals/issueTemplateSelectionModal';
import { githubIssuesListModal } from '../modals/githubIssuesListModal';
import { IGitHubIssue } from '../definitions/githubIssue';
import { GithubRepoIssuesStorage } from '../persistance/githubIssues';
import { IGitHubIssueData } from '../definitions/githubIssueData';
import { githubIssuesShareModal } from '../modals/githubIssuesShareModal';
import { issueCommentsModal } from '../modals/issueCommentsModal';

export class ExecuteViewSubmitHandler {
	constructor(
		private readonly app: GithubApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

	public async run(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

		try {
			switch (view.id) {
				case ModalsEnum.ADD_SUBSCRIPTION_VIEW:
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							const repository =
								view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[
									ModalsEnum.REPO_NAME_INPUT_ACTION
								];
							const events =
								view.state?.[
									ModalsEnum.ADD_SUBSCRIPTION_EVENT_INPUT
								]?.[ModalsEnum.ADD_SUBSCRIPTION_EVENT_OPTIONS];

							if (
								typeof repository == undefined ||
								typeof events == undefined
							) {
								await sendNotification(
									this.read,
									this.modify,
									user,
									room,
									'Invalid Input !',
								);
							} else {
								const accessToken = await getAccessTokenForUser(
									this.read,
									user,
									this.app.oauth2Config,
								);
								if (!accessToken) {
									await sendNotification(
										this.read,
										this.modify,
										user,
										room,
										'Login To Github !',
									);
								} else {
									//if we have a webhook for the repo and our room requires the same event,we just make our entries to the apps storage instead of making a new hook
									//if we have a hook but we dont have all the events, we send in a patch request,

									const url = await getWebhookUrl(this.app);

									const subscriptionStorage =
										new Subscription(
											this.persistence,
											this.read.getPersistenceReader(),
										);
									const subscribedEvents = new Map<
										string,
										boolean
									>();
									let hookId = '';

									const subscriptions =
										await subscriptionStorage.getSubscriptionsByRepo(
											repository,
											user.id,
										);
									if (subscriptions && subscriptions.length) {
										for (const subscription of subscriptions) {
											subscribedEvents.set(
												subscription.event,
												true,
											);
											if (hookId == '') {
												hookId = subscription.webhookId;
											}
										}
									}
									let additionalEvents = 0;
									for (const event of events) {
										if (!subscribedEvents.has(event)) {
											additionalEvents++;
											subscribedEvents.set(event, true);
										}
									}
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									let response: any;
									//if hook is null we create a new hook, else we add more events to the new hook
									if (hookId == '') {
										response = await createSubscription(
											this.http,
											repository,
											url,
											accessToken.token,
											events,
										);
									} else {
										//if hook is already present, we just need to send a patch request to add new events to existing hook
										const newEvents: Array<string> = [];
										for (const [
											event,
										] of subscribedEvents) {
											newEvents.push(event);
										}
										if (
											additionalEvents &&
											newEvents.length
										) {
											response = await updateSubscription(
												this.http,
												repository,
												accessToken.token,
												hookId,
												newEvents,
											);
										}
									}
									let createdEntry = false;
									//subscribe rooms to hook events
									for (const event of events) {
										createdEntry =
											await subscriptionStorage.createSubscription(
												repository,
												event,
												response?.id,
												room,
												user,
											);
									}
									if (!createdEntry) {
										throw new Error(
											'Error creating new subscription entry',
										);
									}
									await sendNotification(
										this.read,
										this.modify,
										user,
										room,
										`Subscibed to ${repository} ✔️`,
									);
								}
							}
							const modal = await subscriptionsModal({
								modify: this.modify,
								read: this.read,
								persistence: this.persistence,
								http: this.http,
								uikitcontext: context,
							});
							await this.modify.getUiController().updateModalView(
								modal,
								{
									triggerId:
										context.getInteractionData().triggerId,
								},
								context.getInteractionData().user,
							);
							return context
								.getInteractionResponder()
								.successResponse();
						}
					}
					break;
				case ModalsEnum.NEW_ISSUE_VIEW: {
					const { roomId } = await getInteractionRoomData(
						this.read.getPersistenceReader(),
						user.id,
					);
					if (roomId) {
						const room = (await this.read
							.getRoomReader()
							.getById(roomId)) as IRoom;
						let repository = view.state?.[
							ModalsEnum.REPO_NAME_INPUT
						]?.[ModalsEnum.REPO_NAME_INPUT_ACTION] as string;
						let title = view.state?.[
							ModalsEnum.ISSUE_TITLE_INPUT
						]?.[ModalsEnum.ISSUE_TITLE_ACTION] as string;
						const issueBody =
							view.state?.[ModalsEnum.ISSUE_BODY_INPUT]?.[
								ModalsEnum.ISSUE_BODY_INPUT_ACTION
							];
						let issueLabels = view.state?.[
							ModalsEnum.ISSUE_LABELS_INPUT
						]?.[ModalsEnum.ISSUE_LABELS_INPUT_ACTION] as string;
						let issueAssignees = view.state?.[
							ModalsEnum.ISSUE_ASSIGNEES_INPUT
						]?.[ModalsEnum.ISSUE_ASSIGNEES_INPUT_ACTION] as string;
						issueLabels = issueLabels?.trim() || '';
						issueAssignees = issueAssignees?.trim() || '';
						let issueLabelsArray: Array<string> = [];
						let issueAssigneesArray: Array<string> = [];
						if (issueLabels?.length > 0) {
							issueLabelsArray = issueLabels.split(' ');
						}
						if (issueAssignees?.length > 0) {
							issueAssigneesArray = issueAssignees.split(' ');
						}
						if (
							repository &&
							repository?.trim()?.length &&
							title &&
							title?.trim()?.length
						) {
							repository = repository?.trim();
							title = title?.trim() || '';
							const accessToken = await getAccessTokenForUser(
								this.read,
								user,
								this.app.oauth2Config,
							);
							if (!accessToken) {
								await sendNotification(
									this.read,
									this.modify,
									user,
									room,
									'Login To Github !',
								);
							} else {
								const reponse = await createNewIssue(
									this.http,
									repository,
									title,
									issueBody,
									issueLabelsArray,
									issueAssigneesArray,
									accessToken?.token,
								);
								if (reponse && reponse?.id) {
									await sendNotification(
										this.read,
										this.modify,
										user,
										room,
										`Created New Issue | [#${reponse.number} ](${reponse.html_url})  *[${reponse.title}](${reponse.html_url})*`,
									);
								} else {
									await sendNotification(
										this.read,
										this.modify,
										user,
										room,
										`Invalid Issue !`,
									);
								}
							}
						} else {
							await sendNotification(
								this.read,
								this.modify,
								user,
								room,
								`Invalid Issue !`,
							);
						}
					}
					break;
				}
				case ModalsEnum.NEW_ISSUE_STARTER_VIEW: {
					const { roomId } = await getInteractionRoomData(
						this.read.getPersistenceReader(),
						user.id,
					);

					if (roomId) {
						const room = (await this.read
							.getRoomReader()
							.getById(roomId)) as IRoom;
						let repository = view.state?.[
							ModalsEnum.REPO_NAME_INPUT
						]?.[ModalsEnum.REPO_NAME_INPUT_ACTION] as string;
						const accessToken = await getAccessTokenForUser(
							this.read,
							user,
							this.app.oauth2Config,
						);
						if (!accessToken) {
							await sendNotification(
								this.read,
								this.modify,
								user,
								room,
								`Login To Github ! -> /github login`,
							);
						} else {
							repository = repository?.trim();
							const response = await getIssueTemplates(
								this.http,
								repository,
								accessToken.token,
							);
							if (
								!response.template_not_found &&
								response?.templates?.length
							) {
								const issueTemplateSelection =
									await issueTemplateSelectionModal({
										data: response,
										modify: this.modify,
										read: this.read,
										persistence: this.persistence,
										http: this.http,
										uikitcontext: context,
									});
								return context
									.getInteractionResponder()
									.openModalViewResponse(
										issueTemplateSelection,
									);
							} else {
								const data = {
									repository: repository,
								};
								const createNewIssue = await NewIssueModal({
									data: data,
									modify: this.modify,
									read: this.read,
									persistence: this.persistence,
									http: this.http,
									uikitcontext: context,
								});
								return context
									.getInteractionResponder()
									.openModalViewResponse(createNewIssue);
							}
						}
					}
					break;
				}
				case ModalsEnum.SEARCH_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							let repository: string | undefined =
								view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[
									ModalsEnum.REPO_NAME_INPUT_ACTION
								];
							let resource: string | undefined =
								view.state?.[
									ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_INPUT
								]?.[
									ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_OPTION
								];
							const authors: string | undefined =
								view.state?.[ModalsEnum.AUTHOR_NAMES_INPUT]?.[
									ModalsEnum.AUTHOR_NAMES_INPUT_ACTION
								];
							const labels: string | undefined =
								view.state?.[
									ModalsEnum.RESOURCE_LABELS_INPUT
								]?.[ModalsEnum.RESOURCE_LABELS_INPUT_ACTION];
							const milestones: string | undefined =
								view.state?.[
									ModalsEnum.RESOURCE_MILESTONES_INPUT
								]?.[ModalsEnum.RESOURCE_LABELS_INPUT_ACTION];
							let resourceState: string | undefined =
								view.state?.[
									ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT
								]?.[
									ModalsEnum
										.ADD_SEARCH_STATE_PARAMATER_INPUT_OPTION
								];
							let labelsArray: Array<string> = [];
							let milestonesArray: Array<string> = [];
							let authorsArray: Array<string> = [];

							if (typeof authors == 'string' && authors.length) {
								authorsArray = authors.trim().split(' ');
							}
							if (typeof labels == 'string' && labels.length) {
								labelsArray = labels.trim().split(' ');
							}
							if (
								typeof milestones == 'string' &&
								milestones.length
							) {
								milestonesArray = milestones.trim().split(' ');
							}
							if (repository == undefined) {
								repository = '';
							} else {
								repository = repository?.trim();
							}
							if (resource == undefined) {
								resource = '';
							} else {
								resource = resource?.trim();
							}
							if (resourceState == undefined) {
								resourceState = '';
							} else {
								resourceState = resourceState?.trim();
							}

							const accessToken = await getAccessTokenForUser(
								this.read,
								user,
								this.app.oauth2Config,
							);
							if (
								repository?.length == 0 &&
								labelsArray?.length == 0 &&
								authorsArray?.length == 0
							) {
								await sendNotification(
									this.read,
									this.modify,
									user,
									room,
									'*Invalid Search Query !*',
								);
							} else if (!accessToken) {
								await sendNotification(
									this.read,
									this.modify,
									user,
									room,
									'Login To Github !',
								);
							} else {
								const resultResponse =
									await githubSearchIssuesPulls(
										this.http,
										repository,
										accessToken.token,
										resource,
										resourceState,
										labelsArray,
										authorsArray,
										milestonesArray,
									);
								const triggerId =
									context.getInteractionData().triggerId;
								if (
									triggerId &&
									resultResponse?.server_error === false
								) {
									const total_count =
										resultResponse?.total_count;
									const searchItems = resultResponse?.items;
									const searchResultsList: Array<IGitHubSearchResult> =
										[];
									if (
										searchItems &&
										Array.isArray(searchItems)
									) {
										for (const item of searchItems) {
											const resultId = item?.id;
											const title = item?.title;
											const number = item?.number;
											const html_url = item?.html_url;
											const user_login =
												item?.user?.login;
											const state = item?.state;
											let labelString = '';
											if (
												item?.labels &&
												Array.isArray(item.labels)
											) {
												for (const label of item.labels) {
													labelString += `${label.name} `;
												}
											}
											const resultString = `[ #${
												item.number
											} ](${item?.html_url?.toString()}) *${item.title
												?.toString()
												?.trim()}* : ${item?.html_url}`;
											const pull_request =
												item?.pull_request
													? true
													: false;
											const pull_request_url = item
												.pull_request?.url as string;
											const searchResultItem: IGitHubSearchResult =
												{
													result_id: resultId,
													title: title,
													html_url: html_url,
													number: number,
													result: resultString,
													state: state,
													share: false,
													user_login: user_login,
													labels: labelString,
													pull_request: pull_request,
													pull_request_url:
														pull_request_url,
												};
											searchResultsList.push(
												searchResultItem,
											);
										}
										const githubSearchResult: IGitHubSearchResultData =
											{
												room_id: room.id,
												user_id: user.id,
												search_query:
													resultResponse.search_query,
												total_count: total_count,
												search_results:
													searchResultsList,
											};
										const githubSearchStorage =
											new GithubSearchResultStorage(
												this.persistence,
												this.read.getPersistenceReader(),
											);
										await githubSearchStorage.updateSearchResult(
											room,
											user,
											githubSearchResult,
										);
										const resultsModal =
											await githubSearchResultModal({
												data: githubSearchResult,
												modify: this.modify,
												read: this.read,
												persistence: this.persistence,
												http: this.http,
												uikitcontext: context,
											});
										return context
											.getInteractionResponder()
											.openModalViewResponse(
												resultsModal,
											);
									}
								} else {
									const searchErrorModal =
										await githubSearchErrorModal({
											errorMessage:
												resultResponse.message,
											modify: this.modify,
											read: this.read,
											uikitcontext: context,
										});
									return context
										.getInteractionResponder()
										.openModalViewResponse(
											searchErrorModal,
										);
								}
							}
						}
					}
					break;
				}
				case ModalsEnum.SEARCH_RESULT_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const githubSearchStorage =
								new GithubSearchResultStorage(
									this.persistence,
									this.read.getPersistenceReader(),
								);
							const searchResults =
								await githubSearchStorage.getSearchResults(
									roomId,
									user,
								);
							if (searchResults) {
								const searchResultShareModal =
									await githubSearchResultShareModal({
										data: searchResults,
										modify: this.modify,
										read: this.read,
										persistence: this.persistence,
										http: this.http,
										uikitcontext: context,
									});
								return context
									.getInteractionResponder()
									.openModalViewResponse(
										searchResultShareModal,
									);
							}
						}
					}
					break;
				}
				case ModalsEnum.SEARCH_RESULT_SHARE_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							const searchResult: string | undefined =
								view.state?.[
									ModalsEnum.MULTI_SHARE_SEARCH_INPUT
								]?.[ModalsEnum.MULTI_SHARE_SEARCH_INPUT_ACTION];
							await sendMessage(
								this.modify,
								room,
								user,
								searchResult as string,
							);
						}
					}
					break;
				}
				case ModalsEnum.MERGE_PULL_REQUEST_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							const repository =
								view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[
									ModalsEnum.REPO_NAME_INPUT_ACTION
								];
							const pullNumber =
								view.state?.[
									ModalsEnum.PULL_REQUEST_NUMBER_INPUT
								]?.[
									ModalsEnum.PULL_REQUEST_NUMBER_INPUT_ACTION
								];
							const commitTitle =
								view.state?.[
									ModalsEnum.PULL_REQUEST_COMMIT_TITLE_INPUT
								]?.[
									ModalsEnum.PULL_REQUEST_COMMIT_TITLE_ACTION
								];
							const commitMessage =
								view.state?.[
									ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_INPUT
								]?.[
									ModalsEnum
										.PULL_REQUEST_COMMIT_MESSAGE_ACTION
								];
							const mergeMethod =
								view.state?.[
									ModalsEnum.PULL_REQUEST_MERGE_METHOD_INPUT
								]?.[
									ModalsEnum.PULL_REQUEST_MERGE_METHOD_OPTION
								];
							const accessToken = await getAccessTokenForUser(
								this.read,
								user,
								this.app.oauth2Config,
							);
							if (accessToken?.token) {
								const mergeResponse = await mergePullRequest(
									this.http,
									repository,
									accessToken.token,
									pullNumber,
									commitTitle,
									commitMessage,
									mergeMethod,
								);
								if (mergeResponse?.serverError) {
									const errorMessage = mergeResponse?.message;
									const unauthorizedMessageModal =
										await messageModal({
											message: `🤖 Unable to merge pull request : ⚠️ ${errorMessage}`,
											modify: this.modify,
											read: this.read,
											persistence: this.persistence,
											http: this.http,
											uikitcontext: context,
										});
									return context
										.getInteractionResponder()
										.openModalViewResponse(
											unauthorizedMessageModal,
										);
								} else {
									const url = `https://github.com/${repository}/pull/${pullNumber}`;
									const succesMessage = `🤖 ${mergeResponse?.message} ✔️ : ${url}`;
									await sendMessage(
										this.modify,
										room,
										user,
										succesMessage,
									);
								}
							}
						}
					}
					break;
				}
				case ModalsEnum.ADD_PULL_REQUEST_COMMENT_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							const repository =
								view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[
									ModalsEnum.REPO_NAME_INPUT_ACTION
								];
							const pullNumber =
								view.state?.[
									ModalsEnum.PULL_REQUEST_NUMBER_INPUT
								]?.[
									ModalsEnum.PULL_REQUEST_NUMBER_INPUT_ACTION
								];
							const newComment =
								view.state?.[
									ModalsEnum.PULL_REQUEST_COMMENT_INPUT
								]?.[
									ModalsEnum.PULL_REQUEST_COMMENT_INPUT_ACTION
								];
							const accessToken = await getAccessTokenForUser(
								this.read,
								user,
								this.app.oauth2Config,
							);
							if (
								accessToken?.token &&
								repository?.length &&
								newComment?.length &&
								pullNumber?.length
							) {
								const addCommentResponse =
									await addNewPullRequestComment(
										this.http,
										repository,
										accessToken.token,
										pullNumber,
										newComment,
									);
								if (addCommentResponse?.serverError) {
									const errorMessage =
										addCommentResponse?.message;
									const unauthorizedMessageModal =
										await messageModal({
											message: `🤖 Unable to add comment : ⚠️ ${errorMessage}`,
											modify: this.modify,
											read: this.read,
											persistence: this.persistence,
											http: this.http,
											uikitcontext: context,
										});
									return context
										.getInteractionResponder()
										.openModalViewResponse(
											unauthorizedMessageModal,
										);
								} else {
									const pullRequestComments =
										await getPullRequestComments(
											this.http,
											repository,
											accessToken.token,
											pullNumber,
										);
									const pullRequestData =
										await getPullRequestData(
											this.http,
											repository,
											accessToken.token,
											pullNumber,
										);
									if (
										pullRequestData?.serverError ||
										pullRequestComments?.pullRequestData
									) {
										if (pullRequestData?.serverError) {
											const unauthorizedMessageModal =
												await messageModal({
													message: `🤖 Error Fetching Repository Data: ⚠️ ${pullRequestData?.message}`,
													modify: this.modify,
													read: this.read,
													persistence:
														this.persistence,
													http: this.http,
													uikitcontext: context,
												});
											return context
												.getInteractionResponder()
												.openModalViewResponse(
													unauthorizedMessageModal,
												);
										}
										if (pullRequestComments?.serverError) {
											const unauthorizedMessageModal =
												await messageModal({
													message: `🤖 Error Fetching Comments: ⚠️ ${pullRequestData?.message}`,
													modify: this.modify,
													read: this.read,
													persistence:
														this.persistence,
													http: this.http,
													uikitcontext: context,
												});
											return context
												.getInteractionResponder()
												.openModalViewResponse(
													unauthorizedMessageModal,
												);
										}
									}
									const data = {
										repo: repository,
										pullNumber: pullNumber,
										pullData: pullRequestData,
										pullRequestComments:
											pullRequestComments?.data,
									};
									const addPRCommentModal =
										await pullRequestCommentsModal({
											data: data,
											modify: this.modify,
											read: this.read,
											persistence: this.persistence,
											http: this.http,
											uikitcontext: context,
										});
									await sendNotification(
										this.read,
										this.modify,
										user,
										room,
										`New Comment posted to ${repository} pull request #${pullNumber} by ${addCommentResponse?.user?.login} : ${addCommentResponse?.html_url}`,
									);
									await this.modify
										.getUiController()
										.updateModalView(
											addPRCommentModal,
											{
												triggerId:
													context.getInteractionData()
														.triggerId,
											},
											context.getInteractionData().user,
										);
								}
							}
						}
						return context
							.getInteractionResponder()
							.successResponse();
					}
					break;
				}
				case ModalsEnum.ADD_ISSUE_COMMENT_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							const repository =
								view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[
									ModalsEnum.REPO_NAME_INPUT_ACTION
								];
							const issueNumber =
								view.state?.[ModalsEnum.ISSUE_NUMBER_INPUT]?.[
									ModalsEnum.ISSUE_NUMBER_INPUT_ACTION
								];
							const newComment =
								view.state?.[ModalsEnum.ISSUE_COMMENT_INPUT]?.[
									ModalsEnum.ISSUE_COMMENT_INPUT_ACTION
								];
							const accessToken = await getAccessTokenForUser(
								this.read,
								user,
								this.app.oauth2Config,
							);
							if (
								accessToken?.token &&
								repository?.length &&
								newComment?.length &&
								issueNumber?.length
							) {
								const addCommentResponse =
									await addNewIssueComment(
										this.http,
										repository,
										accessToken.token,
										issueNumber,
										newComment,
									);
								if (addCommentResponse?.serverError) {
									const errorMessage =
										addCommentResponse?.message;
									const unauthorizedMessageModal =
										await messageModal({
											message: `🤖 Unable to add comment : ⚠️ ${errorMessage}`,
											modify: this.modify,
											read: this.read,
											persistence: this.persistence,
											http: this.http,
											uikitcontext: context,
										});
									return context
										.getInteractionResponder()
										.openModalViewResponse(
											unauthorizedMessageModal,
										);
								} else {
									const issueComments =
										await getIssuesComments(
											this.http,
											repository,
											accessToken?.token,
											issueNumber,
										);
									const issueData = await getIssueData(
										repository,
										issueNumber,
										accessToken.token,
										this.http,
									);
									if (
										issueData?.issue_compact ===
											'Error Fetching Issue' ||
										issueComments?.issueData
									) {
										if (
											issueData?.issue_compact ===
											'Error Fetching Issue'
										) {
											const unauthorizedMessageModal =
												await messageModal({
													message: `🤖 Error Fetching Issue Data ⚠️`,
													modify: this.modify,
													read: this.read,
													persistence:
														this.persistence,
													http: this.http,
													uikitcontext: context,
												});
											return context
												.getInteractionResponder()
												.openModalViewResponse(
													unauthorizedMessageModal,
												);
										}
										if (issueComments?.serverError) {
											const unauthorizedMessageModal =
												await messageModal({
													message: `🤖 Error Fetching Comments ⚠️`,
													modify: this.modify,
													read: this.read,
													persistence:
														this.persistence,
													http: this.http,
													uikitcontext: context,
												});
											return context
												.getInteractionResponder()
												.openModalViewResponse(
													unauthorizedMessageModal,
												);
										}
									}
									const data = {
										repo: repository,
										issueNumber: issueNumber,
										issueData: issueData,
										issueComments: issueComments?.data,
									};
									const addIssueCommentModal =
										await issueCommentsModal({
											data: data,
											modify: this.modify,
											read: this.read,
											persistence: this.persistence,
											http: this.http,
											uikitcontext: context,
										});
									await sendNotification(
										this.read,
										this.modify,
										user,
										room,
										`New Comment posted to ${repository} issue #${issueNumber} by ${addCommentResponse?.user?.login} : ${addCommentResponse?.html_url}`,
									);
									await this.modify
										.getUiController()
										.updateModalView(
											addIssueCommentModal,
											{
												triggerId:
													context.getInteractionData()
														.triggerId,
											},
											context.getInteractionData().user,
										);
								}
							}
						}
						return context
							.getInteractionResponder()
							.successResponse();
					}
					break;
				}
				case ModalsEnum.GITHUB_ISSUES_STARTER_VIEW: {
					const { roomId } = await getInteractionRoomData(
						this.read.getPersistenceReader(),
						user.id,
					);
					if (roomId) {
						let repository = view.state?.[
							ModalsEnum.REPO_NAME_INPUT
						]?.[ModalsEnum.REPO_NAME_INPUT_ACTION] as string;
						repository = repository?.trim();
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						let response, data: any;
						let pushRights = false;
						const accessToken = await getAccessTokenForUser(
							this.read,
							user,
							this.app.oauth2Config,
						);
						if (!accessToken) {
							response = await getRepositoryIssues(
								this.http,
								repository,
							);
						} else {
							const repoDetails = await getRepoData(
								this.http,
								repository,
								accessToken.token,
							);
							response = await getRepositoryIssues(
								this.http,
								repository,
							);
							pushRights =
								repoDetails?.permissions?.push ||
								repoDetails?.permissions?.admin;
						}
						if (response.serverError) {
							const errorMessage = response?.message;
							const unauthorizedMessageModal = await messageModal(
								{
									message: `🤖 Error Fetching GitHub Issues : ⚠️ ${errorMessage}`,
									modify: this.modify,
									read: this.read,
									persistence: this.persistence,
									http: this.http,
									uikitcontext: context,
								},
							);
							return context
								.getInteractionResponder()
								.openModalViewResponse(
									unauthorizedMessageModal,
								);
						} else {
							const issueList: Array<IGitHubIssue> = [];
							for (const issue of response.issues) {
								if (issue.pull_request) {
									continue;
								}
								const issue_id = issue.id;
								const labels: Array<string> = [];
								const assignees: Array<string> = [];
								if (
									issue?.labels &&
									Array.isArray(issue.labels)
								) {
									for (const label of issue.labels) {
										labels.push(`${label.name}`);
									}
								}
								if (
									issue?.assignees &&
									Array.isArray(issue.assignees)
								) {
									for (const assignee of issue.assignees) {
										assignees.push(assignee.login);
									}
								}
								const title: string = issue.title;
								const user_login: string = issue.user.login;
								const number: string | number = issue.number;
								const state: string = issue.state;
								const html_url: string = issue.html_url;
								const issue_compact = `[ #${
									issue.number
								} ](${issue?.html_url?.toString()}) *${issue.title
									?.toString()
									?.trim()}* : ${issue?.html_url}`;
								const githubIssue: IGitHubIssue = {
									issue_id,
									labels,
									assignees,
									html_url,
									number,
									state,
									user_login,
									title,
									issue_compact,
									share: false,
								};
								issueList.push(githubIssue);
							}
							const githubIssueStorage =
								new GithubRepoIssuesStorage(
									this.persistence,
									this.read.getPersistenceReader(),
								);
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							const githubIssueData: IGitHubIssueData = {
								repository: repository,
								room_id: roomId,
								user_id: user.id,
								issue_list: issueList,
								push_rights: pushRights,
							};
							await githubIssueStorage.updateIssueData(
								room,
								user,
								githubIssueData,
							);

							data = {
								issues: issueList,
								pushRights: pushRights, //no access token, so user has no pushRights to the repo,
								repo: repository,
								user_id: user.id,
							};
							const issuesListModal = await githubIssuesListModal(
								{
									data: data,
									modify: this.modify,
									read: this.read,
									persistence: this.persistence,
									http: this.http,
									uikitcontext: context,
								},
							);
							return context
								.getInteractionResponder()
								.openModalViewResponse(issuesListModal);
						}
					}
					break;
				}
				case ModalsEnum.ADD_ISSUE_ASSIGNEE_VIEW: {
					const { roomId } = await getInteractionRoomData(
						this.read.getPersistenceReader(),
						user.id,
					);
					if (roomId) {
						let repository = view.state?.[
							ModalsEnum.REPO_NAME_INPUT
						]?.[ModalsEnum.REPO_NAME_INPUT_ACTION] as string;
						let issueNumber = view.state?.[
							ModalsEnum.ISSUE_NUMBER_INPUT
						]?.[ModalsEnum.ISSUE_NUMBER_INPUT_ACTION] as string;
						let issueAssignees = view.state?.[
							ModalsEnum.ISSUE_ASSIGNEE_INPUT
						]?.[ModalsEnum.ISSUE_ASSIGNEE_INPUT_ACTION] as string;
						repository = repository?.trim();
						issueNumber = issueNumber?.trim();
						issueAssignees = issueAssignees?.trim();
						const accessToken = await getAccessTokenForUser(
							this.read,
							user,
							this.app.oauth2Config,
						);
						if (accessToken?.token && issueNumber && repository) {
							let assigneesArray: Array<string> = [];
							if (issueAssignees) {
								assigneesArray = issueAssignees.split(' ');
							}
							const response = await updateGithubIssues(
								this.http,
								repository,
								assigneesArray,
								issueNumber,
								accessToken.token,
							);
							if (response.serverError) {
								const errorMessage = response?.message;
								const unauthorizedMessageModal =
									await messageModal({
										message: `🤖 Unable to assign issues : ⚠️ ${errorMessage}`,
										modify: this.modify,
										read: this.read,
										persistence: this.persistence,
										http: this.http,
										uikitcontext: context,
									});
								return context
									.getInteractionResponder()
									.openModalViewResponse(
										unauthorizedMessageModal,
									);
							} else {
								const githubissueStorage =
									new GithubRepoIssuesStorage(
										this.persistence,
										this.read.getPersistenceReader(),
									);
								const repoIssuesData: IGitHubIssueData =
									await githubissueStorage.getIssueData(
										roomId as string,
										user,
									);
								if (repoIssuesData?.issue_list?.length) {
									let index = -1;
									let currentIndex = 0;
									for (const issue of repoIssuesData.issue_list) {
										if (issue.number == issueNumber) {
											index = currentIndex;
											break;
										}
										currentIndex++;
									}
									if (index !== -1) {
										repoIssuesData.issue_list[
											index
										].assignees = assigneesArray;
										const room = (await this.read
											.getRoomReader()
											.getById(roomId)) as IRoom;
										await githubissueStorage.updateIssueData(
											room as IRoom,
											user,
											repoIssuesData,
										);
									}
									const data = {
										issues: repoIssuesData.issue_list,
										pushRights: repoIssuesData.push_rights, //no access token, so user has no pushRights to the repo,
										repo: repoIssuesData.repository,
										user_id: user.id,
									};
									const githubIssuesModal =
										await githubIssuesListModal({
											data: data,
											modify: this.modify,
											read: this.read,
											persistence: this.persistence,
											http: this.http,
										});
									const room = (await this.read
										.getRoomReader()
										.getById(roomId)) as IRoom;
									await sendNotification(
										this.read,
										this.modify,
										user,
										room,
										'🤖 Assigned Issue Successfully ✔️',
									);
									await this.modify
										.getUiController()
										.updateModalView(
											githubIssuesModal,
											{
												triggerId:
													context.getInteractionData()
														.triggerId,
											},
											context.getInteractionData().user,
										);
									return context
										.getInteractionResponder()
										.successResponse();
								}
							}
						}
					}
					break;
				}
				case ModalsEnum.ISSUE_LIST_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const githubIssueStorage =
								new GithubRepoIssuesStorage(
									this.persistence,
									this.read.getPersistenceReader(),
								);
							const issueData =
								(await githubIssueStorage.getIssueData(
									roomId,
									user,
								)) as IGitHubIssueData;
							if (issueData) {
								const issueShareModal =
									await githubIssuesShareModal({
										data: issueData,
										modify: this.modify,
										read: this.read,
										persistence: this.persistence,
										http: this.http,
										uikitcontext: context,
									});
								return context
									.getInteractionResponder()
									.openModalViewResponse(issueShareModal);
							}
						}
					}
					break;
				}
				case ModalsEnum.GITHUB_ISSUES_SHARE_VIEW: {
					if (user.id) {
						const { roomId } = await getInteractionRoomData(
							this.read.getPersistenceReader(),
							user.id,
						);
						if (roomId) {
							const room = (await this.read
								.getRoomReader()
								.getById(roomId)) as IRoom;
							const searchResult: string | undefined =
								view.state?.[
									ModalsEnum.MULTI_SHARE_GITHUB_ISSUES_INPUT
								]?.[
									ModalsEnum
										.MULTI_SHARE_GITHUB_ISSUES_INPUT_ACTION
								];
							await sendMessage(
								this.modify,
								room,
								user,
								searchResult as string,
							);
						}
					}
					break;
				}

				default:
					break;
			}
		} catch (error) {
			console.log('error : ', error);
		}

		return {
			success: true,
		};
	}
}
