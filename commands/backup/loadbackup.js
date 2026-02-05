const fs = require('fs');
const path = require('path');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loadbackup')
    .setDescription('Charger un backup du serveur par nom (remplace complètement la configuration actuelle)')
    .addStringOption(option =>
      option.setName('nom')
        .setDescription('Nom de la backup à charger')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const backupName = interaction.options.getString('nom');
    const backupsDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupsDir)) {
      return interaction.reply({ content: '❌ Aucun dossier de backup trouvé.', ephemeral: true });
    }

    const filePath = path.join(backupsDir, `${backupName}.json`);
    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: `❌ Backup "${backupName}" introuvable.`, ephemeral: true });
    }

    const data = JSON.parse(fs.readFileSync(filePath));

    // Delete all existing channels
    const existingChannels = interaction.guild.channels.cache;
    for (const channel of existingChannels.values()) {
      try {
        if (!channel.deleted) {
          await channel.delete();
        }
      } catch (error) {
        console.error(`Failed to delete channel ${channel.name}:`, error);
      }
    }

    // Delete all existing roles (except @everyone and managed roles)
    const existingRoles = interaction.guild.roles.cache.filter(role => !role.managed && role.name !== '@everyone');
    for (const role of existingRoles.values()) {
      try {
        await role.delete();
      } catch (error) {
        console.error(`Failed to delete role ${role.name}:`, error);
      }
    }

    // Create roles with positions
    const createdRoles = new Map();
    for (const roleData of data.roles.sort((a, b) => a.position - b.position)) {
      try {
        const role = await interaction.guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          permissions: roleData.permissions,
          position: roleData.position,
        });
        createdRoles.set(roleData.name, role);
      } catch (error) {
        console.error(`Failed to create role ${roleData.name}:`, error);
      }
    }

    // Create channels with categories (create categories first)
    const createdChannels = new Map();
    const categories = data.channels.filter(c => c.type === 4).sort((a, b) => a.position - b.position);
    const otherChannels = data.channels.filter(c => c.type !== 4).sort((a, b) => a.position - b.position);

    for (const channelData of categories) {
      try {
        const channel = await interaction.guild.channels.create({
          name: channelData.name,
          type: channelData.type,
          position: channelData.position,
        });
        createdChannels.set(channelData.name, channel);
      } catch (error) {
        console.error(`Failed to create category ${channelData.name}:`, error);
      }
    }

    for (const channelData of otherChannels) {
      try {
        let parent = null;
        if (channelData.parent) {
          // Safely get the parent channel from createdChannels map
          parent = createdChannels.get(channelData.parent) || null;
        }
        const channel = await interaction.guild.channels.create({
          name: channelData.name,
          type: channelData.type,
          parent: parent,
          position: channelData.position,
        });
        createdChannels.set(channelData.name, channel);
      } catch (error) {
        console.error(`Failed to create channel ${channelData.name}:`, error);
      }
    }

    try {
      await interaction.reply(`✅ Backup "${backupName}" chargée avec succès. Toutes les configurations précédentes ont été remplacées.`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message de confirmation:', error);
    }
  },
};
