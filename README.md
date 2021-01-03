# ANiMAGE
## これは何？
ANiMAGEはDiscordのメッセージに反応して画像を送信するBotです。

## 使用法
メッセージの後ろに指定する文字列を書くことにより、反応します。
### 反応する文字列
- gif

    - [Tenor](https://tenor.com)でGIFを検索し、ランダムに1枚を送信します。

        - Example: test gif

- 艦これ

    - 艦隊これくしょんの艦娘名を書くと艦娘カードを送信します。
期間限定グラフィックにも対応します。

        - Example: 祥鳳 艦これ, 祥鳳（梅雨mode）艦これ, 祥鳳(秋刀魚)艦これ

- アズレン, アズールレーン

    - アズールレーンのキャラクター名を書くとキャラクターの画像を送信します。
着せ替えにも対応します。

        - Example: サラトガ アズレン, ラフィー（ウサウサアイドル・てきとー）アズレン

- ホロライブ

    - ホロライブのライバーの画像を送信します。

        - Example: 戌神ころね ホロライブ, YAGOO ホロライブ

- にじさんじ

    - にじさんじのライバーの画像を送信します。

        - Example: 本間ひまわり にじさんじ

## サーバー構築
BotはNode.jsで動作します。動作させる際はindex.jsと同じディレクトリにsecret.jsonを作成し、次の内容を記述してください。
```json
{"key": "Discord Botトークン"}
```

また、次のモジュールが必要です。

 - https
 - jsdom
 - libxmljs
 - discord.js
 - file-type
 - promise
 - iconv-lite
 - saratoga
 - fs
