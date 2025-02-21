const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const User = require('../../Schemas/userSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('init')
        .setDescription('Initialize Points Bot')
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guild = interaction.member.guild;

        const allMembers = await guild.members.fetch();

        allMembers.forEach(user => {
            if (!user.user.bot) {
                User.create({
                    discord_id: user.id,
                    points: 0
                });
            }
        });

        interaction.reply('Le Points Bot has been initialized');
    },
};
