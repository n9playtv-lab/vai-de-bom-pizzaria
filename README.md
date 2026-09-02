# Vai de Bom Pizzaria — Cardápio e Pedidos Online

Site próprio de pedidos, substituindo a mensalidade do BeeFood. Front-end no Netlify,
banco de dados e autenticação no Firebase, notificações automáticas no WhatsApp via
Cloud API da Meta.

## Passo a passo

### 1. Criar o projeto no Firebase
1. Acesse https://console.firebase.google.com → **Adicionar projeto**
2. Dentro do projeto, ative:
   - **Firestore Database** (modo produção)
   - **Authentication** → método **E-mail/senha** → crie 1 usuário pra você (será o login do painel admin)
3. Em **Configurações do projeto → Seus apps → Web (`</>`)**, registre um app e copie as chaves.

### 2. Configurar o projeto local
```bash
npm install
cp .env.example .env
# cole as chaves do Firebase no .env
npm run dev
```

### 3. Publicar as regras de segurança do Firestore
```bash
npm install -g firebase-tools
firebase login
firebase init   # selecione o projeto que você criou, aponte para firestore.rules
firebase deploy --only firestore:rules
```

### 4. Cadastrar o cardápio
Entre em `/admin`, faça login com o usuário criado no passo 1, vá em **Cardápio** e
cadastre as pizzas (categoria, nome, descrição, preço, foto).

### 5. WhatsApp automático (Cloud API da Meta)
1. Crie um app em https://developers.facebook.com/apps → adicione o produto **WhatsApp**
2. Copie o **Token de acesso temporário** (ou gere um permanente) e o **Phone Number ID**
3. Configure nas Functions:
```bash
cd functions
npm install
firebase functions:secrets:set WHATSAPP_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_ID
firebase deploy --only functions
```
Sem isso configurado, o site funciona normalmente — só não manda WhatsApp automático
(fica registrado no log da function).

### 6. Publicar no Netlify
1. Suba esta pasta num repositório no GitHub
2. No Netlify: **Add new site → Import an existing project** → selecione o repo
3. Build command: `npm run build` — Publish directory: `dist` (já configurado no `netlify.toml`)
4. Em **Site settings → Environment variables**, cole as mesmas chaves do seu `.env`

## Estrutura
- `src/pages/Menu.jsx` — cardápio público
- `src/pages/Checkout.jsx` — carrinho → endereço → pagamento (com cálculo de troco)
- `src/pages/OrderStatus.jsx` — acompanhamento do pedido em tempo real
- `src/pages/admin/` — login, painel de pedidos (com som ao chegar pedido novo) e editor de cardápio
- `functions/index.js` — dispara WhatsApp quando o status do pedido muda

## Fluxo de status do pedido
`pendente` → `aceito` ou `recusado` → `saiu_entrega` → `entregue`
Cada mudança de status dispara uma mensagem automática pro WhatsApp do cliente.
