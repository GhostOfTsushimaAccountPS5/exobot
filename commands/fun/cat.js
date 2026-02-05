const axios = require('axios');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Envoie une photo aléatoire de chat'),
  async execute(interaction) {
    try {
      const response = await axios.get('https://api.thecatapi.com/v1/images/search');
      const catImage = response.data[0].url;

      const embed = new EmbedBuilder()
        .setTitle('🐱 Random Cat')
        .setImage(catImage)
        .setColor(0x800080)
        .setFooter({ text: 'ExoBot #Z © 2025' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply('❌ Erreur lors de la récupération de l\'image de chat.');
    }
  }
};
