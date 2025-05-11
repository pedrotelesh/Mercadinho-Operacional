# Mercado Virtual para Funcionários

Aplicação web de mercado virtual para funcionários, feita com Next.js, Prisma ORM e SQLite.

## Funcionalidades
- Autenticação de usuário e admin
- Painel do admin: gerenciar usuários, produtos, ver compras e notificações
- Painel do usuário: ver saldo, comprar produtos, histórico de compras
- Notificações para admin ao ocorrer uma compra

## Tecnologias
- Next.js (App Router, TypeScript, Tailwind)
- Prisma ORM
- SQLite

## Como rodar
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Rode as migrations do banco:
   ```bash
   npx prisma migrate dev
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura
- `src/app` - Páginas e rotas
- `src/generated/prisma` - Prisma Client
- `prisma/schema.prisma` - Schema do banco

Troque as imagens de produtos em `public/` conforme desejar.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
