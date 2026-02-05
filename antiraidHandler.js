const { Events } = require('discord.js');
const antiraid = require('./commands/antiraid/antiraid.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const settings = antiraid.loadSettings();
    if (!settings.enabled) return;

    const now = Date.now();
    const timestamps = antiraid.joinTimestamps;

    if (!timestamps.has(member.guild.id)) {
      timestamps.set(member.guild.id, []);
    }

    const guildTimestamps = timestamps.get(member.guild.id);

    // Remove timestamps older than timeframe
    const timeframe = settings.timeFrame || 10000; // default 10 seconds
    const maxJoins = settings.maxJoins || 5;

    const filtered = guildTimestamps.filter(ts => now - ts < timeframe);
    filtered.push(now);
    timestamps.set(member.guild.id, filtered);

    if (filtered.length > maxJoins) {
      // Anti-raid triggered: ban the new member
      try {
        await member.ban({ reason: 'Anti-raid protection: too many joins in short time' });
        const channel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.type === 0);
        if (channel) {
          channel.send(`🚨 Anti-raid : ${member.user.tag} a été banni pour trop de connexions rapides.`);
        }
      } catch (error) {
        console.error('Erreur lors du ban anti-raid:', error);
      }
    }
  },
};
