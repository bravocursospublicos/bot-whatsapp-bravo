const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const path = require('path');

const CONFIG = {
  NOME_CURSO: process.env.NOME_CURSO || 'BRAVO - Cursos Preparatórios para carreira Policial',
  FORMS_URL: process.env.FORMS_URL || 'COLE_AQUI_SEU_LINK_DO_GOOGLE_FORMS',
  WHATSAPP_ATENDENTE: process.env.WHATSAPP_ATENDENTE || '+5515992379316',
  DATA_INICIO: process.env.DATA_INICIO || 'Em breve — Vagas limitadas!',
  LOCAL: process.env.LOCAL || 'Capão Bonito - SP',
  SALARIO: process.env.SALARIO || 'Até R$ 8.000,00',
  CURSOS: process.env.CURSOS || '• Guarda Civil Municipal (GCM)\n• QP de Soldados da PM'
};

const numeroAtendente = CONFIG.WHATSAPP_ATENDENTE.replace(/\D/g, '');
const telefoneFormatado = numeroAtendente.length >= 12
  ? `+${numeroAtendente.slice(0, 2)} ${numeroAtendente.slice(2, -4)}-${numeroAtendente.slice(-4)}`
  : CONFIG.WHATSAPP_ATENDENTE;

const MENSAGENS = {
  boasVindas: `👋 Olá! Seja bem-vindo(a) ao *${CONFIG.NOME_CURSO}*! 🟢

Eu sou o assistente virtual. Em breve um de nossos atendentes irá falar com você.

Aqui estão as informações mais procuradas:

📚 *Nossos Cursos:*
${CONFIG.CURSOS}

💰 *Salários:* ${CONFIG.SALARIO}
📍 *Local:* ${CONFIG.LOCAL}
📅 *Início:* ${CONFIG.DATA_INICIO}

👇 Digite uma opção ou pergunte:
- *inscricao* → Garantir minha vaga
- *preco* → Valores e formas de pagamento
- *data* → Quando começa
- *duvida* → Falar com alguém da equipe`,

  inscricao: `✅ *Garanta sua vaga agora!*

Acesse o formulário oficial:
🔗 ${CONFIG.FORMS_URL}

Preencha seus dados e entraremos em contato com você!\n\nVagas limitadas — não perca! 🚀`,

  preco: `💵 *Investimento e Condições*

Temos condições especiais para os primeiros inscritos! 📝

Entre em contato com nossa equipe para receber a proposta completa:
📱 ${telefoneFormatado}

Ou aguarde que logo vamos responder você! 🟢`,

  data: `📅 *Início das Aulas*\n\n🟢 ${CONFIG.DATA_INICIO}\n\nGaranta sua vaga o quanto antes — as vagas estão esgotando rápido! ⏳`,

  local: `📍 *Onde ficamos*\n\n${CONFIG.NOME_CURSO}\n${CONFIG.LOCAL}\n\n🔹 Perto do centro — fácil acesso!\n🔹 Sala de aula climatizada\n🔹 Material incluso\n\nQuer saber como chegar? Fala com a gente! 😊`,

  salario: `💰 *Remuneração*\n\n✅ GCM / PM — Salários de até *${CONFIG.SALARIO}*! 🎉\n\nÉ uma carreira de estabilidade, crescimento e realização profissional.\n\nEstá preparado(a) para servir e proteger? 🚀`,

  duvida: `📞 *Falar com nossa Equipe*\n\nEncaminhando sua solicitação... ⏳\n\nPor favor, aguarde um momento que um de nossos atendentes irá responder em breve! 🟢\n\nSe for urgente, chame diretamente:\n📱 ${telefoneFormatado}`,

  erro: `🤔 Desculpe, não entendi sua mensagem.\n\nExperimente digitar uma das opções abaixo:\n\n• *inscricao* — Garantir minha vaga\n• *preco* — Valores\n• *data* — Quando começa\n• *local* — Onde ficamos\n• *duvida* — Falar com alguém\n\nOu simplesmente aguarde que logo vamos responder você! 😊`
};

const regras = [
  { chaves: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'eai'], resposta: 'boasVindas' },
  { chaves: ['inscrever', 'inscricao', 'quero participar', 'garantir vaga', 'link', 'formulario'], resposta: 'inscricao' },
  { chaves: ['preco', 'valor', 'quanto custa', 'precos', 'valores', 'pagamento', 'parcela'], resposta: 'preco' },
  { chaves: ['data', 'quando', 'inicio', 'comeca'], resposta: 'data' },
  { chaves: ['local', 'endereco', 'onde', 'rua', 'chegar', 'cidade'], resposta: 'local' },
  { chaves: ['salario', 'ganha', 'remuneracao', 'renda'], resposta: 'salario' },
  { chaves: ['duvida', 'duvidas', 'falar', 'atendente', 'pessoa', 'atendimento', 'contato'], resposta: 'duvida' }
];

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contemChave(texto, chave) {
  return ` ${texto} `.includes(` ${chave} `);
}

function extrairTexto(mensagem) {
  const conteudo = mensagem.message;
  return conteudo?.conversation
    || conteudo?.extendedTextMessage?.text
    || conteudo?.imageMessage?.caption
    || conteudo?.videoMessage?.caption
    || conteudo?.documentMessage?.caption
    || conteudo?.buttonsResponseMessage?.selectedButtonId
    || conteudo?.listResponseMessage?.singleSelectReply?.selectedRowId
    || '';
}

function encontrarResposta(texto) {
  for (const regra of regras) {
    if (regra.chaves.some((chave) => contemChave(texto, chave))) {
      return MENSAGENS[regra.resposta];
    }
  }
  return MENSAGENS.erro;
}

async function iniciarBot() {
  const app = express();
  const porta = Number(process.env.PORT) || 3000;
  let reconexaoAgendada = false;

  app.get('/', (_req, res) => {
    res.send(`✅ BRAVO Bot está rodando! Hora: ${new Date().toLocaleString('pt-BR')}`);
  });

  app.listen(porta, () => {
    console.log(`🌐 Servidor rodando na porta ${porta}`);
  });

  async function conectarWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth'));
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        console.log('✅ CONECTADO! Bot está ativo no WhatsApp! 🚀');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const motivo = DisconnectReason[statusCode] || 'desconexão inesperada';
        console.log(`❌ Desconectado: ${motivo}`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.error('Sessão encerrada. Remova a pasta auth e reinicie para escanear um novo QR code.');
          return;
        }

        if (!reconexaoAgendada) {
          reconexaoAgendada = true;
          setTimeout(() => {
            reconexaoAgendada = false;
            conectarWhatsApp().catch((erro) => console.error('❌ Erro ao reconectar:', erro));
          }, 5000);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const mensagem of messages) {
        const jid = mensagem.key?.remoteJid;
        if (!jid || mensagem.key.fromMe || jid.endsWith('@g.us') || jid === 'status@broadcast') continue;

        const textoRecebido = extrairTexto(mensagem).trim();
        if (!textoRecebido) continue;

        const remetente = jid.split('@')[0];
        console.log(`💬 De ${remetente}: ${textoRecebido}`);

        const resposta = encontrarResposta(normalizarTexto(textoRecebido));
        try {
          await sock.sendMessage(jid, { text: resposta });
          console.log(`✅ Resposta enviada para ${remetente}`);
        } catch (erro) {
          console.error(`❌ Não foi possível responder ${remetente}:`, erro);
        }
      }
    });
  }

  await conectarWhatsApp();
}

iniciarBot().catch((erro) => {
  console.error('❌ Erro ao iniciar o bot:', erro);
  process.exitCode = 1;
});
