const fs = require('fs');
const path = './antiraid.json';
const { SlashCommandBuilder } = require('discord.js');

function loadSettings() {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ enabled: false, maxJoins: 5, timeFrame: 10000 }));
  }
  return JSON.parse(fs.readFileSync(path));
}

function saveSettings(settings) {
  fs.writeFileSync(path, JSON.stringify(settings, null, 2));
}

const joinTimestamps = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Gérer la protection anti-raid')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action à effectuer')
        .setRequired(true)
        .addChoices(
          { name: 'Activer', value: 'enable' },
          { name: 'Désactiver', value: 'disable' },
          { name: 'Statut', value: 'status' }
        )
    ),
  ownerOnly: true,
  async execute(interaction) {
    const settings = loadSettings();
    const subcommand = interaction.options.getString('action');

    if (subcommand === 'enable') {
      settings.enabled = true;
      saveSettings(settings);
      await interaction.reply('✅ Protection anti-raid activée.');
    } else if (subcommand === 'disable') {
      settings.enabled = false;
      saveSettings(settings);
      await interaction.reply('❌ Protection anti-raid désactivée.');
    } else if (subcommand === 'status') {
      await interaction.reply(`Protection anti-raid est actuellement : ${settings.enabled ? 'Activée' : 'Désactivée'}`);
    }
  },
  settingsPath: path,
  loadSettings,
  saveSettings,
  joinTimestamps,
};
