const fs = require("fs");
const os = require("os");
const moment = require("moment-timezone");
const { generateWAMessageFromContent, proto } = bail;

const totalMemory = os.totalmem(), freeMemory = os.freemem(), usedMemory = totalMemory - freeMemory;

let handler = async (m, { conn, usedPrefix, command, args }) => {
  let perintah = args[0] || (command === "allmenu" ? "all" : "tags");
  let tagCount = {}, tagHelpMapping = {}, pluginsList = Object.values(global.plugins).filter(p => p.help && !p.disabled);

  pluginsList.forEach(p => {
    (Array.isArray(p.tags) ? p.tags : []).forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
      tagHelpMapping[tag] = [...(tagHelpMapping[tag] || []), ...(Array.isArray(p.help) ? p.help : [p.help])];
    });
  });

  const listTags = Object.keys(tagCount);
  const categoryRows = listTags.map(tag => {
    let cap = tag.charAt(0).toUpperCase() + tag.slice(1);
    return {
      header: `</> ${cap} MODULE`,
      title: `</> ${cap} Menu`,
      description: `Temukan semua fitur yang berkaitan dengan kategori *${cap}* di sini.`,
      id: `${usedPrefix + command} ${tag}`,
    };
  });

  const user = global.db.data.users[m.sender];
  const fitur = pluginsList.map(p => p.help).flat(1);
  const hasil = fitur.length;

  let uptime = process.uptime();
  let hari = Math.floor(uptime / 86400); uptime %= 86400;
  let jam = Math.floor(uptime / 3600); uptime %= 3600;
  let menit = Math.floor(uptime / 60);
  let detik = Math.floor(uptime % 60);
  let runtime = `${hari}D ${jam}H ${menit}M ${detik}S`;

  const dashboard = `
┏━━━━━━━━━━━━━┓
┃  *\`[ I N F O  U S E R ]\`*   
┗━━━━━━━━━━━━━┛

> [+]: Mode        = ${global.opts['self'] ? 'Self' : 'Public'}
> [+]: Bot Name    = ${namebot}
> [+]: Owner       = ${nameown}
> [+]: Tag         = @${nomorown.split("@")[0]}
> [+]: Version     = ${version}
> [+]: Users       = ${Object.keys(global.db.data.users).length}
> [+]: Chats       = ${Object.keys(conn.chats).length}
> [+]: Menus       = ${hasil}
> [+]: DB Size     = ${Func.formatSize(fs.statSync("database.json").size)}
> [+]: Runtime     = ${runtime}
> [+]: RAM         = ${Func.formatSize(freeMemory)} free / ${Func.formatSize(usedMemory)} used

┏━━━━━━━━━━━━━┓
┃  *\`[ I N F O  U S E R ]\`*   
┗━━━━━━━━━━━━━┛

> [+]: Name        = ${user.name}
> [+]: Tag         = @${m.sender.split("@")[0]}
> [+]: Saldo       = ${user.saldo}
> [+]: Umur        = ${user.age || 0}
> [+]: Limit       = ${isNaN(user.limit) ? 'Unlimited' : user.limit}
> [+]: Exp         = ${user.exp}
> [+]: Level       = ${user.level}
> [+]: Premium     = ${user.premium ? "✅" : "❌"}
> [+]: Role        = ${user.role}
> [+]: Bank        = ${user.bank}
> [+]: Cash        = ${user.money || 0}
`.trim();

  const datas = {
    title: [`[ ${namebot} • Aɪ  Pᴏᴡᴇʀᴇᴅ  Mᴇɴᴜ ]`],
    sections: [
      {
        title: `⚡ [ Powered by ${nameown} ]`,
        rows: [
          {
            header: `[ 🌐  ${namebot} Global Menu ]`,
            title: "🧠 [ Explore All Features ]",
            description: `🔓 [ Unlock full potential of ${namebot} ]`,
            id: ".menu all",
          },
        ],
      },
      {
        title: "📁 [ Categorized Modules ]",
        highlight_label: "✨ [ Featured Functions ]",
        rows: categoryRows,
      },
      {
        title: "👨‍💻 [ System Owner ]",
        highlight_label: `👑 [ Creator of ${namebot} ]`,
        rows: [
          {
            header: "[ 🧑‍💼 Developer Info ]",
            title: "📌 [ Meet the Creator ]",
            description: "[ View Owner Profile ]",
            id: ".owner",
          },
        ],
      },
      {
        title: "📡 [ System Status ]",
        highlight_label: `📊 [ ${namebot} Uptime Monitor ]`,
        rows: [
          {
            header: "[ 📶 Ping Checker ]",
            title: "📍 [ Check Bot Responsiveness ]",
            description: "[ Real-time latency report ]",
            id: ".ping",
          },
        ],
      },
      {
        title: "🚀 [ Premium Access ]",
        highlight_label: "⚙️ [ Activate or Extend Access ]",
        rows: [
          {
            header: `[ 🛒 Rent ${namebot} ]`,
            title: "💼 [ Service Rental Info ]",
            description: "[ View pricing and plans ]",
            id: ".sewa",
          },
        ],
      },
    ],
  };

  // → KIRIM MENU BERBEDA DI GROUP DAN PRIVATE
  if (m.chat.endsWith("@g.us")) {
    // Jika grup → pakai button menu
    if (perintah === "tags") {
      await conn.sendButtonMessage(
        m.chat,
        [
          { id: 'gada', text: '[ 🔍 ] → [ menu --all ]', native: true },
          { id: '.owner', text: '[ 🚀 ] Owner' }
        ], 
        dashboard,
        `[ ${namebot} Powered By @${nomorown.split("@")[0]} ]`,
        m.sender,
        fdoc,
        datas
      );
      conn.sendAudioMessage(m.chat, audioz, m, fdoc);
    } else if (tagHelpMapping[perintah]) {
      const helpItems = tagHelpMapping[perintah].map(h => `┆ ✧➤ .*${h}*`).join('\n');
      const categoryResponse = `
┏─────────────┈
┆   *\`[ ${perintah.toUpperCase()} Menu ]\`*
┣─────────────┈
${helpItems}
╰─━───────────━➢`;
      await conn.sendButtonMessage(
        m.chat,
        [{ id: '.owner', text: '[ Owner ]' }],
        categoryResponse,
        `[ ${namebot} Powered By @${nomorown.split("@")[0]} ]`,
        m.sender,
        fdoc
      );
      conn.sendAudioMessage(m.chat, audioz, m, fdoc);
    } else if (perintah === "all") {
      const allTagsAndHelp = listTags.map(tag => {
        const list = tagHelpMapping[tag].map(helpItem => `┆ ✧➤ .*${helpItem}*`).join("\n");
        return `┏─────────────┈\n┆   *\`[ ${tag.toUpperCase()} Menu ]\`*\n┣─────────────┈\n${list}\n╰─━───────────━➢`;
      }).join("\n\n");
      await conn.sendButtonMessage(
        m.chat,
        [{ id: '.owner', text: '[ Owner ]' }],
        `${dashboard}\n┏─────────────┈\n┆   *\`[ A L L  M E N U ]\`*\n╰─━───────────━➢\n\n${allTagsAndHelp}`,
        `[ ${namebot} Powered By @${nomorown.split("@")[0]} ]`,
        m.sender,
        fdoc
      );
      conn.sendAudioMessage(m.chat, audioz, m, fdoc);
    } else {
      await conn.reply(m.chat, `Maaf, menu *${perintah.toUpperCase()}* tidak ditemukan.`, m);
    }
  } else {
    // Jika private → kirim image + caption
    await conn.sendMessage(
      m.chat,
      {
        image: { url: thumb },
        caption: dashboard,
        footer: `[ Powered by ${nameown} ]`,
        viewOnce: false,
        contextInfo: {
          isForwarded: true,
          forwardingScore: 999,
          mentionedJid: [nomorown + "@s.whatsapp.net"],
          forwardedNewsletterMessageInfo: {
            newsletterName: wm2,
            newsletterJid: idsaluran,
            serverMessageId: null,
          },
          externalAdReply: {
            title: `${namebot} | Advanced AI Bot`,
            body: `Experience futuristic automation with ${namebot}.`,
            sourceUrl: `https://fkteam.renvy.my.id`,
            thumbnailUrl: thumb,
          },
        },
      },
      { quoted: fkontak }
    );
  }
};

handler.help = ["menu", "allmenu"];
handler.tags = ["main"];
handler.command = ["menu", "allmenu"];
handler.register = true;

module.exports = handler;