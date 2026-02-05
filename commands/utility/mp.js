const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mp')
    .setDescription('Envoie un message privé à un utilisateur mentionné')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à qui envoyer le message')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Le message à envoyer')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages),
  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const dmMessage = interaction.options.getString('message');

    try {
      await interaction.deferReply({ ephemeral: true });

      if (!user) {
        return interaction.editReply('❌ Utilisateur introuvable.');
      }

      await user.send(dmMessage);
      await interaction.editReply(`✅ Message privé envoyé à ${user.tag}.`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message privé:', error);
      await interaction.editReply('❌ Impossible d\'envoyer le message privé.');
    }
  }
};
