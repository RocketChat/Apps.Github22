export enum commandsEnum {
    OpenHomeModal = 1,
    SeeInteractiveButton = 2,
    GetRepositoryDetails = 3,
    GetRepositoryIssues = 4,
    GetContributors = 5,
    GetRecentPullRequest = 6,
    ReviewPullRequest = 7,
    LoginToGitHub = 8,
    LogoutFromGitHub = 9,
    ViewProfileAndIssues = 10,
    ManageSubscriptions = 11,
    SubscribeAllEvents = 12,
    UnsubscribeAllEvents = 13,
    AddNewIssues = 14,
    SearchIssuesAndPullRequests = 15,
    AssignAndShareIssues = 16,
    AddReminder = 17,
    ListReminders = 18
}

export interface ICommandUsage {
    commandNumber: number;
    count: number;
}