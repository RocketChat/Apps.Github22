import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getDirect, sendDirectMessage, sendNotification } from "../lib/message";
import { IRead, IModify, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubApp } from "../GithubApp";
import { getAllReminders } from "../persistance/remind";
import { getBasicUserInfo, } from "../helpers/githubSDK";
import { IPRdetail } from "../definitions/PRdetails";
import { IReminder } from "../definitions/Reminder";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function Reminder(jobData: any, read: IRead, modify: IModify, http: IHttp, persis: IPersistence, app: GithubApp) {

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
          await sendNotification(read,modify,User,room,"Login to Get Notified about Pull Request Pending Review! `/github login`",)
          return;
        }

        await Promise.all(user.repos.map(async (repo) => {

          let pullRequestsWaitingForReview: IPRdetail[] = [];

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

          resData.forEach((pr) => {

            const reviewers = pr.requested_reviewers;

            reviewers.forEach(reviewer => {
              if (reviewer.login === githubusername) {
                pullRequestsWaitingForReview.push({
                  title: pr.title,
                  number: pr.number,
                  url: pr.html_url,
                  id: pr.id,
                  createdAt: pr.created_at,
                  author: {
                    avatar: pr.user.avatar_url,
                    username: pr.user.login
                  },
                  repo: pr.base.repo.full_name
                })
              }
            })
          }
          )
          await NotifyUser(pullRequestsWaitingForReview, modify, read, User, User.username)
        }
        )
        );

      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
      }
    }));
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
  const room = await getDirect(read, modify, appUser, username)

  const textSender = await modify
    .getCreator()
    .startMessage()
    .setText(`🚀 It's time to move those pull requests forward! *You've got ${Pulls}* waiting for your review. Give them the green light 💚`)

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