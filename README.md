# clinicaAlex

Sistema de gestão para The Prevention Therapy Center: agenda diária,
pacientes, pagamentos, pacientes fixos, reemplazos e liquidação diária.

## Documentação

- [`docs/especificacao-original.pdf`](docs/especificacao-original.pdf) — especificação funcional original.
- [`docs/arquitetura-app-clinica.md`](docs/arquitetura-app-clinica.md) — arquitetura, modelo de dados (Firestore) e roadmap de fases.

## Status

Fase 1 concluída: modelo de dados no Firestore, CRUD de Profissionais e
Pacientes (com perfis de facturación), login por **usuário**/senha
(Firebase Auth por trás de um mapeamento usuário → e-mail sintético) e
perfis de usuário com papel (`admin` / `secretary`) e permissões
granulares preparadas para uso futuro.

## Stack

React + TypeScript (Vite) + Firebase (Firestore, Auth, Cloud Functions).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do projeto clinicaalex-47cf9
npm run dev
```

As chaves do SDK web do Firebase (`apiKey` etc.) não são segredo por
natureza — qualquer app Firebase as expõe no bundle do navegador. Ainda
assim ficam em `.env.local` (fora do git) por organização, e a proteção
de verdade vem de dois lugares:

1. **Regras do Firestore** (`firestore.rules`) — só usuário autenticado
   acessa dados; a coleção `users` só é editável por `admin`.
2. **Restrição do apiKey no Google Cloud Console** — em
   [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials?project=clinicaalex-47cf9),
   edite a chave do app web e restrinja por "HTTP referrers" ao(s)
   domínio(s) onde o app vai rodar. Isso impede que a chave seja usada
   fora do seu site mesmo estando pública.

> Uma versão anterior deste README tinha o `apiKey` do projeto escrito
> direto no código-fonte, já commitada no histórico do repositório.
> Como não é segredo, não há risco de segurança nisso em si — mas se
> quiser removê-la do histórico mesmo assim (por exemplo, se o repo for
> ficar público), isso exige reescrever o histórico do git
> (`git filter-repo` ou recriar o repositório), me avise se quiser
> ajuda com isso.

## Usuários

Autenticação é por **usuário** (não e-mail) — o app mapeia usuário →
e-mail sintético internamente (`src/shared/auth/usernameMap.ts`). Cada
conta tem dois lugares:

1. **Firebase Auth** — a credencial de login em si (Console →
   Authentication → Users → Add user), usando o e-mail sintético
   correspondente.
2. **Firestore `users/{uid}`** — o perfil com `username`, `role`
   (`admin` ou `secretary`) e `permissions` (ver `src/types/user.ts`).
   O `uid` do documento tem que ser exatamente o UID gerado pelo Auth
   no passo 1.

Nenhuma senha fica no código ou no histórico do git — são criadas
manualmente no Console.

Para publicar as regras de segurança do Firestore (`firestore.rules`) e
os índices, use o Firebase CLI (`firebase deploy --only firestore`)
depois de rodar `firebase init` apontando para o projeto criado no
Console.

## Estrutura

```
src/
  firebase/        # inicialização do app Firebase (usa .env)
  shared/
    auth/           # useAuth (login/logout/estado) + mapa usuário→e-mail
    firestore/       # helpers genéricos de CRUD/subscribe
  types/            # tipos de domínio (Professional, Patient, User, ...)
  modules/
    auth/            # tela de login
    professionals/    # listagem + formulário de profissionais
    patients/         # listagem + formulário de pacientes
```
