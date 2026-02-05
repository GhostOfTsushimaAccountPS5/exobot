const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un utilisateur du serveur')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à expulser')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison de l\'expulsion')
        .setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({ content: 'Utilisateur introuvable sur ce serveur.', ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ content: 'Je ne peux pas expulser cet utilisateur.', ephemeral: true });
    }

    try {
      await member.kick(reason);
      await interaction.reply({ content: `✅ Expulsé ${user.tag} pour : ${reason}` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Erreur lors de l\'expulsion.', ephemeral: true });
    }
  }
};
