const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const tiktokDL = async url => {
    let domain = 'https://www.tikwm.com/';
    let res = await axios.post(domain+'api/', {}, {
        headers: {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'sec-ch-ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
        },
        params: {
            url: url,
            count: 12,
            cursor: 0,
            web: 1,
            hd: 1
        }
    })

    if (res.data.code !== 0) {
        throw new Error(res.data.msg || 'Erreur API');
    }

    return {
        nowm: domain+res.data.data.play, 
        wm: domain+res.data.data.wmplay, 
        music: domain+res.data.data.music, 
    }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tiktok')
    .setDescription('Récupère une vidéo TikTok sans watermark')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Lien de la vidéo TikTok')
        .setRequired(true)
    ),
  async execute(interaction) {
    const videoUrl = interaction.options.getString('url');

    // Différer la réponse
    await interaction.deferReply();

    try {
      // Récupérer les URLs
      const { nowm } = await tiktokDL(videoUrl);

      // Télécharger temporairement
      const tempFilename = path.join(__dirname, `temp_${Date.now()}.mp4`);
      const response = await axios.get(nowm, { responseType: 'stream' });
      const writer = fs.createWriteStream(tempFilename);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Envoyer le fichier
      await interaction.editReply({
        files: [{
          attachment: tempFilename,
          name: 'exobot_video.mp4'
        }]
      });

      // Supprimer le fichier
      fs.unlinkSync(tempFilename);

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `❌ Erreur: ${error.message}` });
    }
  },
};