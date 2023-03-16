import { IGithubActivity } from "../definitions/IGithubActivity";

export function parseUserActivity(event: any): IGithubActivity {
    let payload: any = {};
    if (event.type === "IssuesEvent") {
      payload = {
        action: event.payload.action,
        issue: {
          issue_id: event.payload.issue.id,
          title: event.payload.issue.title,
          html_url: event.payload.issue.html_url,
          number: event.payload.issue.number,
          labels: event.payload.issue.labels.map((label: any) => label.name),
          user_login: event.payload.issue.user.login,
          user_avatar: event.payload.issue.user.avatar_url,
          last_updated_at: event.payload.issue.updated_at,
          comments: event.payload.issue.comments,
          state: event.payload.issue.state,
          assignees: event.payload.issue.assignees.map(
            (assignee: any) => assignee.login
          ),
          repo_url: event.repo.url,
          body: event.payload.issue.body,
        },
      };
    } else if (event.type === "PullRequestEvent") {
      payload = {
        action: event.payload.action,
        pull_request: {
          id: event.payload.pull_request.id,
          title: event.payload.pull_request.title,
          html_url: event.payload.pull_request.html_url,
          number: event.payload.pull_request.number,
          labels: event.payload.pull_request.labels.map(
            (label: any) => label.name
          ),
          user_login: event.payload.pull_request.user.login,
          user_avatar: event.payload.pull_request.user.avatar_url,
          last_updated_at: event.payload.pull_request.updated_at,
          comments: event.payload.pull_request.comments,
          state: event.payload.pull_request.state,
          assignees: event.payload.pull_request.assignees.map(
            (assignee: any) => assignee.login
          ),
          body: event.payload.pull_request.body,
        },
      };
    } else if (event.type === "IssueCommentEvent") {
      payload = {
        action: event.payload.action,
        comment: {
          body: event.payload.comment.body,
          url: event.payload.comment.html_url,
          lastUpdatedAt: event.payload.comment.updated_at,
        },
      };
    }

    const userActivity: IGithubActivity = {
      type: event.type,
      actor: {
        display_login: event.actor.display_login,
        avatar_url: event.actor.avatar_url,
        url: event.actor.url,
      },
      repo: {
        name: event.repo.name,
        url: event.repo.url,
      },
      payload: payload,
      created_at: event.created_at,
    };

    return userActivity;
}
