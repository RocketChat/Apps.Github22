import { IGitHubIssue } from "./githubIssue"
import { IGithubComment } from "./IGithubComment";
import { IGitHubPullRequest } from "./IGithubPullRequest";

export interface IGithubActivity {
    type: "IssuesEvent" | "PullRequestEvent" | "IssueCommentEvent";
    actor: {
        display_login: string;
        avatar_url: string;
        url: string;
    };
    repo: {
        name: string;
        url: string;
    };
    payload: {
        action: string;
        comment?: IGithubComment
        issue?: IGitHubIssue
        pull_request?: IGitHubPullRequest
    };
    created_at: string;
}
