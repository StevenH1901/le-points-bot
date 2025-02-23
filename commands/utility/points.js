const { SlashCommandBuilder, InteractionContextType, codeBlock } = require('discord.js');
const { env } = require('../../config.json');
const PointLog = require('../../Schemas/pointLogSchema');
const User = require('../../Schemas/userSchema');
const { AsciiTable3 } = require('ascii-table3');
const { Validator, escape, isInt } = require('validator');

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
        let reason = interaction.options.getString('reason');

        // Since _someone_ likes to break this with invalid numbers, let's log the points so we can figure it out easier
        console.log(`${points} to ${target.displayName} by ${interaction.user.displayName}`)

        // Check if user is assigning themselves points, that's not fun
        if (interaction.user.id == target.id && env != 'dev') {
            return interaction.reply(`@everyone - <@${interaction.user.id}> tried giving themselves points`);
        }

        // Check if target is a bot
        if (target.bot) {
            return interaction.reply(`Bots don't deserve points.`);
        }

        if (isFinite(points)) {
            // Validate points - Final sanity check
            if (!isInt(points)) {
                return interaction.reply('That\'s not a valid point value!');
            }

            // Sanitize reason
            reason = escape(reason);

            // Random max num between 1 billion and 1 tillion
            maxNum = Math.floor(Math.random() * 1000000000000) + 1000000000;
            minNum = maxNum * -1;
            if (points > maxNum) {
                return interaction.reply(`Mmmm.... No. <@${target.id}> doesn't seem worth of that many points`);
            }
            if (points < minNum) {
                return interaction.reply(`What the fuck did <@${target.id}> do to deserve ${points}? Let's not and say we didnt'`);
            }

            // Log new point entry
            const newPointLog = PointLog.create({
                to_discord_id: target.id,
                from_discord_id: interaction.user.id,
                points: points,
                reason: reason,
                timestamp: Date.now()
            }).catch(err => {
                console.log(`[ERROR] ${err}`)
                return interaction.reply(` "${points}" is (probably) not a valid number. Try again`);
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
        } else if (isNaN(points)) {
            await interaction.reply(`Dumb bitch, "${points}" is not a valid number. Try again`);
        } else if (points == Infinity) {
            await interaction.reply(`Asshat, No one deserves infinite points.`);
        } else {
            await interaction.reply(`Hey fucker, That's not a valid number. Try again`);
        }
    },
};
