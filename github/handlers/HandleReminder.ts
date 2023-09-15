import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getDirect, sendDirectMessage, sendNotification } from "../lib/message";
import { IRead, IModify, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubApp } from "../GithubApp";
import { NewIUser, getAllUsers } from "../persistance/remind";
import { getBasicUserInfo,  } from "../helpers/githubSDK";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

interface PRDetail{
   title: string; number:string; url: string; id: string; createdAt: Date; author: { avatar: string; username: string; }; 
}

export async function Reminder(jobData: any,read: IRead,modify: IModify,http: IHttp,persis: IPersistence,app:GithubApp){
                    
    // const user:IUser= await read.getUserReader().getByUsername('vipin.chaudhary')
    
    const appUser = await read.getUserReader().getAppUser() as IUser;

    // const targetRoom = await getDirect(read, modify, appUser, user.username) as IRoom;
    const block = modify.getCreator().getBlockBuilder()

    // const access_token = await getAccessTokenForUser(read,user,app.oauth2Config);


    block.addSectionBlock({
        text:block.newPlainTextObject(
            `Testing 🔔 Don't let those pull requests get forgotten! You've got waiting for your review. Let's get to work 💻`
        )
    })

    // const msg = modify.getCreator().startMessage().setSender(appUser).setRoom(targetRoom).setText('Reminder ').setBlocks(block);

    // await modify.getCreator().finish(msg);

    // blocks.addActionsBlock({
    //     blockId:"reminder",
    //     elements:[
    //         blocks.newButtonElement({
    //             actionId:"this is action",
    //             text:blocks.newPlainTextObject('Review'),
    //             value:"repo",
    //             style:ButtonStyle.PRIMARY
    //         })
    //     ]
    // })

    // sendDirectMessage(read,modify,user,'test',persis,block)

   const users:NewIUser[] = await getAllUsers(read);

   async function processUsers(users: NewIUser[], read: IRead, app: GithubApp) {
    await Promise.all(users.map(async (user) => {
      try {
        let User = await read.getUserReader().getById(user.userid);
        let accessToken  = await getAccessTokenForUser(read, User, app.oauth2Config);
        let githubusername = '';
  
        if (accessToken) {
          // Assuming getBasicUserInfo returns a Promise
          const basicUserInfo = await getBasicUserInfo(http, accessToken?.token);
          githubusername = basicUserInfo.username;
        }
  
        console.log(`User: ${user.username}, Access Token: ${accessToken}, GitHub Username: ${githubusername}`);
  
        // Fetch repositories in parallel
        await Promise.all(user.repos.map(async (repo) => {
          console.log(repo);
  
        let pullRequestsWaitingForReview: PRDetail[] =[];

          let gitResponse:any;

          if(accessToken?.token){
            gitResponse = await http.get(`https://api.github.com/repos/${repo}/pulls`, {
              headers: {
                  Authorization: `token ${accessToken?.token}`,
                  "Content-Type": "application/json",
              },
          });
      } else {
          gitResponse = await http.get(
              `https://api.github.com/repos/${repo}/pulls`
          );
          }

          let resData:any[] = gitResponse.data;

          resData.forEach((pr)=>{
            // console.log('---pr detail ',pr.url,pr.requested_reviewers)requested_reviewers
            // console.log(pr)

            // console.log(pr.requested_reviewers.login)
            const reviewers = pr.requested_reviewers;

            reviewers.forEach(reviewer=>{
              if(reviewer.login === githubusername){
                pullRequestsWaitingForReview.push({
                  title: pr.title,
                  number:pr.number,
                  url: pr.html_url,
                  id: pr.id,
                  createdAt: pr.created_at,
                  author: {
                    avatar: pr.user.avatar_url,
                    username: pr.user.login
                  }
                })
              }
            })
          }
          )
    
          console.log('pr details',pullRequestsWaitingForReview);


          await NotifyUser(pullRequestsWaitingForReview,modify,read,User,User.username)

        }
        )
        
        );
  
      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
      }
    }));
  }
  
  
  // Call the function with your array of users
  processUsers(users, read, app);
  

    console.log(`---[${ Date() }] this is a task for test ---------------------------`, )
}


async function NotifyUser (PullRequests:PRDetail[],modify:IModify,read:IRead,User:IUser,username:string){

  const Pulls = PullRequests.length;
  const appUser = await read.getUserReader().getAppUser() as IUser;
  const room = await getDirect(read,modify,appUser,username)

    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`🚀 It's time to move those pull requests forward! *You've got ${Pulls}* waiting for your review. Give them the green light 💚`)

    if (room) {
        textSender.setRoom(room);
    }

    await modify.getCreator().finish(textSender);

    PullRequests.forEach(async (pull, ind) => {
        if (ind < 10) {
            const url = pull.url;
            const textSender = await modify
                .getCreator()
                .startMessage()
                .setText(`[ #${pull.number} ](${url})  *${pull.title}*`);

            if (room) {
                textSender.setRoom(room);
            }
            await modify.getCreator().finish(textSender);
        }
    });

}