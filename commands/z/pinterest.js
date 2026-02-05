// ./commands/media/pinterest.js
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { request } = require("undici");

const MAX_BYTES = 25 * 1024 * 1024;

function normalizeUrl(input) {
  return String(input || "")
    .trim()
    .replace(/^<|>$/g, "")
    .replace(/\s+/g, "");
}

function isPinterestUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const okHost =
      host === "pin.it" ||
      host.endsWith(".pin.it") ||
      host.includes("pinterest.");
    const okProto = u.protocol === "http:" || u.protocol === "https:";
    return okProto && okHost;
  } catch {
    return false;
  }
}

function extractMeta(html, property) {
  const re = new RegExp(
    `property=["']${property}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  return m?.[1] ?? null;
}

function extractTitle(html) {
  return extractMeta(html, "og:title") || "Pinterest";
}
function extractThumb(html) {
  return extractMeta(html, "og:image") || null;
}
function extractVideoUrl(html) {
  return extractMeta(html, "og:video:secure_url") || extractMeta(html, "og:video") || null;
}
function extractImageUrl(html) {
  return extractMeta(html, "og:image:secure_url") || extractMeta(html, "og:image") || null;
}

async function fetchText(url) {
  const res = await request(url, {
    method: "GET",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
    maxRedirections: 8,
  });
  if (res.statusCode < 200 || res.statusCode >= 300) throw new Error(`HTTP ${res.statusCode}`);
  return await res.body.text();
}

async function headContentLength(url) {
  const res = await request(url, { method: "HEAD", maxRedirections: 8 });
  const len = res.headers["content-length"];
  return len ? Number(len) : null;
}

async function fetchBuffer(url) {
  const res = await request(url, {
    method: "GET",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
    },
    maxRedirections: 8,
  });
  if (res.statusCode < 200 || res.statusCode >= 300) throw new Error(`HTTP ${res.statusCode}`);
  const arr = await res.body.arrayBuffer();
  return Buffer.from(arr);
}

function formatMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pinterest")
    .setDescription("Récupère un Pin Pinterest (vidéo si dispo, sinon image) et l’envoie prêt à télécharger.")
    .addStringOption((opt) =>
      opt
        .setName("lien")
        .setDescription("Lien Pinterest (pinterest.* ou pin.it)")
        .setRequired(true)
    ),

  async execute(interaction) {
    let link = interaction.options.getString("lien", true);
    link = normalizeUrl(link);

    if (!isPinterestUrl(link)) {
      return interaction.reply({
        content: "❌ Lien Pinterest invalide. (Formats acceptés: pinterest.* et pin.it)",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    let html;
    try {
      html = await fetchText(link);
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle("Pinterest")
        .setDescription(`❌ Impossible d’accéder à la page.\nDétail: ${e.message}`)
        .setColor(0xff5555)
        .setURL(link);
      return interaction.editReply({ embeds: [embed] });
    }

    const title = extractTitle(html);
    const thumb = extractThumb(html);

    const videoUrl = extractVideoUrl(html);
    const imageUrl = extractImageUrl(html);

    // Si vidéo dispo -> vidéo
    if (videoUrl) {
      const contentLength = await headContentLength(videoUrl).catch(() => null);

      if (contentLength && contentLength > MAX_BYTES) {
        const embed = new EmbedBuilder()
          .setTitle(title.slice(0, 256))
          .setURL(link)
          .setDescription(
            `✅ Vidéo trouvée mais trop lourde pour l’envoyer en fichier (${formatMB(contentLength)}).\n\n📎 Lien direct : ${videoUrl}`
          )
          .setColor(0x8a2be2);
        if (thumb) embed.setThumbnail(thumb);
        return interaction.editReply({ embeds: [embed] });
      }

      let buf;
      try {
        buf = await fetchBuffer(videoUrl);
      } catch (e) {
        const embed = new EmbedBuilder()
          .setTitle(title.slice(0, 256))
          .setURL(link)
          .setDescription(`❌ Téléchargement vidéo échoué.\nDétail: ${e.message}\n\n📎 Lien direct : ${videoUrl}`)
          .setColor(0xff5555);
        if (thumb) embed.setThumbnail(thumb);
        return interaction.editReply({ embeds: [embed] });
      }

      if (buf.length > MAX_BYTES) {
        const embed = new EmbedBuilder()
          .setTitle(title.slice(0, 256))
          .setURL(link)
          .setDescription(
            `✅ Vidéo trouvée mais trop lourde pour l’envoyer en fichier (${formatMB(buf.length)}).\n\n📎 Lien direct : ${videoUrl}`
          )
          .setColor(0x8a2be2);
        if (thumb) embed.setThumbnail(thumb);
        return interaction.editReply({ embeds: [embed] });
      }

      const file = new AttachmentBuilder(buf, { name: "pinterest.mp4" });
      const embed = new EmbedBuilder()
        .setTitle(title.slice(0, 256))
        .setURL(link)
        .setDescription(`✅ Vidéo prête à télécharger.\n📦 Taille : ${formatMB(buf.length)}`)
        .setColor(0x8a2be2);
      if (thumb) embed.setThumbnail(thumb);

      return interaction.editReply({ embeds: [embed], files: [file] });
    }

    // Sinon, si image dispo -> image (ton lien tombe ici)
    if (imageUrl) {
      const contentLength = await headContentLength(imageUrl).catch(() => null);

      if (contentLength && contentLength > MAX_BYTES) {
        const embed = new EmbedBuilder()
          .setTitle(title.slice(0, 256))
          .setURL(link)
          .setDescription(
            `✅ Image trouvée mais trop lourde pour l’envoyer en fichier (${formatMB(contentLength)}).\n\n📎 Lien direct : ${imageUrl}`
          )
          .setColor(0x8a2be2);
        if (thumb) embed.setThumbnail(thumb);
        return interaction.editReply({ embeds: [embed] });
      }

      let buf;
      try {
        buf = await fetchBuffer(imageUrl);
      } catch (e) {
        const embed = new EmbedBuilder()
          .setTitle(title.slice(0, 256))
          .setURL(link)
          .setDescription(`❌ Téléchargement image échoué.\nDétail: ${e.message}\n\n📎 Lien direct : ${imageUrl}`)
          .setColor(0xff5555);
        if (thumb) embed.setThumbnail(thumb);
        return interaction.editReply({ embeds: [embed] });
      }

      const file = new AttachmentBuilder(buf, { name: "pinterest.jpg" });
      const embed = new EmbedBuilder()
        .setTitle(title.slice(0, 256))
        .setURL(link)
        .setDescription(`✅ Image prête à télécharger.\n📦 Taille : ${formatMB(buf.length)}`)
        .setColor(0x8a2be2);
      if (thumb) embed.setThumbnail(thumb);

      return interaction.editReply({ embeds: [embed], files: [file] });
    }

    // Rien trouvé
    const embed = new EmbedBuilder()
      .setTitle(title.slice(0, 256))
      .setURL(link)
      .setDescription(
        "❌ Je n’ai trouvé ni vidéo ni image téléchargeable sur ce pin.\n" +
          "Ça peut être privé, bloqué, ou rendu uniquement via scripts côté client."
      )
      .setColor(0xff5555);

    if (thumb) embed.setThumbnail(thumb);

    return interaction.editReply({ embeds: [embed] });
  },
};