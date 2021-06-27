/* eslint-disable max-len */
require("dotenv").config();
const {Client, MessageEmbed} = require("discord.js");

const confirmationMessage = `Hello and thank you for submitting feedback for the Blaseball website! **Before confirming your feedback, please consider:** 

:writing_hand: Helpful/appropriate feedback **explains your own experiences and reactions to Blaseball,** rather than providing theoretical solutions or dipping into speculative game design. 
:writing_hand: We also ask that you do not provide further feedback on **vaulted topics** in order to minimize repeat feedback that devs are familiar with (check the pins in <#732322231119511573> for a list of **vaulted topics**). 
:writing_hand: Please keep your feedback focused on general mechanics and website features, rather than targeting specific teams!
:writing_hand: Feedback will be reviewed by Custodians, and inappropriate feedback will be removed if it does not follow channel guidelines or server rules.

**All set to post?** Reply \`FRUIT\` to complete the feedback submission process, or \`CANCEL\` to remove your submission.`;


const client = new Client({
    "disableMentions": "everyone"
});

client.on("message", async (message) => {

    if (message.author.bot) return;
    if (message.channel.id !== process.env.TARGET_CHANNEL) return;
    if (!message.guild) return;

    if (message.content.startsWith("❗")
        && message.channel.permissionsFor(message.member).has("MANAGE_MESSAGES")) return;

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (message.deleted) return;

    const {author, member} = message;

    const feedbackEmbed = new MessageEmbed()
        .setAuthor(member.displayName, author.avatarURL())
        .setFooter(author.id)
        .setTimestamp(Date.now())
        .setDescription(message.cleanContent)
        .setColor(member.displayColor);

    message.delete();

    const fruit = require("./fruitlist")();

    await author.send(
        confirmationMessage.replace("FRUIT", fruit),
        feedbackEmbed
    )
        .catch(async (error) => {

            if (error.code === 50007) {

                const reply = await message
                    .reply("I need to be able to message you to recive your feedback!");

                reply.delete({
                    "timeout": 120000
                });
            
        
            } else {

                console.error(error);
        
            }
    
        })
        .then((dmMessage) => {


            if (dmMessage === undefined) return;

            // eslint-disable-next-line func-style
            const filter
                = (msg) => msg.content.toLowerCase() === fruit.toLowerCase() || msg.content.toLowerCase() === "cancel";
            const collector = dmMessage.channel
                .createMessageCollector(filter, {
                    "max": 1,
                    "time": 300000
                });

            collector.on("error", console.error);
            collector.on("end", async (collected) => {

                if (collected.size === 0) {

                    dmMessage.channel.send("Timed Out, Sorry!");
                
                } else {

                    if
                    (collected.first().content.toLowerCase() === "cancel") {

                        dmMessage.channel.send("Canceled!");
                        
                        return;
                    
                    }
                    
                    const destination
                        = await client.channels.fetch(process.env.DESTINATION_CHANNEL);
                    const feedback = await destination.send(feedbackEmbed);

                    dmMessage.channel.send("Thank you for your feedback! It has been posted in a private channel for the developers to read.");
                    feedback.react("✅");
                
                }
                
            });
    
        });

});

client.on("ready", () => console.log("Ready for feedback!"));
client.login(process.env.TOKEN);
