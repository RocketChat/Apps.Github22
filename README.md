<h1 align='center'>GitHub Integration for Rocket.Chat</h1>


![Banner (1)](https://user-images.githubusercontent.com/70485812/180324457-f8deba5d-fade-4d3d-a128-15da13c079a6.png)



![Untitled (70 × 36in) (70 × 20in) (1)](https://user-images.githubusercontent.com/70485812/180324271-9f30095c-3d49-42d3-ac66-0ad7db4938af.png)

 
The GitHub Rocket.Chat App provides a seamless integration between GitHub and Rocket.Chat and improves collaboration between developers. The application allows users to search and share Issues and Pull Request, Subscribe to Repository Events, create New Issues, Review and Merge Pull Requests and do much more right from Rocket.Chat. 


<h2 align='center'>🚀 Features 🚀</h2>
<ul>
  <li>Quick and Easy Setup</li> 
  <li>Login to GitHub with one click using built-in OAth2 mechanism</li>
  <li>Subscribe to Repository Events and get notified about new issues, pull requests, code pushes etc</li>
  <li>Review and Merge Pull Requests right from Rocket.Chat Channels</li>
  <li>Create new Issues from Rocket.Chat</li>
  <li>Search Issues and Pull Request using extensive filters and share them on Rocket.Chat</li>
</ul>

<h2 align='center'>💡 Usage 💡</h2>
<ul>
    <li> See Helper Message / Command List -> /github help </li>
    <li> The app can be accessed with any of the slash commands /gh or /github </li>
    <li> Login to GitHub -> /github login </li>
    <li> Logout from GitHub -> /github logout </li>
    <li> View your GitHub Profile and Issues -> /github me </li>
    <li> View/Add/Delete/Update Repository Subscriptions -> /github subscribe </li>
    <li> Subscribe to all repository events -> /github Username/RepositoryName subscribe </li>
    <li> Unsubscribe to all repository events -> /github Username/RepositoryName unsubscribe </li>
    <li> Add New Issues to GitHub Repository -> /github issue </li>
    <li> Search Issues and Pull Request -> /github search </li>
    <li> Assign and Share GitHub issues -> /github issues </li>
    <li> Review a Pull Request -> /github  Username/RepositoryName pulls pullNumber </li>
    <li> See Interactive Button interface to fetch repository data -> /github Username/RepositoryName </li>
    <li> Get details of a Repository -> /github  Username/RepositoryName repo </li>
    <li> Get Issues of a Repository -> /github  Username/RepositoryName issues </li>
    <li> Get Contributors of a Repository -> /github  Username/RepositoryName contributors </li>
    <li> Get Recent Pull Request of a Repository -> /github  Username/RepositoryName pulls </li>
</ul>

<h2 align='center'>🚀 Contributing 🚀</h2>

<div align='center' width='100%'>
<a href="https://www.middlewarehq.com/">
<img src="https://open-source-assets.middlewarehq.com/svgs/RocketChat-Apps.Github22-contributor-metrics-dark-widget.svg?caching=false"></img>
</a>
</div>

<ul>
  <li>Set up the Application on your server using our <a href="#desktop_computer-quick-setup-desktop_computer">Quick Setup</a> and <a href="#desktop_computer-application-setup-desktop_computer">Application Setup</a>.</li>
 <li>Explore the app and look for existing issues to solve. We look forward to new PRs :100:.</li>
 <li>If you find a bug or a missing feature, feel free to open a new Issue.</li>
 <li>If you are new to Rocket.Chat App Development, follow the <a href="https://developer.rocket.chat/apps-engine/rocket.chat-app">developement documentation</a> and <a href="https://rocketchat.github.io/Rocket.Chat.Apps-engine/">RocketChat Apps Engine TypeScript Defenitions</a></li>
  <li>You can also follow other Rocket.Chat Apps for inspiration : <a href="https://github.com/Poll-Plus/rocket.chat.app-poll">Polls Plus App</a>, <a href="https://github.com/RocketChat/Apps.ClickUp">ClickUp Rocket.Chat App</a> , <a href="https://github.com/RocketChat/Apps.Figma">Figma Rocket.Chat App</a>
</ul>



<h2 align='center' id="quick-setup">:desktop_computer: Quick Setup :desktop_computer:</h2>

<h2 align='center'> Gitpod 🍊 </h2>

Start developing and make changes to your code via a single click **Anytime-Anywhere**!

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/RocketChat/Apps.Github22)

Using [Thrust](https://github.com/henit-chobisa/Thrust.RC) for quickly setup your Rocket.Chat workspace & hot-reload for develping and deploying Github App, no need to worry about setting up any Rocket.Chat server before hand.

<h2 align='center'> Manual Setup 🐳 </h2>

<ol>
  <li>Rocket.Chat Apps Run on a Rocket.Chat server. If you dont have a server setup, please go through this <a href="https://developer.rocket.chat/rocket.chat/rocket-chat-environment-setup">setup</a> and setup a development environment and setup you server</li> 
  <li>To start with development on Rocket.Chat Apps, you need to install the Rocket.Chat Apps Engline CLI. Enter the following commands : </li>
  
  ``` 
    npm install -g @rocket.chat/apps-cli
  ```
  
  Check if the CLI has been installed 
  
  ```
  rc-apps -v
# @rocket.chat/apps-cli/1.4.0 darwin-x64 node-v10.15.3
  ```
  
  <li>Clone the GitHub Repository</li>
    
 ```
    git clone https://github.com/RocketChat/Apps.Github22
 ```
  
  <li>Enter the App.Github22 directory and install dependecies</li>
  
  ```
    cd Apps.Github22
    cd github
    npm install
  ```
  
  <li>In order to install Rocket.Chat Apps on your development server, the server must be in development mode. Enable Apps development mode by navigating to <i>Administration > General > Apps</i> and click on the True radio button over the Enable development mode..</li>
  
  <li>Build and Upload your application by running the following inside the apps directory (/App.Github22/github) </li>
  
  ```
  rc-apps deploy --url http://localhost:3000 --username <username> --password <password>
  ```
  
  Where:
  http://localhost:3000 is your local server URL (if you are running in another port, change the 3000 to the appropriate port).
  `username` is the username of your admin user.
  `password` is the password of your admin user.
  If you want to update the app deployed in your Rocket.Chat instance after making changes to it, you can run:
  
  ```
  rc-apps deploy --url http://localhost:3000 --username user_username --password user_password --update
  ```
</ol>

The Application is now installed on the server. You can verify this by checking the installed applications from the administration panel.
Enter `/github` or  `/github help` in the message input box of any channel on the server to know about different features and how to trigger them using different slash commands.

<h2 align='center'>:desktop_computer: Application Setup :desktop_computer:</h2>

<p>The GitHub App uses the GitHub OAth2 and you must setup a GitHub OAuth App to unlock the full potential of the GitHub App.</p>

<ol>
<li>The First Step is to setup a GitHub Oauth2 App. To setup the GitHub Oauth App Follow <a href="https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app">These Steps</a>
</li> 
<li>
The callback URL must be set to the url of your server as shown below. (Note : There is an issue of trailing slashes with RocketChat OathClient, so incase the authentication does not work, go to Administration Panel and try removing the trailing '/' at the end of the hosted url. This issue might not occur as it will be fixed in the future.)
<div align="center">
 <img src="https://user-images.githubusercontent.com/70485812/180335941-f77ff2f9-272c-4716-a0fd-b50a2648e2de.png" alt="OAuth Example" width="50%"/>
 </div>
</li>


<li>
Once the GitHub OAuth app is setup, open the GitHub Application Settings and enter the GitHub App OAuth Client Id and Client Secret over here.
<div align="center">
<img src="https://user-images.githubusercontent.com/70485812/180335480-4b7ceba2-1c0a-4d81-be9b-843121cbbc6b.png" alt="OAuth Setting Example" width="70%"/>
<div>
</li>
</ol>

The users can login to GitHub by entering the slash command `/github login` and then clicking on the `Login` button.

Users are logged out after a week but the users can also logout at any time by entering `/github logout`.

