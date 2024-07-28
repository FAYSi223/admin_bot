const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  handleButtonClick: async (button, teamRoleId) => {
    if (button.customId === 'create_ticket') {
      const guild = button.guild;
      const user = button.user;

      guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: teamRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
      }).then(channel => {
        const embed = new EmbedBuilder()
          .setTitle('Ticket Created')
          .setDescription(`Hello ${user}, a staff member will be with you shortly.`)
          .setColor('#00FF00');

        const closeButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Danger)
          .setLabel('Close Ticket')
          .setCustomId('close_ticket');

        const row = new ActionRowBuilder().addComponents(closeButton);

        channel.send({ embeds: [embed], components: [row] });
      });

      await button.reply({ content: 'Your ticket has been created.', ephemeral: true });
    } else if (button.customId === 'close_ticket') {
      const channel = button.channel;
      channel.delete().catch(console.error);

      await button.reply({ content: 'Ticket closed.', ephemeral: true });
    }
  }
};
