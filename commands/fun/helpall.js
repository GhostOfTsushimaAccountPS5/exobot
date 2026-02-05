const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('helpall')
    .setDescription('Afficher toutes les commandes disponibles')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ViewChannel),
  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId('help-menu')
      .setPlaceholder('Sélectionnez une page du help')
      .addOptions([
        {
          label: 'Utilitaires',
          description: 'Affiche les commandes utilitaires et fun',
          value: 'utility',
        },
        {
          label: 'Modération',
          description: 'Affiche les commandes de modération',
          value: 'moderation',
        },
        {
          label: 'Backup',
          description: 'Affiche les commandes de backup',
          value: 'backup',
        },
        {
          label: 'Propriétaire',
          description: 'Affiche les commandes propriétaire',
          value: 'owner',
        },
        {
          label: 'Anti-Raid',
          description: 'Affiche les commandes anti-raid',
          value: 'antiraid',
        },
        {
          label: 'Support',
          description: 'Affiche les commandes de support (tickets)',
          value: 'support',
        },
        {
          label: '#Z',
          description: 'Affiche les commandes #Z',
          value: 'z',
        },
        {
          label: 'Logs',
          description: 'Affiche les commandes de logs',
          value: 'logs',
        },
      ]);

    const embed = new EmbedBuilder()
      .setTitle('ExoBot - Aide')
      .setDescription('Sélectionnez une page du help')
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });

    const sentMessage = await interaction.fetchReply();

    const filter = i => i.user.id === interaction.user.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      if (!i.isStringSelectMenu()) return;
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Seul l\'auteur peut utiliser ce menu.', ephemeral: true });
      }

      let embed;
      switch (i.values[0]) {
        case 'moderation':
          embed = new EmbedBuilder()
            .setTitle('Commandes de Modération')
            .setColor(0x800080)
            .setDescription('**/ban <utilisateur> [raison]** : Bannir un utilisateur du serveur\n**/kick <utilisateur> [raison]** : Expulser un utilisateur du serveur\n**/mute <utilisateur>** : Muter un utilisateur en ajoutant un rôle Muted\n**/renew** : Recréer le salon identique\n**/clear <nombre>** : Supprimer un nombre de messages (1-100)\n**/badwords <mot>** : Ajouter un mot interdit\n**/badwordslist** : Afficher la liste des mots interdits\n**/delbadwords** : Supprimer des mots interdits\n**/autorole <role>** : Définir le rôle à donner automatiquement aux nouveaux membres')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        case 'utility':
          embed = new EmbedBuilder()
            .setTitle('Commandes Utilitaires et Fun')
            .setColor(0x800080)
            .setDescription('**/stream <message>** : Changer le statut du bot\n**/serverinfo** : Affiche des infos sur le serveur\n**/userinfo [@utilisateur]** : Infos sur un membre\n**/ping** : Renvoie la latence du bot\n**/say <texte>** : Faire répéter un message au bot\n**/emojis** : Lister tous les emojis du serveur\n**/cat** : Envoyer une photo aléatoire de chat\n**/avatar [@utilisateur]** : Montre l’avatar d’un utilisateur\n**/gif <upload image>** : Transforme l\'image uploadée en GIF Discord\n**/arriver <salon>** : Envoie un message de bienvenue dans le salon choisi\n**/qrcode [texte/url] [upload image]** : Génère un QR code à partir d\'un texte, d\'une URL ou d\'une image')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        case 'backup':
          embed = new EmbedBuilder()
            .setTitle('Commandes de Backup')
            .setColor(0x800080)
            .setDescription('**/backup <nom>** : Backup les rôles et canaux du serveur avec un nom\n**/loadbackup <nom>** : Charger un backup par nom (remplace tout)\n**/listbackup** : Lister tous les backups\n**/delbackup** : Supprimer un backup par chiffre')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        case 'owner':
          embed = new EmbedBuilder()
            .setTitle('Commandes Propriétaire')
            .setColor(0x800080)
            .setDescription('**/addowner <ID>** : Ajouter un utilisateur en tant que propriétaire\n**/unowner <ID>** : Supprimer un utilisateur des propriétaires\n**/listowner** : Lister tous les propriétaires du bot')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        case 'antiraid':
          embed = new EmbedBuilder()
            .setTitle('Commandes Anti-Raid')
            .setColor(0x800080)
            .setDescription('**/antiraid enable** : Activer la protection anti-raid\n**/antiraid disable** : Désactiver la protection anti-raid\n**/antiraid status** : Afficher le statut de la protection')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        case 'support':
          embed = new EmbedBuilder()
            .setTitle('Commandes de Support')
            .setColor(0x800080)
            .setDescription('**/poptiket** : Crée un panel de ticket\n**/closeticket** : Ferme le ticket actuel')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        case 'z':
          embed = new EmbedBuilder()
            .setTitle('Commandes #Z')
            .setColor(0x800080)
            .setDescription('**/nuke all** : Supprimer tous les salons et catégories\n**/messall <message> <nombre>** : Envoyer un message à tous les salons.\n**/2fa <activer|desactiver|status>** : Activer la vérification 2FA par rôle pour les nouveaux membres.\n**/botstats** : Affiche les statistiques techniques du bot\n**/messageinfo <ID>** : Affiche les informations d’un message via son ID\n**/tiktok <url>** : Récupère une vidéo TikTok sans watermark\n**/pinterest <lien>** : Récupère une vidéo Pinterest et l’envoie prête à télécharger.')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        case 'logs':
          embed = new EmbedBuilder()
            .setTitle('Commandes de Logs')
            .setColor(0x800080)
            .setDescription('**/activelogs <salon>** : Activer les logs dans un salon\n**/disablelogs** : Désactiver tous les logs\n**/editlogs** : Modifier les types de logs activés')
            .setFooter({ text: 'ExoBot #Z © 2025' });
          break;
        default:
          return;
      }

      try {
        await i.update({ embeds: [embed], components: [row] });
      } catch (error) {
        if (error.code === 10062) {
          console.warn('Interaction déjà traitée, ignorée.');
        } else {
          console.error('Erreur lors de la mise à jour de l\'interaction:', error);
          try {
            await i.followUp({ content: 'Une erreur est survenue lors de la mise à jour du menu.', ephemeral: true });
          } catch (followUpError) {
            console.error('Erreur lors du followUp:', followUpError);
          }
        }
      }
    });

    collector.on('end', collected => {
      try {
        sentMessage.edit({ components: [] });
      } catch (error) {
        if (error.code === 10008) {
          console.warn('Message déjà supprimé, ignoré.');
        } else {
          console.error('Erreur lors de la suppression des composants:', error);
        }
      }
    });
  },
};