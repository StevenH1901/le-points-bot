const { SlashCommandBuilder, InteractionContextType, codeBlock } = require('discord.js');
const User = require('../../Schemas/userSchema');
const { AsciiTable3 } = require('ascii-table3');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('point-status')
        .setDescription('Display current points')
        .addBooleanOption(option =>
            option.setName('display_all')
                .setDescription('Include members with 0 points')
        )
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        // Create the ASCII table
        var table = new AsciiTable3('Point Totals')
            .setHeading('User', 'Points');

        // Get the guild in case we need to pull members not from cache
        const guild = await interaction.member.guild;

        // Sometimes it takes more than 3 seconds to finish this, so defer reply
        await interaction.deferReply();

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
    },
};
