# PairBloom

[Türkçe](#türkçe) · [English](#english) · [MIT](LICENSE)

## Türkçe

### Amaç

PairBloom, Discord çalışma toplulukları için **gönüllü çalışma arkadaşı eşleştirme botudur**. İngilizce konuşma pratiği, kitap tartışması veya kısa bir kod çalışma buluşması için üyeler bir panoya kendileri katılır. Yönetici onaylı rastgele eşleştirmeden sonra herkes yalnızca kendi eşini özel Discord yanıtında görür. Herkese açık kartta adlar veya katılımcı kimlikleri yerine sadece toplam sayı gösterilir.

Bu proje gerçek bir Discord Gateway botudur. GitHub Actions yalnızca kodu kontrol eder; botu barındırmaz. Kullanım için kendi Discord uygulamanız, tokenınız ve açık kalan bir bilgisayar veya sunucu gerekir. Depoyu indirmek tek başına botu çevrimiçi yapmaz.

### Özellikler ve sınırlar

- `/pairbloom`: **Sunucuyu Yönet** yetkisine sahip kişi konuyu forma yazar, özel önizlemeyi inceler ve **Yayımla** düğmesine basar. Form ve önizleme 10 dakika geçerlidir.
- Üyeler **Katıl**, **Ayrıl** ve **Eşim** düğmelerini kullanır. Katılmak, Discord kimliğinizin atanacak eşinizle paylaşılmasına onay vermektir. Başkası adına katılım yoktur.
- Yönetici **Eşleştir** düğmesini kullanır, özel onayı inceler ve onaylar. Önizleme sonrasında katılım değişirse eşleştirme yapılmaz; yeniden önizlemek gerekir. Onaylar 2 dakika geçerlidir.
- Node.js kriptografik rastgele sayı kaynağı ile Fisher–Yates karıştırması kullanılır. Bir kişi kendisiyle eşleştirilmez. Tek sayıda katılımcı varsa bir kişi eşsiz kalır. Geçmiş eşleri hatırlama, beceri/yaş eşleştirmesi ve yeniden eşleştirme yoktur.
- Eşleştirme sonrası yeni katılım kapanır. **Ayrıl** hâlâ çalışır: kişinin kaydı ve eşindeki bağlantısı silinir. Kalan eş otomatik başka biriyle eşleştirilmez; **Eşim** ile güncel duruma bakmalıdır.
- **Kapat** ayrıca özel yönetici onayı ister; katılım listesini siler. Yeni tur için yeni pano oluşturun.
- Bir yapılandırılmış sunucu, aynı anda bir pano, en fazla 30 kişi, 8 saatlik pano ömrü. Geçici önizleme/onay sayısı en fazla 100; kullanıcı bekleme kayıtları en fazla 2000. Birden fazla bot süreci desteklenmez.
- Bot mesajları okumaz, DM göndermez, ses kanalına girmez, rol vermez, moderasyon yapmaz, yoklama tutmaz, dosya veya URL indirmez. Veritabanı, analiz servisi, reklam ve ücretli API yoktur.

### Gereksinimler

1. [Node.js 24 LTS](https://nodejs.org/en/download), en az 24.13.0 ve 25'ten küçük sürüm; npm birlikte gelir.
2. Kurulum iznine sahip olduğunuz bir Discord sunucusu; panoyu açan kişide **Sunucuyu Yönet** yetkisi.
3. İnternet bağlantısı; Discord HTTPS ve Gateway WebSocket erişimi.
4. Windows, macOS veya Linux ve bot çalıştığı sürece açık kalan terminal/host.

### Developer Portal ve kurulum

1. Bu GitHub sayfasında **Code → Download ZIP** seçin. ZIP'i çıkarın. Windows'ta klasörü OneDrive/ortak paylaşım dışında, yalnızca hesabınızın eriştiği bir yerde tutmanız token gizliliği açısından daha uygundur.
2. [Discord Developer Portal](https://discord.com/developers/applications) sayfasında **New Application** ile kendi uygulamanızı oluşturun. **General Information** bölümünden **Application ID** değerini kopyalayın.
3. **Bot** bölümünde bot kullanıcısını oluşturun veya mevcut botu kullanın. **Reset Token** ile tokenı alın. Token bir paroladır: ekran görüntüsü, sohbet, GitHub issue veya commit içinde paylaşmayın. Sızıntıda hemen aynı sayfadan sıfırlayın.
4. **Privileged Gateway Intents** altındaki Presence, Server Members ve Message Content seçeneklerini **kapalı** tutun. Uygulama **Interactions Endpoint URL** kullanmaz; bu alanı boş bırakın.
5. Discord'da **User Settings → Advanced → Developer Mode** açın. Sunucu simgesine sağ tıklayıp **Copy Server ID** seçin.
6. Windows'ta `setup.cmd` dosyasına çift tıklayın. macOS/Linux'ta çıkarılmış klasörde terminal açıp `bash setup.sh` çalıştırın. Node.js bulamazsa resmi LTS sürümünü kurup terminali yeniden açın. macOS güvenlik uyarısı verirse indirdiğiniz dosyayı gözden geçirerek Terminal'de komutu kendiniz çalıştırın.
7. Yardımcı, kilit dosyasındaki bağımlılıkları kurar, kaynakları derler; Application ID ve Server ID sorar. Token girişi **görünmez**, yıldız da çıkmaz. Tokenı yapıştırıp Enter'a basın. Token konsola yazdırılmaz. `.env` dosyası otomatik oluşturulur; kaynak kod düzenlemeniz gerekmez. Var olan `.env` üzerine yazılmaz.
8. Ekrandaki Discord kurulum bağlantısını açın. Doğru sunucuyu seçip yalnızca **Kanalı Gör** ve **Mesaj Gönder** izinlerini onaylayın. Discord'un Installation bölümünü kullanırsanız **Guild Install**, `bot` ve `applications.commands` kapsamlarını, aynı iki bot iznini seçin. User Install gerekli değildir.
9. Normal bir metin kanalında botun iki izne de sahip olduğundan emin olun. Üyelere kanal erişimi ve **Use Application Commands** izni verin; panoyu açacak kişiye **Sunucuyu Yönet** yetkisi verin. Bota bu yönetici yetkisini vermeyin.
10. Windows'ta `register.cmd` çalıştırın. macOS/Linux'ta aynı klasörde `npm run register` çalıştırın. Bu işlem yalnızca bu uygulamanın bu sunucudaki `/pairbloom` komutunu adına göre ekler/günceller; diğer komutları topluca silmez.
11. Windows'ta `start.cmd`, macOS/Linux'ta `bash start.sh` çalıştırın. `PairBloom connected` mesajını bekleyin. Discord'da `/pairbloom` kullanın. Pano yalnızca **normal metin kanallarında** çalışır; DM, forum, thread, duyuru veya ses kanalı desteklenmez.

Terminal tercih edenler için, ZIP klasörünün içinde aynı adımlar:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
# Gösterilen bağlantı ile önce sunucuya kurun.
npm run register
npm start
```

### Yapılandırma ve güncelleme

Yardımcı `.env` içine üç değer yazar: `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID`. Boş örnek `.env.example` açıklama içindir. Token biçimi kontrolü tokenın geçerli olduğuna kanıt değildir; bunu Discord bağlantısı belirler. Başka yapılandırma, veritabanı veya kaynak düzenlemesi gerekmez.

Yeniden yapılandırmak için botu Ctrl+C ile durdurun. Kendi `.env` dosyanızı güvenli şekilde kaldırıp `npm run setup` çalıştırın. Sızan tokenı önce Portal'dan sıfırlayın. Windows'ta dosya/klasör izinlerini yalnızca hesabınızla sınırlayın; POSIX'te yardımcı `.env` için `0600` ister. Disk yedekleri ve senkronizasyon servisleri tokenı kopyalayabilir; işletmeci bunları yönetmelidir. `.env` Git tarafından yok sayılır, ancak ZIP/yedek araçları otomatik korumayabilir.

Güncellerken botu durdurun, yeni sürümü ayrı klasöre çıkarın, gizli `.env` dosyanızı yalnızca kendi yeni klasörünüze güvenli şekilde taşıyın ve `npm ci --ignore-scripts`, `npm run build`, `npm run register` çalıştırın. Aynı tokenla iki süreç açmayın. Yeniden başlatma eski panonun katılımını kurtarmaz.

### Kullanım ve botu açık tutma

Yönetici `/pairbloom` → konu → özel önizleme → **Yayımla** akışını izler. Üyeler açıklamayı okuyup **Katıl** kullanır. Yönetici en az iki kişi olduğunda **Eşleştir → Onayla** seçer. Her üye **Eşim** ile yalnızca kendi eşini görür. Bot bildirim veya DM göndermez; iletişim kurma kararı üyelerdedir ve karşılıklı rıza gerekir. Eşinizin güncel katılımını kontrol etmeden iletişim kurmayın. Bir katılımcı ayrıldıysa eski özel yanıtların içeriği değişmez.

Terminali kapatmak, bilgisayarı uyutmak veya hostu durdurmak botu çevrimdışı yapar. Küçük topluluk için açık kalan bilgisayar yeterli olabilir; sürekli kullanımda güvendiğiniz Node.js 24 hostunda **tek** `npm start` süreci çalıştırın. Hostun gizli değişken arayüzü aynı üç değişkeni `.env` yerine sağlayabilir. Otomatik yeniden başlatma panoyu geri getirmez. GitHub Actions çalışma ortamını kalıcı barındırma için kullanmayın. Ctrl+C ile durdurabilirsiniz. İnternet kesintisinde Discord istemcisi yeniden bağlanmayı dener; süreç yeniden başladıysa yeni pano gerekir.

### İzinler

Bot: **View Channel (1024)** + **Send Messages (2048)**, toplam `3072`. Intent: yalnızca **Guilds** (ayrıcalıklı değil). Administrator, Manage Server, Read Message History, Message Content, Manage Messages, Embed Links, Manage Roles, Connect/Speak istenmez. Mesajlar düz metindir; etiket bildirimleri ve bağlantı önizlemeleri kapalıdır. Bot yalnızca kendi kartını kimliğiyle günceller, kanal geçmişini okumaz. Yönetici yetkileri her yeni etkileşimde Discord'un verdiği güncel izinlerden kontrol edilir; komut görünürlüğü tek başına güvenlik sınırı sayılmaz.

### Güvenlik ve gizlilik

- Panonun konusu, katılımcı sayısı ve bitiş bilgisi kanal üyelerine açıktır. Konuya hassas bilgi yazmayın. Konu 3–80 düz karakterdir; bağlantı, etiket ve biçimlendirme kabul edilmez.
- Katılan üyelerin Discord kimlikleri ve eş haritası yalnızca süreç RAM'inde tutulur. Eş sorgusunda yalnızca istekte bulunan kişinin eşi gösterilir. İsim, mesaj, iletişim adresi veya kimlik belgesi toplanmaz. Üyelerin kimlikleri bot operatörü/host tarafından RAM incelemesiyle görülebilir; Discord da etkileşimleri ve yanıtları işler. Özel yanıt uçtan uca şifreli veya Discord'dan gizli değildir.
- **Ayrıl** kişinin katılımını ve eş bağlantısını siler. **Kapat**, süre dolması veya yeniden başlatma tüm eşleştirme verisini kaldırır. Periyodik temizlik dakikada bir çalışır; boşta kalmış süresi dolan veri en fazla bir dakika daha RAM'de kalabilir. Her etkileşimden önce süre kontrol edilir. RAM silme, fiziksel bellek/swap adli silme garantisi değildir.
- Kısa bekleme anahtarları aktör kimliği içerir: düğmeler için 3 saniye, form için 10 saniye; dakikalık temizlikte kaldırılır. Önizlemeler oluşturucunun kimliğini, sunucu/kanal kimliklerini ve konuyu geçici tutar. Panoda sunucu/kanal/mesaj kimlikleri bulunur. Uygulama veriyi diske yazmaz; yalnızca kurulum sırrı `.env` dosyasıdır. Telemetri yoktur. Günlükler tokenları, etkileşim içeriklerini veya katılımcı listesini yazmaz.
- Discord'daki herkese açık kart ve önceden gönderilmiş özel yanıtlar, RAM kaydı silinse de Discord'da kalabilir. Bot özel yanıtları geri çağırmaz. Eşinizin ayrılması daha önce gördüğünüz kimliği unutturamaz; ekran görüntüsü alınması da engellenemez. Eski herkese açık kartı yetkili bir kişi elle silebilir.
- Rastgele, kullanıcı/sunucu/kanal bağlı, süreli tek kullanımlık önizlemeler; kartın kendi botundan ve doğru mesajdan geldiği kontrolü; işlem kilidi ve yetki tekrar kontrolü kullanılır. Form açılışları kişi başına 10 saniye, düğmeler kişi başına 3 saniye, yayınlar sunucu başına bir dakika ile sınırlandırılır.
- Herkese açık kart düzenlemeleri en fazla iki saniyede bir denenir. Hızlı katılım veya Discord hatası sonucunda görünen sayı gecikebilir; kabul edilen katılım bellekte kalır. Sonraki uygun değişiklik sayıyı yeniler; **Eşim** güncel durumu gösterir. Otomatik arka plan düzenleme kuyruğu yoktur.
- Gönderim sonucu ağda belirsiz kalırsa tek kullanımlık önizleme tekrar gönderilmez. Sahipsiz bir kart Discord'da kalmış olabilir; yönetici kontrol edip eski kartı elle silmelidir. Ayrılma/kapatma, kart düzenlenemese de bellekteki veriyi siler. Discord'a özel yanıt da gönderilemezse kullanıcıya hata bildirimi ulaşmayabilir.
- Bot uygunluğu, güvenilirliği, yaşı veya güvenliği doğrulamaz. Topluluk yöneticileri kendi kurallarını ve insan incelemesini uygular. İstenmeyen iletişimde Discord'un engelleme/raporlama araçlarını kullanın. Otomatik DM/etiket veya zorunlu eşleştirme yoktur.

### Sorun giderme

- **Node/npm bulunamadı:** Node.js 24 LTS kurun, terminali yeniden açın; `node --version` kontrol edin.
- **Komut görünmüyor:** Önce botu doğru sunucuya kurun, sonra `register.cmd` veya `npm run register` çalıştırın. Application ID/Server ID karışmadığını, komutu açan kişinin Sunucuyu Yönet ve kanal komut iznini kontrol edin. Discord istemcisini yenileyin.
- **Bağlanılamadı:** Tokenı kimseye göstermeden Portal'dan yenileyin, yapılandırmayı yeniden oluşturun; ağın Discord HTTPS/WebSocket bağlantılarını engellemediğini kontrol edin. Ayrıcalıklı intents açmayın.
- **Pano yok / süre doldu:** Sekiz saat, yeniden başlatma veya kapatma sonrası eski düğmeler çalışmaz. Eski kartı silip yeni pano açın. Durum kalıcı değildir.
- **Katılım değişti:** Eşleştirme önizlemesi ile onay arasındaki katılım değişikliği normaldir; yeniden Eşleştir kullanın. Çift tıklamalar yerine özel sonucu bekleyin.
- **Eşim yok:** Katılmamış, tek sayıda eşsiz kalmış veya eşiniz ayrılmış olabilir. Yönetici yeni tur açabilir; mevcut tur yeniden karıştırılmaz.
- **İzin / sayı güncellenmedi:** Normal metin kanalı kullanın; botun Kanalı Gör ve Mesaj Gönder izinlerini/kanal istisnalarını düzeltin. Eşim ile kişisel duruma bakın. Kart güncellenemiyorsa yönetici kapatıp eski kartı elle silebilir.
- **Yoğun / bekleyin:** Bir Discord isteği sürüyor veya hız sınırı etkin; birkaç saniye bekleyin. Art arda tıklamak yerine tek sonuç bekleyin. Süreli önizleme tüketildiyse yeni akış açın.
- **.env mevcut:** Yardımcı güvenlik için üzerine yazmaz. Botu durdurun, dosyayı kendi bilgisayarınızda güvenli biçimde kaldırın, kurulumu tekrar çalıştırın. `.env` dosyasını destek talebine eklemeyin.

### Testler ve doğrulama

Geliştirme kontrollerini **gerçek `.env` oluşturmadan önce** temiz kaynak klasöründe çalıştırın:

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-supply.mjs
bash -n setup.sh start.sh
```

`check`: Biome önerilen kuralları ve biçimlendirme, strict TypeScript derlemesi, Node testleri, kilit dosyası lisans/kaynak/SHA-512/install-script kontrolü ve sezgisel kaynak gizli bilgi taramasını içerir. Tarama gerçek `.env` varsa onu okumadan durur; tokenı silerek test yapmayın, ayrı temiz checkout kullanın. Desen taraması bütün sırları bulma garantisi değildir. CI aynı kontrolleri Ubuntu, Windows ve macOS Intel üzerinde salt-okunur GitHub izniyle çalıştırır; action sürümleri commit SHA'larına sabitlenmiştir.

Testler gerçek Discord etkileşimlerinin yerine sahte bağlamlar kullanır; rıza akışı, yetki/sunucu/kanal/mesaj bağları, tek kullanımlık onay, katılım değişimi, çift tıklama, eşlerin simetrisi, tek sayıda kişi, ayrılma, süre dolması, eşzamanlı yayın, başarısız API yanıtı ve eksik yapılandırma davranışlarını sınar. Canlı Discord kurulumu, token girişinin gerçek terminal deneyimi ve mobil/ekran okuyucu kullanılabilirliği operatör tarafından ayrıca denenmelidir. Otomatik kontrollerin geçmesi canlı kurulumun yapıldığı anlamına gelmez.

### Katkı ve lisans

[CONTRIBUTING.md](CONTRIBUTING.md) ve [SECURITY.md](SECURITY.md) belgelerini okuyun. Yeni özelliklerde en az yetki, gönüllülük, küçük veri sınırları ve iki dilde anlaşılır akışları koruyun. MIT lisansı: [LICENSE](LICENSE). Garanti verilmez; bağımlılıklar kendi lisanslarını korur.

## English

### Purpose

PairBloom is a real Discord Gateway bot that helps study communities find **voluntary study partners**. Members join a topic board themselves. An organizer previews and confirms a random draw; each participant can privately look up only their own partner. The public board shows counts rather than participant identities. Useful for conversation practice, book discussions or short coding sessions.

GitHub Actions checks this project; it does not host the bot. You need your own Discord application, secret bot token and an always-on Node.js process. Downloading the source does not bring a hosted bot online.

### Features and limits

- Manage Server members use `/pairbloom`, enter a topic in a form and explicitly publish a private preview. Form and publication tickets expire after 10 minutes.
- Members use **Join**, **Leave** and **My partner**. Joining consents to sharing your Discord ID with your assigned partner. Nobody can enroll someone else.
- Managers privately preview and confirm **Draw**. A roster change invalidates the preview, requiring a fresh confirmation. Draw/close confirmations expire after two minutes.
- Fisher–Yates shuffle uses Node's cryptographic random source. No self-pairs; odd rosters leave one person unmatched. There is no matching by skill or age, previous-partner memory, or repeat draw on an existing board.
- Drawing ends new enrollment. Leaving still erases your entry and unmatches your former partner without assigning a replacement. Members should check their latest status before contacting anyone.
- **Close** requires a separate private manager confirmation and erases the roster. Start a new board for another round.
- One configured server, one active board, 30 volunteers, eight-hour lifetime. At most 100 pending tickets and 2000 short-lived actor cooldown entries. Run only one process per token.
- No DMs, message reading, voice access, role changes, automatic moderation, attendance tracking, URL fetching, database, telemetry, ads or paid API.

### Requirements

Install [Node.js 24 LTS](https://nodejs.org/en/download), version 24.13.0 or newer within major 24, including npm. You need a Discord server you can install applications into, Manage Server permission to publish boards, HTTPS/WebSocket internet access and a Windows/macOS/Linux computer or host that stays awake.

### Developer Portal and installation

1. Choose **Code → Download ZIP** on this repository and extract it. Use a private folder; avoid shared/synchronized locations for the real token file.
2. Open [Discord Developer Portal](https://discord.com/developers/applications), create **New Application** and copy its **Application ID** from General Information.
3. In **Bot**, create/use the bot user and obtain its token with **Reset Token**. Treat the token as a password. Never include it in screenshots, chat, GitHub issues or commits. Reset it immediately if exposed.
4. Leave Presence, Server Members and Message Content **privileged intents off**. This Gateway application does not use an **Interactions Endpoint URL**; leave that field empty.
5. Enable Discord **User Settings → Advanced → Developer Mode**, then right-click your server icon and choose **Copy Server ID**.
6. On Windows double-click `setup.cmd`. On macOS/Linux open a terminal in the extracted folder and run `bash setup.sh`. If Node is missing, install the official LTS version and reopen the terminal. If macOS blocks downloaded helpers, inspect them and run the command yourself from Terminal.
7. Setup installs locked dependencies, compiles the source and asks for Application ID, Server ID and token. Token entry is hidden, without asterisks. Paste and press Enter. It writes `.env` automatically and will never overwrite an existing file; no source-code edits required.
8. Open the installation link it prints, select your server and authorize only **View Channel** and **Send Messages**. Alternatively use Portal **Installation → Guild Install**, scopes `bot` and `applications.commands`, with those two bot permissions. User Install is unnecessary.
9. Ensure both bot permissions are allowed in a **regular text channel**. Members need channel access and Use Application Commands; organizers need Manage Server. Do not grant Manage Server or Administrator to the bot.
10. Windows: run `register.cmd`. macOS/Linux: run `npm run register` in the project folder. This upserts only this application's `/pairbloom` guild command by name; it does not replace the entire command collection.
11. Windows: `start.cmd`. macOS/Linux: `bash start.sh`. Wait for `PairBloom connected`, then use `/pairbloom` in Discord. DMs, announcement channels, voice channels, forums and threads are unsupported.

Equivalent terminal commands in the extracted folder:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
# Install into your server using the printed link first.
npm run register
npm start
```

### Configuration and upgrades

Setup stores `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` and `DISCORD_GUILD_ID` in `.env`. `.env.example` is an empty reference. Format validation cannot establish token validity; Discord login does that. There are no other required settings or source edits.

To reconfigure, stop with Ctrl+C, privately remove your own `.env`, then run `npm run setup`. Reset a leaked token in the Portal first. Restrict Windows folder/file access to your account; on POSIX setup requests file mode `0600`. The operator controls disk backups, synchronization and host permissions. Git ignores `.env`; archive/backup tools might still include it.

For upgrades, stop the bot, extract the new source separately, transfer your own `.env` privately and run `npm ci --ignore-scripts`, `npm run build`, `npm run register`. Never run two processes on the same token. Restarting cannot recover the old board.

### Usage and keeping it online

Organizer: `/pairbloom` → topic → private preview → **Publish**. Members read the consent notice and **Join**. Once two or more volunteers have joined, organizer: **Draw → Confirm**. Each member uses **My partner** privately. The bot sends no notifications or DMs. Contact requires mutual consent; check the latest status first. Leaving cannot modify previously received private replies.

Closing the terminal, sleeping the computer or stopping the host makes the bot unavailable. For continuous operation use a trusted Node.js 24 host with exactly one `npm start` process and the same three secret environment variables (which may replace `.env`). Configure host restarts if needed, understanding that each process restart loses the board. GitHub Actions is not permanent bot hosting. Ctrl+C stops locally. The Discord client attempts reconnection after transient network loss; a restarted process needs a new board.

### Permissions

Bot permissions: **View Channel (1024)** and **Send Messages (2048)**, combined `3072`. Only the nonprivileged **Guilds** intent is enabled. No Administrator, Manage Server, Message Content, Read Message History, Manage Messages, Embed Links, Manage Roles, Connect or Speak. Responses are plain text with mention notifications and link previews suppressed. The bot edits only its own known card by ID; it never reads channel history. Organizer permission is checked from Discord's current interaction permissions on every action, including final confirmations.

### Security and privacy

- Topic, count and expiry are public to channel viewers; do not put sensitive information in topics. Titles allow 3–80 plain characters with no links, mentions or formatting.
- Volunteer Discord IDs and pair mappings stay in process RAM. Lookup reveals only the requesting member's partner. No names, messages, email addresses or identity documents are collected. The operator/host can inspect RAM; Discord processes interactions and replies. Ephemeral responses are not end-to-end encrypted or hidden from Discord.
- Leave erases your roster entry and corresponding partner link. Close, expiry and restart discard all pair data. Cleanup runs each minute, so idle expired entries can remain for up to another minute; each interaction checks expiry first. Logical RAM deletion is not a forensic memory/swap erasure guarantee.
- Actor IDs appear in brief cooldown keys: three seconds for buttons, ten for form opening, removed on minute cleanup. Pending tickets temporarily store owner/server/channel IDs and topics; the board stores server/channel/message IDs. No application data is written to disk; only setup credentials are stored in `.env`. There is no telemetry. Logs exclude tokens, interaction payloads and participant lists.
- Public cards and previously sent ephemeral replies may remain on Discord after RAM deletion. The bot does not recall private replies, erase someone's memory of a partner ID or prevent screenshots. An authorized person can manually delete old public cards.
- Random expiring one-use tickets bind owner/server/channel. Public buttons bind the current board message and bot author, excluding webhook copies. A write lock prevents concurrent publication/draw mutations. Form opens are limited to one per user/10 seconds, clicks to one per user/3 seconds, publication to one/server/minute.
- Public edits are attempted at most every two seconds. Counts can lag during rapid joins or Discord failures; accepted state remains in memory. The next eligible change refreshes the card; My partner shows authoritative personal status. No background edit queue is created.
- An uncertain send result consumes the ticket to avoid automatic duplicate publication; an orphaned card may need manual removal. Leave/close erase RAM records even if editing the card fails. If Discord also rejects the private reply, the user may receive no error response.
- The bot does not verify identity, suitability, age or trustworthiness. Community rules and human review still apply. Use Discord's block/report tools for unwanted contact. There are no automatic DMs, pings or forced enrollment.

### Troubleshooting

- **Node/npm missing:** install Node 24 LTS, reopen terminal and check `node --version`.
- **Command missing:** install into the correct server before registration, verify application/server IDs, organizer Manage Server permission and channel command permissions, run register again and refresh Discord.
- **Login failed:** privately reset the bot token and reconfigure; check Discord HTTPS/WebSocket network access. Do not enable privileged intents.
- **Board unavailable:** expiry, closure or restart ended it. Remove the old card manually and publish a new board. State is intentionally temporary.
- **Roster changed:** someone joined/left after draw preview. Preview again; wait for the result rather than double clicking.
- **No partner:** you did not join, an odd roster left you unmatched, or your partner left. Ask the organizer for a new round; there is no reroll.
- **Permissions/count update failed:** restore the two bot permissions and channel overrides in a regular text channel. My partner shows current personal status. Managers can close and manually delete stale cards.
- **Busy/wait:** another Discord request is saving or a cooldown applies. Wait a few seconds. Consumed/expired previews require starting the corresponding flow again.
- **.env exists:** stop the bot and privately remove your own file before reconfiguration. Never attach it to a support request.

### Tests and validation

Run in a clean source folder **before creating a real `.env`**:

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-supply.mjs
bash -n setup.sh start.sh
```

`check` runs recommended Biome rules/formatting, strict TypeScript, Node tests and lockfile license/registry/SHA-512/no-install-script plus heuristic source credential-pattern checks. The scanner refuses real `.env` files before reading them: use a separate clean checkout rather than deleting production secrets to test. Patterns cannot find every possible secret. Read-only, SHA-pinned GitHub Actions runs these checks on Ubuntu, Windows and macOS Intel.

Tests use mock interaction contexts, covering consent flow, actor/server/channel/message binding, one-use tickets, roster changes, duplicate clicks, symmetric pairs, odd rosters, withdrawal, expiry, concurrent publication, failed API operations and missing configuration. Live Discord installation, hidden token entry in an actual terminal, mobile and screen-reader usability require operator validation. Passing automated checks does not mean a live installation was tested.

### Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Preserve minimal permissions, consent, bounded data and understandable bilingual flows. Licensed under [MIT](LICENSE); no warranty. Dependencies retain their own licenses.

### Official references / Resmî kaynaklar

- [Discord interaction responses and deadlines](https://docs.discord.com/developers/interactions/receiving-and-responding)
- [Discord components, including Label modals](https://docs.discord.com/developers/components/reference)
- [Application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Gateway](https://docs.discord.com/developers/events/gateway) and [permissions](https://docs.discord.com/developers/topics/permissions)
- [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)
