const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listowner')
    .setDescription('Lister tous les propriétaires du bot avec nom d\'utilisateur et ID')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  ownerOnly: true,
  async execute(interaction) {
    const config = JSON.parse(fs.readFileSync('./config.json'));
    const owners = config.owners;

    const embed = new EmbedBuilder()
      .setTitle('Propriétaires du bot')
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    for (const ownerId of owners) {
      try {
        const user = await interaction.client.users.fetch(ownerId);
        embed.addFields({ name: user.tag, value: `ID: ${ownerId}`, inline: true });
      } catch {
        embed.addFields({ name: 'Utilisateur inconnu', value: `ID: ${ownerId}`, inline: true });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
