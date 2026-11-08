# BRAVO WhatsApp Bot

Assistente automático de WhatsApp para responder dúvidas sobre os cursos da BRAVO.

## Requisitos

- Node.js 20 ou superior
- npm

## Instalação e execução

```bash
npm install
npm start
```

Na primeira execução, escaneie o QR code exibido no terminal usando o WhatsApp vinculado ao atendimento. A sessão fica salva na pasta `auth/`, que não deve ser compartilhada nem adicionada ao Git.

O serviço HTTP fica disponível na porta `3000` (ou na porta definida pela variável `PORT`) e responde com um status simples em `/`.

## Configuração

As configurações podem ser definidas como variáveis de ambiente:

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `NOME_CURSO` | BRAVO - Cursos Preparatórios para carreira Policial | Nome exibido nas mensagens |
| `FORMS_URL` | `COLE_AQUI_SEU_LINK_DO_GOOGLE_FORMS` | Link do formulário de inscrição |
| `WHATSAPP_ATENDENTE` | `+5515992379316` | Telefone para contato da equipe |
| `DATA_INICIO` | Em breve — Vagas limitadas! | Previsão de início das aulas |
| `LOCAL` | Capão Bonito - SP | Local dos cursos |
| `SALARIO` | Até R$ 8.000,00 | Informação salarial divulgada |
| `CURSOS` | GCM e QP de Soldados da PM | Cursos oferecidos |

Antes de iniciar o atendimento, configure `FORMS_URL` com o endereço correto do formulário. Não publique credenciais ou a pasta `auth/`.

O bot responde a mensagens recebidas individualmente; ignora grupos e mensagens enviadas pela própria conta. Se a sessão for desconectada, tenta reconectar automaticamente. Se o WhatsApp encerrar a sessão, será necessário remover `auth/` e escanear o QR code novamente.
