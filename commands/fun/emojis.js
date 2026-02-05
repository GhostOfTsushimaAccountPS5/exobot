const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojis')
    .setDescription('Lister tous les emojis du serveur'),
  async execute(interaction) {
    const emojisArray = Array.from(interaction.guild.emojis.cache.values());
    const description = emojisArray.length > 0
      ? emojisArray.map((e, i) => `${i + 1}. ${e}`).join('\n')
      : 'Aucun emoji trouvé sur ce serveur.';

    const embed = new EmbedBuilder()
      .setTitle('Liste des emojis du serveur')
      .setColor(0x800080)
      .setDescription(description)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};