# AgroTech — Checkout demonstrativo multi-produtor

Marketplace rural com carrinho multi-agricultor, checkout demonstrativo (sem pagamento real) e separação automática de pedidos por produtor.

## Stack

- React + TypeScript (Vite)
- Tailwind CSS
- Firebase Authentication + Cloud Firestore + Hosting (Spark)
- Modo demo local (`localStorage`) quando Firebase não está configurado

## Como rodar (demo local)

```bash
npm install
npm run dev
```

Com `VITE_DEMO_MODE=true` (padrão em `.env`), não é necessário projeto Firebase.

### Contas demo

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Consumidor | consumidor@agrotech.demo | demo123 |
| Fazenda Boa Esperança | boaesperanca@agrotech.demo | demo123 |
| Sítio Verde Vida | verdevida@agrotech.demo | demo123 |

### Fluxo de aceitação

1. Entre como **consumidor**.
2. Adicione Banana/Tomate (Boa Esperança) e Alface/Cenoura (Verde Vida).
3. Abra o **Carrinho** — veja grupos e subtotais.
4. **Finalizar compra** → checkout com entrega/retirada por produtor e pagamento simulado.
5. Confirme — nascem `COMPRA-00X` + `PED-00X` por produtor; estoque baixa.
6. Em **Meus pedidos**, veja a compra agrupada.
7. Saia e entre como cada produtor → **Pedidos recebidos** só da própria fazenda; atualize status.

## Firebase (opcional)

1. Crie projeto no console Firebase (plano Spark).
2. Ative Authentication (e-mail/senha) e Firestore.
3. Copie `.env.example` → `.env` com as chaves e `VITE_DEMO_MODE=false`.
4. Publique regras: `firebase deploy --only firestore:rules`
5. Hosting: `npm run build` e `firebase deploy --only hosting`

Leia **[LIMITATIONS.md](./LIMITATIONS.md)** antes de qualquer uso além de demonstração.

## Pagamentos

Disponíveis apenas:

- Pagamento na entrega
- Pagamento na retirada
- Pagamento simulado

Sem cartão, sem gateways pagos.
