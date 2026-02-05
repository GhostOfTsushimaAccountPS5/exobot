const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('📊 Affiche les statistiques globales d’ExoBot.'),
  
  async execute(interaction) {
    const client = interaction.client;
    const uptime = moment.duration(client.uptime).humanize();

    const embed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setTitle('💜 Statistiques ExoBot')
      .setDescription('Voici les informations actuelles sur **ExoBot** :')
      .addFields(
        { name: '🌐 Serveurs', value: `${client.guilds.cache.size}`, inline: true },
        { name: '🏓 Ping', value: `${client.ws.ping} ms`, inline: true },
        { name: '⏱️ Uptime', value: `${uptime}`, inline: true },
        { name: '💾 Version', value: 'ExoBot v1.5.0 — build 2025.11.01', inline: false },
        { name: '👑 Développeur', value: '0zsw', inline: false },
      )
      .setFooter({ text: 'ExoBot #Z © 2025' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
