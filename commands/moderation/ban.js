const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un utilisateur du serveur')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à bannir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du bannissement')
        .setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({ content: 'Utilisateur introuvable sur ce serveur.', ephemeral: true });
    }
    if (!member.bannable) {
      return interaction.reply({ content: 'Je ne peux pas bannir cet utilisateur.', ephemeral: true });
    }

    try {
      await member.ban({ reason });
      await interaction.reply({ content: `✅ Banni ${user.tag} pour : ${reason}` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Erreur lors du bannissement.', ephemeral: true });
    }
  }
};
