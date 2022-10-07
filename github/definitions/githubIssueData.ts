import { IGitHubIssue } from "./githubIssue"

//search results for a user 
export interface IGitHubIssueData{
    user_id: string ,
    room_id: string,
    repository: string,
    push_rights: boolean,
    issue_list: Array<IGitHubIssue> 
}