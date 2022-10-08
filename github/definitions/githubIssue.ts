//inidividual issue
export interface IGitHubIssue{
    issue_id: string|number,
    title?: string,
    html_url?: string, 
    number?: string|number
    labels?: Array<string>,
    user_login?:string,
    state?: string,
    share?: boolean,//true if seacrh result is to be shareed
    assignees?: Array<string>,//user ids seperated by " "
    issue_compact: string,//compact string to share issues in rooms
}