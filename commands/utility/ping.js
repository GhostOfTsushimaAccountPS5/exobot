const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Renvoie la latence du bot'),
  async execute(interaction) {
    const sent = await interaction.reply({ embeds: [new EmbedBuilder().setDescription('Pinging...').setColor(0x800080)], fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const embed = new EmbedBuilder()
      .setTitle('Pong!')
      .setDescription(`Latence: ${latency}ms`)
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });
    await interaction.editReply({ embeds: [embed] });
  }
};
