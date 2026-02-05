const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Muter un utilisateur en ajoutant un rôle Muted')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à muter')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({ content: 'Utilisateur introuvable sur ce serveur.', ephemeral: true });
    }

    let mutedRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
    if (!mutedRole) {
      try {
        mutedRole = await interaction.guild.roles.create({
          name: 'Muted',
          color: '#555555',
          permissions: [],
        });
        interaction.guild.channels.cache.forEach(async (channel) => {
          await channel.permissionOverwrites.edit(mutedRole, {
            SendMessages: false,
            Speak: false,
            AddReactions: false,
          });
        });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Échec de la création du rôle Muted.', ephemeral: true });
      }
    }

    if (member.roles.cache.has(mutedRole.id)) {
      return interaction.reply({ content: 'L\'utilisateur est déjà muté.', ephemeral: true });
    }

    await member.roles.add(mutedRole);
    await interaction.reply({ content: `✅ Muté ${user.tag}` });
  }
};
