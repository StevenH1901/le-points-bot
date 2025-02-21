const { SlashCommandBuilder, InteractionContextType, codeBlock } = require('discord.js');
const PointLog = require('../../Schemas/pointLogSchema');
const User = require('../../Schemas/userSchema');
const { AsciiTable3 } = require('ascii-table3');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('points')
        .setDescription('Give or take away points')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member to update points for')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('points')
                .setDescription('How many points')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Why')
                .setRequired(true))
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const points = interaction.options.getString('points');
        const reason = interaction.options.getString('reason');

        if (isNaN(points)) {
            await interaction.reply(`Dumb bitch, ${points} is not a valid number. Try again`);
        } else {
            // Log new point entry
            const newPointLog = PointLog.create({
                to_discord_id: target.id,
                from_discord_id: interaction.user.id,
                points: points,
                reason: reason,
                timestamp: Date.now()
            });

            // Update user points
            User.findOne({ discord_id: target.id }).then(user => {
                const newTotal = Number(user.points) + Number(points);
                user.points = newTotal;
                user.save();
            }).catch(err => console.log(err));

            // Create the ASCII table
            var table = new AsciiTable3('Point Totals')
                .setHeading('User', 'Points');

            // Sometimes it takes more than 3 seconds to finish this, so defer reply
            await interaction.deferReply();

            // Get the guild in case we need to pull members not from cache
            const guild = await interaction.member.guild;

            let allUsers = null;
            if (interaction.options.getBoolean('display_all')) {
                allUsers = await User.find().sort({ points: 'desc' });
            } else {
                allUsers = await User.where('points').ne(0).sort({ points: 'desc' });
            }

            for (const user of allUsers) {
                const discordID = String(user.discord_id);

                // Pull user from cache
                let guildUser = await guild.members.cache.get(discordID)

                // User wasn't in cache, pull from servers
                if (!guildUser) {
                    guildUser = await guild.members.fetch(discordID);
                }

                table.addRow(guildUser.nickname || guildUser.user.displayName, user.points);
            }

            interaction.editReply(codeBlock(table.toString()));
        }
    },
};
