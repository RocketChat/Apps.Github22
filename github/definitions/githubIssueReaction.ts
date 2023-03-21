// reactions results for issue (without s)
export interface IGithubIssueReaction {
    reaction_id?: string;
    repo_name: string;
    user_id: string;
    reaction: string;
    issue_number: string;
}
