# Dish of the Week: Discord Cooking Challenge Bot

Dish of the Week is a Discord bot that manages weekly cooking challenges for your community. With features like **dish management**, **participation tracking**, and **leaderboards**, this bot helps engage your community in fun cooking activities.

## Features
- **Weekly Dish Challenges**: Set a new dish challenge each week with recipe ideas
- **Participation System**: Members submit photos of their cooked dishes
- **Leaderboard Tracking**: Track top participants with point accumulation
- **AI-Powered Chat**: Interact with a funny, cooking-savvy hamster chef character
- **Fun Commands**: Includes posture checks, hydration reminders, and social interactions
- **Admin Controls**: Special commands for server administrators

## Technologies Used
- **Discord.js**: Bot framework for Discord integration
- **OpenAI API**: Powers the AI chat functionality
- **SQLite3**: Local database for storing challenge and participation data
- **Node.js**: JavaScript runtime environment
- **dotenv**: Environment variable management

## Installation
To run Dish of the Week locally, follow these steps:

### Prerequisites
- Node.js (v16 or higher)
- NPM or Yarn package manager
- Discord Bot Token
- OpenAI API Key

### Setup
1. Clone the repository:
```bash
git clone https://github.com/TheShizuka/Dish-of-the-week
cd dish-of-the-week
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following:
```
DISCORD_TOKEN=your_discord_bot_token
OPENAI_API_KEY=your_openai_api_key
```

4. Initialize the database (the bot will create it automatically on first run)

5. Start the bot:
```bash
node index.js
```

## Database Files
The bot uses a SQLite database file named `dishoftheweek.db`. If you have multiple database files from testing, make sure to keep this one.

## Commands

### Admin Commands
- `/setdish` - Set the dish of the week with name and recipe idea
- `/deleteparticipation` - Remove a user's participation entry

### User Commands
- `/help` - Shows available commands and information
- `/currentdish` - View the current dish challenge and time remaining
- `/participate` - Submit your dish photo for the current challenge
- `/leaderboard` - View the top participants

### Fun Commands
- `!hydrate` - Hydration reminder
- `!posture_check` - Posture reminder
- `!stretch` - Stretch reminder
- `!hug @user` - Give someone a virtual hug
- `!bonk @user` - Playfully bonk someone
- `!pat @user` - Pat someone's head
- `!snacc @user` - Give someone a virtual snack
- `!cuddle @user` - Virtual cuddle
- `!lurk` - Announce you're going into lurk mode

## Contact
If you have any questions or feedback, feel free to reach out:
- Email: ayatgimenez@hotmail.com
- LinkedIn: [Hicham AYAT GIMENEZ](https://www.linkedin.com/in/hicham-a-9553ba28b/)
- Portfolio: [Portfolio Website](https://shizukadesu.com/)

Made with ❤️ for Discord communities