const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gif')
    .setDescription('Transforme l\'image uploadée en GIF Discord')
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('L\'image à convertir en GIF')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const attachment = interaction.options.getAttachment('image');

    if (!attachment || !attachment.contentType || !attachment.contentType.startsWith('image/')) {
      return interaction.editReply({ content: 'Veuillez uploader une image valide.' });
    }

    try {
      const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      const gifBuffer = await sharp(imageBuffer)
        .gif()
        .toBuffer();

      const embed = new EmbedBuilder()
        .setTitle('Image convertie en GIF')
        .setColor(0x800080)
        .setImage('attachment://exobot.gif')
        .setFooter({ text: 'ExoBot #Z © 2025' });

      await interaction.editReply({
        embeds: [embed],
        files: [{ attachment: gifBuffer, name: 'exobot.gif' }]
      });
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      await interaction.editReply({ content: 'Une erreur est survenue lors de la conversion de l\'image.' });
    }
  }
};
