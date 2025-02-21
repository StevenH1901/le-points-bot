const { Client, SlashCommandBuilder, InteractionContextType, codeBlock, GatewayIntentBits } = require('discord.js');
const { token } = require('../../config.json');
const pointLog = require('../../Schemas/pointLogSchema');
const { AsciiTable3 } = require('ascii-table3');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('point-history')
        .setDescription('Display all points a user has received')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member to update points for')
                .setRequired(true))
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        // Setup new client in case we need to pull user info from outside the guild
        const client = new Client({
            intents: [
                GatewayIntentBits.GuildMembers
            ]
        });
        client.login(token);

        const target = interaction.options.getUser('user');

        // Create the ASCII table
        var table = new AsciiTable3(`Point History for ${target.nickname || target.globalName}`)
            .setHeading('Grantor', 'Points', 'Reason');

        // Get the guild in case we need to pull members not from cache
        const guild = await interaction.member.guild;

        // Sometimes it takes more than 3 seconds to finish this, so defer reply
        await interaction.deferReply();

        pointHistory = await pointLog.where('to_discord_id').equals(target.id).sort({ timestamp: 'asc' });

        for (const log of pointHistory) {
            const discordID = String(log.from_discord_id);

            // Pull user from cache
            let grantor = await guild.members.cache.get(discordID)

            // User wasn't in cache, pull from server API
            if (!grantor) {
                grantor = await guild.members.fetch(discordID);
            }

            // User is no longer a member of the server, pull from full API
            if (!grantor) {
                grantor = await client.users.fetch(discordID);
            }

            table.addRow(grantor.nickname || grantor.user.displayName, log.points, log.reason);
        }

        interaction.editReply(codeBlock(table.toString()));
    },
};
