const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const { execSync } = require('child_process')
const ffmpeg = require('ffmpeg-static')

let handler = async (m, { conn }) => {

  let fitur = Object.values(global.plugins)
    .filter(v => v.help && !v.disabled)
    .map(v => v.help)
    .flat(1)

  let totalPlugin = Object.keys(global.plugins).length
  let totalCommand = fitur.length

  let categorizedHelp = Object.values(global.plugins).reduce((acc, plugin) => {
    if (plugin.tags && Array.isArray(plugin.tags)) {
      plugin.tags.forEach(tag => {
        if (!acc[tag]) acc[tag] = { commands: [], count: 0 }
        if (Array.isArray(plugin.help)) {
          acc[tag].commands.push(...plugin.help)
          acc[tag].count += plugin.help.length
        }
      })
    }
    return acc
  }, {})

  let maxKat = Math.max(...Object.values(categorizedHelp).map(v => v.count), 1)

  function bar(val, max) {
    let length = 10
    let filled = Math.round((val / max) * length)
    return '▰'.repeat(filled) + '▱'.repeat(length - filled)
  }

  let grafik = Object.keys(categorizedHelp)
    .sort((a, b) => categorizedHelp[b].count - categorizedHelp[a].count)
    .map(tag => {
      let count = categorizedHelp[tag].count
      return `> ${tag.toUpperCase().padEnd(10)} : ${bar(count, maxKat)} ${count}`
    })
    .join('\n')

  const data = {
    case: totalCommand,
    plugin: totalPlugin,
    total: totalCommand + totalPlugin
  }

  const totalFrames = 20
  const holdFrames = 20
  const tempDir = './frames'

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

  for (let i = 0; i <= totalFrames; i++) {
    let img = await createFrame(i, totalFrames, data)
    fs.writeFileSync(`${tempDir}/frame_${i}.png`, img)
  }

  for (let i = totalFrames + 1; i <= totalFrames + holdFrames; i++) {
    fs.copyFileSync(`${tempDir}/frame_${totalFrames}.png`, `${tempDir}/frame_${i}.png`)
  }

  const output = './output.mp4'

  execSync(`${ffmpeg} -y -framerate 20 -i ${tempDir}/frame_%d.png -vf "scale=900:500,format=yuv420p" ${output}`)

  let video = fs.readFileSync(output)

  await conn.sendMessage(m.chat, {
    video,
    gifPlayback: true,
    caption: `
> [+] *Dashboard Renvy Aktif*
> [-] Total Plugin: ${totalPlugin}
> [+] Total Command: ${totalCommand}

> [+] *Statistik Kategori*
${grafik}
    `.trim()
  }, { quoted: m })

  fs.rmSync(tempDir, { recursive: true, force: true })
  fs.unlinkSync(output)
}

handler.help = ['totalfitur']
handler.tags = ['info']
handler.command = ['totalfitur']

module.exports = handler


async function createFrame(frame, maxFrame, data) {

  const width = 900
  const height = 500
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const avatar = await loadImage('https://raw.githubusercontent.com/Panzqq/panzz/main/uploads/2026-03-20/RenV-22542.jpeg')

  const items = [
    { label: 'Jumlah Command', value: data.case, color: ['#22d3ee', '#3b82f6'], delay: 0 },
    { label: 'Jumlah Plugins', value: data.plugin, color: ['#facc15', '#f97316'], delay: 0.15 },
    { label: 'Total Sistem', value: data.total, color: ['#4ade80', '#22c55e'], delay: 0.3 }
  ]

  let t = frame / maxFrame

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#020617')
  bg.addColorStop(1, '#0f172a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  drawRoundRect(ctx, 40, 40, 820, 420, 25)
  ctx.fillStyle = '#111827cc'
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(100, 100, 40, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(avatar, 60, 60, 80, 80)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(100, 100, 40, 0, Math.PI * 2)
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px Sans'
  ctx.fillText('Renvy Dashboard', 160, 95)

  ctx.fillStyle = '#9ca3af'
  ctx.font = '18px Sans'
  ctx.fillText('Auto System Data...', 160, 120)

  let y = 190
  let max = Math.max(data.total, 2000)

  for (let item of items) {

    let localT = Math.max(0, Math.min(1, (t - item.delay) / (1 - item.delay)))
    let smooth = 1 - Math.pow(1 - localT, 3)

    let bounce = smooth
    if (localT > 0.9) {
      bounce += Math.sin((localT - 0.9) * Math.PI * 5) * 0.05
    }

    let value = Math.floor(item.value * bounce)

    ctx.fillStyle = '#d1d5db'
    ctx.font = '20px Sans'
    ctx.fillText(item.label, 80, y)

    ctx.fillStyle = '#fff'
    ctx.fillText(formatNumber(value), 750, y)

    drawRoundRect(ctx, 80, y + 15, 700, 18, 10)
    ctx.fillStyle = '#1f2937'
    ctx.fill()

    let barWidth = 700 * (value / max)

    const grad = ctx.createLinearGradient(80, 0, 80 + barWidth, 0)
    grad.addColorStop(0, item.color[0])
    grad.addColorStop(1, item.color[1])

    drawRoundRect(ctx, 80, y + 15, barWidth, 18, 10)
    ctx.fillStyle = grad
    ctx.fill()

    let shimmerX = (t * 900) % 900
    const shimmer = ctx.createLinearGradient(shimmerX - 120, 0, shimmerX, 0)
    shimmer.addColorStop(0, 'transparent')
    shimmer.addColorStop(0.5, '#ffffff33')
    shimmer.addColorStop(1, 'transparent')

    ctx.fillStyle = shimmer
    drawRoundRect(ctx, 80, y + 15, barWidth, 18, 10)
    ctx.fill()

    ctx.globalAlpha = 0.15
    drawRoundRect(ctx, 80, y + 15, barWidth - 20, 18, 10)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.globalAlpha = 1

    y += 90
  }

  return canvas.toBuffer()
}


function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function formatNumber(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb'
  return num.toString()
}