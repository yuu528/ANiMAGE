const https = require('https');
const { JSDOM }	= require('jsdom');
const libxmljs = require('libxmljs');
const Discord = require('discord.js');
const client = new Discord.Client();
const ecl = require('./ecl.js');
const filetype = require('file-type');
const promise = require('promise');
const iconv = require('iconv-lite');
const { Saratoga } = require('saratoga');
const saratoga = new Saratoga();
const fs = require('fs');

const secretKey = JSON.parse(fs.readFileSync(__dirname + '/secret.json', 'utf8'));
console.log(secretKey.key);
client.login(secretKey.key);

client.on('ready', () => {
	console.log('Login successful!');
});

client.on('message', message => {
	if(message.author.bot) {
		return;
	}

	//後ろにgifが入ってたら処理
	if(message.content.slice(-3).toLowerCase() == 'gif') {
		var query = message.content.slice(0, -3);
		var returnobj, data;
		var tmp = [], tmp2 = [];

		https.get('https://api.tenor.com/v1/search?key=884QIY32W04B&contentfilter=off&limit=20&q=' + query, (res) => {
			res.on('data', (chunk) => {
				//バッファを貯める
				tmp.push(chunk);
			}).on('end', () => {
				//バッファ展開, JSONにパース
				var e = Buffer.concat(tmp);
				var data = JSON.parse(e);

				//検索結果0の場合
				if(!data['results'].length) {
					//404のgifを探してそれを送る
					 https.get('https://api.tenor.com/v1/search?key=884QIY32W04B&contentfilter=off&limit=20&q=404 not found', (res2) => {
                        			res2.on('data', (chunk2) => {
							tmp2.push(chunk2);
						}).on('end', () => {
							var e2 = Buffer.concat(tmp2);
                                			var data2 = JSON.parse(e2);
							returnobj = data2['results'][Math.floor(Math.random() * data2['results'].length)];
							message.channel.send({files: [returnobj['media'][0]['mediumgif']['url']]});
							return;
						});
					});
				} else {
					returnobj = data['results'][Math.floor(Math.random() * data['results'].length)];
					message.channel.send({files: [returnobj['media'][0]['mediumgif']['url']]});
				}
			});
		});
	} else if(message.content.slice(-3) == '艦これ') {
		//後ろに艦これが入ってたら処理

		//空白を消した検索queryArr 0 = All, 1 = Name, 2 = (.*) or undefined
		const query = message.content.slice(0, -3).replace(/( |　)/g, '').match(/^([^(（)]+)(?:\(|（)?([^)）]*)?(?:\)|）)?$/);
		var url, imgUrl = null, sendMsg = '';
		var tmp = [];

		//期間限定グラフィックの場合はURL変更 ex. 山風(晴れ着mode)
		if(query[2] == undefined) {
			//通常
			url = 'https://wikiwiki.jp/kancolle/%E8%89%A6%E5%A8%98%E3%82%AB%E3%83%BC%E3%83%89%E4%B8%80%E8%A6%A7';
		} else {
			//限定
			url = 'https://wikiwiki.jp/kancolle/%E8%89%A6%E5%A8%98%E3%82%AB%E3%83%BC%E3%83%89%E4%B8%80%E8%A6%A7%28%E6%9C%9F%E9%96%93%E9%99%90%E5%AE%9A%E3%82%B0%E3%83%A9%E3%83%95%E3%82%A3%E3%83%83%E3%82%AF%29';
		}

		https.get(url, (res) => {
			res.on('data', (chunk) => {
				tmp.push(chunk);
			}).on('end', () => {
				//バッファ固める
				const data = Buffer.concat(tmp).toString();
				try {
					//HTMLパース
					const xmlDoc = libxmljs.parseHtmlString(data);
					var searchResult;
					//img要素取得
					if(query[2] != undefined) {
						//限定の場合
						searchResult = xmlDoc.get('//td[text()="' + query[1] + '(' + query[2].toLowerCase() + ')"]//img');
					} else {
						//通常
						searchResult = xmlDoc.get('//td[text()="' + query[1] + '"]//img');
					}

					if(searchResult == null) {
						//取得失敗
						//modeを付けてリトライ
						searchResult = xmlDoc.get('//td[text()="' + query[1] + '(' + query[2].toLowerCase() + 'mode)"]//img');
						if(searchResult == null) {
							imgUrl = 'https://cdn.wikiwiki.jp/to/w/kancolle/NPC%E5%A8%98%E3%81%AE%E4%B8%80%E8%A6%A7/::ref/NPC_FinalBoss.png?rev=391076a44f3ea5f9f205f43d2a37a388&t=20190815143751';
							sendMsg = '見つかりませんでした！';
						} else {
							//成功
							imgUrl = searchResult.attr('src').value();
						}
					} else {
						//成功
						imgUrl = searchResult.attr('src').value();
					}
					message.channel.send(sendMsg, {files: [imgUrl]});
				} catch(e) {
					message.channel.send('データの取得に失敗しました。');
					console.error(e);
				}
			});
		});
	} else if(message.content.slice(-4) == 'アズレン' || message.content.slice(-7) == 'アズールレーン') {
		if(!saratoga.ready) {
			message.channel.send('データベースの準備中です。しばらく待ってからもう一度お試しください。');
		} else {
			//名前のみ取得したquery
			const query = message.content.replace(/(アズレン|アズールレーン| |　)/g, '');

			//分割 0 = All, 1 = Name, 2 = Mod or ''
			const extendQuery = query.match(/^([^(（改]+)(?:\(|（)?(改造?|[^)）]*)(?:\)|）)?/);
			var tmp = [];
			const shipData = saratoga.ships.searchShipByName(extendQuery[1]);
			if(shipData == null) {
				message.channel.send('データの取得に失敗しました。');
			} else {
				if(extendQuery[2] != '') {
					if(extendQuery[2].indexOf('改') != -1) {
						//改を含む場合
						if(shipData[0].item.retrofit) {
							const skin = shipData[0].item.skins.find((i) => i.name === 'Retrofit');
							message.channel.send({files: [skin.image]});
						} else {
							message.channel.send('改はまだ実装されていないキャラクターです。');
						}
					} else {
						https.get(shipData[0].item.wikiUrl + '/Gallery', (res) => {
							res.on('data', (chunk) => {
								tmp.push(chunk);
							}).on('end', () => {
								const data = Buffer.concat(tmp).toString();
								//dom解析
								try {
									const xmlDoc = libxmljs.parseHtmlString(data);
									//スキンの外国語名をスクレイピング
									const searchResult = xmlDoc.get('//table[@class="shipskin-table" and .//td[text()="' + extendQuery[2] + '"]]//tr[.//th[text()="EN Client"]]/td[1]');
									if(searchResult == null) {
										message.channel.send('データの取得に失敗しました。');
									} else {
										//スキン名からDBのURL取得
										const skinName = searchResult.text();
										const skin = shipData[0].item.skins.find((i) => i.name === skinName);
										message.channel.send({files: [skin.image]});
									}
								} catch(e) {
									console.log(e);
								}
							});
						});
					}
				} else {
					//デフォルトスキンを表示
					const skin = shipData[0].item.skins.find((i) => i.name === 'Default');
					message.channel.send({files: [skin.image]});
				}
			}
		}
	} else if(message.content.slice(-5) == 'ホロライブ') {
		const query = message.content.replace(/(ホロライブ| |　)/g, '');
		if(query.toLowerCase() == 'yagoo' || query == '谷郷元昭' || query == '谷郷') {
			message.channel.send({files: ['https://pbs.twimg.com/profile_images/1186979284319006720/gH6xdlYB.jpg']});
			return;
		}
		const encodedName = ecl.EscapeEUCJP(query + '【基本情報】');
		const url = 'https://seesaawiki.jp/hololivetv/d/' + encodedName;
		var tmp = [];

		https.get(url, (res) => {
			res.on('data', (chunk) => {
				tmp.push(chunk);
			}).on('end', () => {
				const data = iconv.decode(Buffer.concat(tmp), 'eucjp').replace(/EUC-JP/, 'utf-8');
				//dom解析
				try {
					const xmlDoc = libxmljs.parseHtmlString(data);
					const searchResult = xmlDoc.get('//div[@class="user-area"]//td/a/img');
					if(searchResult == null) {
						message.channel.send('データの取得に失敗しました。');
					} else {
						message.channel.send({files: [searchResult.attr('src').value()]});
					}
				} catch(e) {
					console.log(e);
				}
			});
		});
	} else if(message.content.slice(-5) == 'にじさんじ') {
		const query = message.content.replace(/(にじさんじ| |　)/g, '');
		var tmp = [];

		https.get('https://wikiwiki.jp/nijisanji/' + query + '/::ref/face.png', (res) => {
			res.on('data', (chunk) => {
				tmp.push(chunk);
			}).on('end', () => {
				(async () => {
					const buffer = Buffer.concat(tmp);
					const fileExt = await filetype.fromBuffer(buffer);
					if(fileExt != undefined) {
						if(fileExt.mime == 'image/png') {
							message.channel.send('', new Discord.MessageAttachment(buffer, 'image.jpg'));
						} else {
							message.channel.send('データの取得に失敗しました。');
						}
					} else {
						message.channel.send('データの取得に失敗しました。');
					}
				})();
			});
		});
	}
});
