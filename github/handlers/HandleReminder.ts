import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sendDirectMessage } from "../lib/message";
import { IRead, IModify, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubApp } from "../GithubApp";

export async function Reminder(jobData: any,read: IRead,modify: IModify,http: IHttp,persis: IPersistence,app:GithubApp){
                    
    const user:IUser= await read.getUserReader().getByUsername('vipin.chaudhary')
    const appUser = await read.getUserReader().getAppUser() as IUser;

    // const targetRoom = await getDirect(read, modify, appUser, user.username) as IRoom;
    const block = modify.getCreator().getBlockBuilder()

    const access_token = await getAccessTokenForUser(read,user,app.oauth2Config);


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

    sendDirectMessage(read,modify,user,'test',persis,block)

    
    console.log(`---[${ Date() }] this is a task`, access_token)
}