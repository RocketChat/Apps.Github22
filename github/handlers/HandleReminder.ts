import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getDirect, sendNotification } from "../lib/message";
import { IRead, IModify, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubApp } from "../GithubApp";
import { getAllReminders } from "../persistance/remind";
import { getBasicUserInfo } from "../helpers/githubSDK";
import { IPRdetail } from "../definitions/PRdetails";
import { IReminder } from "../definitions/Reminder";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function SendReminder(jobData: any, read: IRead, modify: IModify, http: IHttp, persis: IPersistence, app: GithubApp) {
  const reminders: IReminder[] = await getAllReminders(read);

  async function processReminder(reminders: IReminder[], read: IRead, app: GithubApp) {
    await Promise.all(reminders.map(async (user) => {
      try {
        let User = await read.getUserReader().getById(user.userid);
        let accessToken = await getAccessTokenForUser(read, User, app.oauth2Config);
        let githubusername = '';

        const appUser = await read.getUserReader().getAppUser() as IUser;
        const room = await getDirect(read, modify, appUser, User.username) as IRoom;

        if (accessToken) {
          const basicUserInfo = await getBasicUserInfo(http, accessToken?.token);
          githubusername = basicUserInfo.username;
        } else {
          await sendNotification(read, modify, User, room, "Login to Get Notified about Pull Request Pending Review! `/github login`");
          return;
        }

        let pullRequestsWaitingForReview: IPRdetail[] = [];
        await Promise.all(user.repos.map(async (repo) => {
          let getResponse: any;

          if (accessToken?.token) {
            getResponse = await http.get(`https://api.github.com/repos/${repo}/pulls`, {
              headers: {
                Authorization: `token ${accessToken?.token}`,
                "Content-Type": "application/json",
              },
            });
          }

          let resData: any[] = getResponse.data;

          const prPromises = resData.map(async (pr) => {
            const IsUserinTeam: boolean = await CheckIsUserInTeam(githubusername, accessToken?.token, http, pr);
            const IsUserReviewRequested: boolean = await CheckIsReviewRequested(githubusername, pr);

            if (IsUserinTeam || IsUserReviewRequested) {
              pullRequestsWaitingForReview.push({
                title: pr.title,
                number: pr.number,
                url: pr.html_url,
                id: pr.id,
                createdAt: pr.created_at,
                author: {
                  avatar: pr.user.avatar_url,
                  username: pr.user.login,
                },
                repo: pr.base.repo.full_name,
              });
            }
          });
          await Promise.all(prPromises);

        }

        ));
        await NotifyUser(pullRequestsWaitingForReview, modify, read, User, User.username);
        pullRequestsWaitingForReview = [];

      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
      }
    }

    ));
  }
  processReminder(reminders, read, app);
}

async function NotifyUser(pullRequestsWaitingForReview: IPRdetail[], modify: IModify, read: IRead, User: IUser, username: string) {
  const currentDate = new Date();
  for (const key in pullRequestsWaitingForReview) {
    if (pullRequestsWaitingForReview.hasOwnProperty(key)) {
      const pr = pullRequestsWaitingForReview[key];
      const createdAtDate = new Date(pr.createdAt);
      const timeDifference = currentDate.getTime() - createdAtDate.getTime();
      const daysOld = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      pr.ageInDays = daysOld;
    }
  }

  pullRequestsWaitingForReview.sort((a, b) => (a.ageInDays || 0) - (b.ageInDays || 0));

  const Pulls = pullRequestsWaitingForReview.length;
  const appUser = await read.getUserReader().getAppUser() as IUser;
  const room = await getDirect(read, modify, appUser, username);

  const textSender = await modify
    .getCreator()
    .startMessage();

  if (Pulls > 0) {
    textSender.setText(`🚀 You've got ${Pulls} pull requests waiting for your review. Give them the green light 💚`);
  } else {
    textSender.setText(`📅 It appears that there are no pull requests for you to review today. Enjoy your PR-free day! 🚀`);
  }

  if (room) {
    textSender.setRoom(room);
  }

  await modify.getCreator().finish(textSender);

  const modifyCreator = modify.getCreator();

  for (const [ind, pull] of pullRequestsWaitingForReview.entries()) {

    let markdownText = `${pull.repo} #${pull.number}\n`;

    if (pull.ageInDays) {
      if (pull.ageInDays > 0) {
        markdownText += `*${pull.ageInDays} days old*\n`;
      }
    }
    markdownText += `**[${pull.title}](${pull.url})**`;

    if (ind < 10) {
      const textSender = await modifyCreator.startMessage().setText(markdownText);
      if (room) {
        textSender.setRoom(room);
      }
      await modifyCreator.finish(textSender);
    }
  }
}

async function CheckIsReviewRequested(githubusername: string, pr: any): Promise<boolean> {
  const reviewers = pr.requested_reviewers;

  for (const reviewer of reviewers) {
    if (reviewer.login === githubusername) {
      return true;
    }
  }
  return false;
}

async function CheckIsUserInTeam(githubusername: string, access_token: string | undefined, http: IHttp, pr: any): Promise<boolean> {
  if (pr.requested_teams.length === 0) {
    return false;
  }

  const teams = pr.requested_teams;

  for (const team of teams) {
    const response = await http.get(`https://api.github.com/teams/${team.id}/members/${githubusername}`, {
      headers: {
        Authorization: `token ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.statusCode.toString().startsWith("2")) {
      return false;
    }

    if (response.statusCode === 204) {
      return true;
    }
  }

  return false;
}
