import { spawn } from 'node:child_process'

const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg'

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegBin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', (err) => {
      reject(
        new Error(
          `Failed to start ffmpeg (${ffmpegBin}): ${err.message}. Install ffmpeg or set FFMPEG_PATH.`,
        ),
      )
    })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`))
    })
  })
}

export async function trimVideo({ input, output, startSec, endSec }) {
  const args = ['-y', '-ss', String(startSec)]
  if (endSec != null) {
    const duration = Math.max(0.05, endSec - startSec)
    args.push('-t', String(duration))
  }
  args.push(
    '-i',
    input,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    output,
  )
  await runFfmpeg(args)
}

export async function exportVideo({ input, output, format }) {
  if (format === 'webm') {
    await runFfmpeg([
      '-y',
      '-i',
      input,
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '1M',
      '-c:a',
      'libopus',
      output,
    ])
    return
  }
  await runFfmpeg([
    '-y',
    '-i',
    input,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    output,
  ])
}
