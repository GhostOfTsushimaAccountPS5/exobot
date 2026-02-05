const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

const configPath = './2faConfig.json';

function loadConfig(guildId) {
  if (!fs.existsSync(configPath)) return {};
  const all = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return all[guildId] || {};
}

function saveConfig(guildId, data) {
  let all = {};
  if (fs.existsSync(configPath)) all = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  all[guildId] = data;
  fs.writeFileSync(configPath, JSON.stringify(all, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('2fa')
    .setDescription('Configurer la vérification 2FA par rôle')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Activer, Désactiver ou Status')
        .setRequired(true)
        .addChoices(
          { name: 'Activer', value: 'activer' },
          { name: 'Désactiver', value: 'desactiver' },
          { name: 'Status', value: 'status' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ownerOnly: true,
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const guildId = interaction.guild.id;
    let config = loadConfig(guildId);

    if (action === 'activer') {
      await interaction.reply({ content: 'Merci d’entrer l’ID du rôle à donner après vérification (dans les 30s) :', ephemeral: true });
      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', m => {
        const roleId = m.content.trim();
        if (!interaction.guild.roles.cache.has(roleId)) {
          return interaction.followUp({ content: '❌ Rôle introuvable.', ephemeral: true });
        }
        config.enabled = true;
        config.roleId = roleId;
        saveConfig(guildId, config);
        interaction.followUp({ content: `✅ 2FA activé. Rôle à donner : <@&${roleId}>`, ephemeral: true });
      });

      collector.on('end', collected => {
        if (collected.size === 0) interaction.followUp({ content: '⏳ Temps écoulé.', ephemeral: true });
      });

    } else if (action === 'desactiver') {
      config.enabled = false;
      saveConfig(guildId, config);
      await interaction.reply({ content: '❌ 2FA désactivé.', ephemeral: true });

    } else if (action === 'status') {
      if (config.enabled) {
        await interaction.reply({ content: `✅ 2FA actif. Rôle : <@&${config.roleId}>`, ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ 2FA inactif.', ephemeral: true });
      }
    }
  }
};