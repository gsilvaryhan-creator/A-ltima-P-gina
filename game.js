// Configuração básica do jogo para Celular (Modo Paisagem)
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Variáveis Globais do Jogo
let player;
let cursors;
let platforms;
let enemies;
let pages;
let pageCount = 0;
let lives = 7;
let hudText;
let dialogueText;
let dialogueBox;
let isDialogueActive = false;

// Banco de Textos (Substitua as frases entre aspas pelas memórias reais de vocês!)
const phrases = {
    phase1: "FRASE 1: Coloque aqui a sua primeira memória marcante...",
    phase2: "FRASE 2: Coloque aqui a sua segunda memória marcante...",
    phase3: "FRASE 3: Coloque aqui a sua terceira memória marcante..."
};

function preload() {
    // Carregando imagens gratuitas da internet para o jogo funcionar imediatamente sem dar erro de arquivo sumido
    this.load.image('sky_sunset', 'https://labs.phaser.io/assets/skies/space3.png'); 
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png'); 
    this.load.image('page', 'https://labs.phaser.io/assets/sprites/wabbit.png'); 
    this.load.spritesheet('sofia', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 }); 
    this.load.image('pombo', 'https://labs.phaser.io/assets/sprites/baddie.png'); 
}

function create() {
    // 1. Fundo do Cenário
    this.add.image(400, 225, 'sky_sunset').setDisplaySize(800, 450);

    // 2. Criação das Plataformas (Telhados)
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 430, 'ground').setScale(2).refreshBody(); 
    platforms.create(250, 300, 'ground'); 
    platforms.create(600, 220, 'ground'); 

    // 3. Configuração da Sofia (Jogador)
    player = this.physics.add.sprite(50, 300, 'sofia');
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);

    // Configurando animações temporárias baseadas na folha de testes
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('sofia', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'sofia', frame: 4 } ],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('sofia', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // 4. Criação das Duas Páginas da Fase 1
    pages = this.physics.add.group();
    pages.create(250, 250, 'page'); // Página no meio da fase
    pages.create(700, 150, 'page'); // Página no fim da fase

    // 5. Criação do Inimigo (Pombo)
    enemies = this.physics.add.group();
    let pombo = enemies.create(550, 180, 'pombo');
    pombo.setCollideWorldBounds(true);
    pombo.setVelocityX(-50); 

    // 6. Configuração das Colisões e Interações do Jogo
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.overlap(player, pages, collectPage, null, this);
    this.physics.add.overlap(player, enemies, takeDamage, null, this);

    // 7. Interface de Usuário (Barra de Vidas e Páginas no topo)
    hudText = this.add.text(16, 16, `🐾 Vidas: 7 | 📖 Páginas: 0/6`, { fontSize: '20px', fill: '#fff', fontFamily: 'Arial' });

    // 8. Caixa de Diálogo Oculta (Estilo RPG)
    dialogueBox = this.add.graphics();
    dialogueBox.fillStyle(0x000000, 0.85);
    dialogueBox.fillRect(50, 280, 700, 140).setVisible(false);
    dialogueText = this.add.text(70, 300, '', { fontSize: '16px', fill: '#fff', wordWrap: { width: 660 }, fontFamily: 'Arial' }).setVisible(false);

    cursors = this.input.keyboard.createCursorKeys();
    
    // Dispara a introdução falada pela Sofia assim que o jogo inicia
    showDialogue("SOFIA: Eu estava tirando meu cochilo da tarde quando um vento danado abriu a janela! Ele levou embora as páginas do diário da mamãe Tainá e do papai Ryhan... São as memórias que os dois construíram juntos! Eu preciso recuperar cada folha antes que a mamãe acorde!");
}

function update() {
    // Se houver uma mensagem na tela, congela a movimentação da personagem
    if (isDialogueActive) {
        player.setVelocityX(0);
        player.anims.play('turn');
        
        // Avança ou fecha a caixa de texto ao clicar/tocar em qualquer parte da tela
        if (this.input.activePointer.isDown) {
            hideDialogue();
        }
        return;
    }

    // Gerenciador de Controles por toque (Tocar no lado esquerdo ou direito da tela do celular)
    if (cursors.left.isDown || (this.input.activePointer.isDown && this.input.activePointer.x < 300)) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown || (this.input.activePointer.isDown && this.input.activePointer.x > 500)) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    // Pulo (Seta para cima ou tocar na parte superior da tela do celular)
    if ((cursors.up.isDown || (this.input.activePointer.isDown && this.input.activePointer.y < 200)) && player.body.touching.down) {
        player.setVelocityY(-350);
    }

    // Inteligência Artificial do Inimigo (Faz o inimigo dar meia volta se trombar em algum obstáculo)
    enemies.children.iterate(function (child) {
        if (child.body.blocked.left) {
            child.setVelocityX(50);
        } else if (child.body.blocked.right) {
            child.setVelocityX(-50);
        }
    });
}

// Lógica de Coleta de Páginas
function collectPage(player, page) {
    page.disableBody(true, true);
    pageCount += 1;
    hudText.setText(`🐾 Vidas: ${lives} | 📖 Páginas: ${pageCount}/6`);

    if (pageCount === 1) {
        showDialogue("SOFIA: Hum... o papai Ryhan escreveu algo aqui...");
    } else if (pageCount === 2) {
        showDialogue(`${phrases.phase1}\n\nSOFIA: Essa parte do diário fala sobre quando tudo começou... Como o papai e a mamãe eram fofos! Mais o vento levou o resto para as nuvens, preciso continuar subindo!`);
    }
}

// Lógica de Dano e Invencibilidade Temporária
function takeDamage(player, enemy) {
    if (player.alpha < 1) return; // Se a personagem estiver invisível/piscando, ignora o dano

    lives -= 1;
    hudText.setText(`🐾 Vidas: ${lives} | 📖 Páginas: ${pageCount}/6`);

    if (lives <= 0) {
        // Reinicia a fase sem dar game over frustrante para ela
        lives = 7;
        pageCount = 0;
        this.scene.restart();
    } else {
        // Aplica o efeito de piscar (Fica imune por 1.5 segundos)
        player.alpha = 0.5;
        this.time.addEvent({
            delay: 1500,
            callback: () => { player.alpha = 1; },
            loop: false
        });
    }
}

// Controladores Visuais de Texto (Estilo RPG clássico)
function showDialogue(text) {
    isDialogueActive = true;
    dialogueBox.setVisible(true);
    dialogueText.setText(text).setVisible(true);
}

function hideDialogue() {
    isDialogueActive = false;
    dialogueBox.setVisible(false);
    dialogueText.setVisible(false);
}
