# Limitações — AgroTech (MVP acadêmico)

## Regras do Firestore

As regras atuais são **intencionalmente simples**:

- leitura pública de todos os documentos
- escrita apenas para usuários autenticados

Isso facilita o MVP (cadastro, checkout, estoque, painel do produtor), mas **não é seguro** para produção nem para pagamentos reais.

## Pagamentos

Não há gateway (Mercado Pago, Stripe, etc.). O checkout é demonstrativo.

## Conclusão

Adequado para demonstração acadêmica. Para produção, restringir por `uid`/`role` e mover criação de pedidos + baixa de estoque para um backend confiável.
