const fs = require('fs');
const ytdl = require('ytdl-core');
const VimeoClient = require('vimeo').Vimeo;
const config = require('./config');

const MAX_CONCURRENT = Number(process.env.CONCURRENCY) || 2;
const TMP_DIR = process.env.TMP_DIR ? `${process.env.TMP_DIR}/youtube2vimeo` : './tmp';

const vimeo = new VimeoClient(config.vimeo.clientId, config.vimeo.clientSecret, config.vimeo.accessToken);

const youtubeIdsToImport = fs.readFileSync(config.importFile).toString()
	.split('\n')
	.map(e => e.trim())
	.filter(e => e);
const mapper = {};
const errors = [];
let currentCount = 0;

async function getVideoInfo(url) {
	const videoInfo = await ytdl.getBasicInfo(url);
	return {
		author : videoInfo.player_response.videoDetails.author,
		title : videoInfo.player_response.videoDetails.title,
	}
}

function next(i) {
	currentCount--;
	transferSingleVideo(i);
}

function id(i) {
	return `[${i}/${MAX_CONCURRENT}] ${new Date().toISOString()} - `;
}

async function transferSingleVideo(i) {
	if (youtubeIdsToImport.length === 0) {
		if (currentCount === 0) {
			console.log('');
			console.log('All transfers completed');
			fs.writeFileSync('./map.json', JSON.stringify(mapper, null, 4));
			if (errors.length > 0) {
				console.warn(`${errors.length} error(s) did occur`);
			}
		}
		return;
	}
	currentCount++;

	const nextId = youtubeIdsToImport.shift();
	const url = `http://www.youtube.com/watch?v=${nextId}`;

	console.log(`${id(i)}Now getting video ${nextId}`);
	try {
		const videoInfo = await getVideoInfo(url);
		console.log(`${id(i)}Got video data for ${nextId}`);
		const stream = ytdl(url, {
			filter : 'audioandvideo',
			quality : 'highest'
		}).pipe(fs.createWriteStream(`${TMP_DIR}/${nextId}.mp4`));
		stream.on('finish', () => {
			console.log(`${id(i)}Got video file for ${nextId}`);
			// File fetched, now upload to vimeo

			// TODO perform upload here

			mapper[nextId] = {
				success: true,
				vimeoId: '?',
				title: videoInfo.title,
				author: videoInfo.author,
			};

			// After upload, continue with the next item
			next(i);
		});
	} catch (e) {
		// Video is not available
		errors.push(nextId);
		mapper[nextId] = {
			success: false,
		};

		next(i);
	}
}

async function start() {
	try {
		fs.mkdirSync(TMP_DIR);
		console.log('Created temporary directory');
	} catch (e) {
		console.log('Temporary directory already created');
	}

	const files = fs.readdirSync(TMP_DIR);
	files.forEach(file => fs.unlinkSync(`${TMP_DIR}/${file}`));
	console.log('Temporary directory cleared');

	console.log(`${youtubeIdsToImport.length} will be transferred`);
	console.log('');

	// Start max "threads"
	for (let i = 1; i <= MAX_CONCURRENT; i++) {
		transferSingleVideo(i);
	}
}

start();