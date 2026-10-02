# clinicaAlex

Sistema de gestão para The Prevention Therapy Center: agenda diária,
pacientes, pagamentos, pacientes fixos, reemplazos e liquidação diária.

## Documentação

- [`docs/especificacao-original.pdf`](docs/especificacao-original.pdf) — especificação funcional original.
- [`docs/arquitetura-app-clinica.md`](docs/arquitetura-app-clinica.md) — arquitetura, modelo de dados (Firestore) e roadmap de fases.

## Status

Fase 1 concluída: modelo de dados no Firestore, CRUD de Profissionais e
Pacientes (com perfis de facturación), login por **usuário**/senha
(Firebase Auth + lookup usuário→e-mail no Firestore) e controle de
acesso por papel: só `admin` vê o painel **Usuários**, onde pode
bloquear/desbloquear ou apagar o acesso de uma secretária (uma
secretária não vê nem consegue mexer em contas de ninguém — nem as de
outras secretarias).

> **Pendente, documentado mas não implementado:** "Apagar" no painel
> Usuários remove o acesso ao app (perfil em `users/{uid}` e o vínculo
> em `usernames/{username}`), mas a credencial em si no **Firebase
> Authentication** continua existindo — excluí-la também exige o Admin
> SDK, que só funciona em back-end (Cloud Function), não no app React
> rodando no navegador. Pra automatizar isso: criar uma Cloud Function
> callable (`deleteUserAccount`), chamável só por quem tem `role ==
> 'admin'`, que chama `admin.auth().deleteUser(uid)`. Até lá, remover a
> credencial de verdade é um passo manual: Console → Authentication →
> Users → excluir a linha correspondente.

## Stack

React + TypeScript (Vite) + Firebase (Firestore, Auth, Cloud Functions).

## Rodando localmente

```bash
npm install
npm run dev
```

As credenciais do Firebase (projeto `clinicaalex-47cf9`) já estão fixas
em `src/firebase/config.ts` — não é preciso configurar nenhum `.env`
pra rodar local ou na Vercel. As chaves do SDK web do Firebase
(`apiKey` etc.) não são segredo por natureza — qualquer app Firebase as
expõe no bundle do navegador de qualquer forma. A proteção de verdade
vem de dois lugares:

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

Autenticação é por **usuário** (não e-mail) — o app resolve usuário →
e-mail consultando o Firestore em tempo real (`src/shared/auth/usernameMap.ts`),
não um mapa fixo no código. Criar um usuário novo não exige deploy:
basta criar os três registros abaixo pelo Console. O `uid` usado nos
passos 2 e 3 tem que ser exatamente o UID gerado no passo 1.

1. **Firebase Auth** (Console → Authentication → Users → Add user) —
   e-mail e senha reais da conta.
2. **Firestore `users/{uid}`** — o perfil com `username`, `role`
   (`admin` ou `secretary`), `active` (boolean) e opcionalmente
   `permissions` (ver `src/types/user.ts`). Protegido por regras: só o
   próprio usuário ou um admin lê; só admin escreve.
3. **Firestore `usernames/{username}`** — documento com ID igual ao
   texto que a pessoa digita no campo "Usuário" (ex.: `Overlord`),
   contendo `{ email: "<mesmo e-mail do passo 1>", uid: "<uid>" }`.
   Essa coleção é de **leitura pública** (precisa ser consultada antes
   do login, quando ainda não há sessão) — por isso só guarda o
   vínculo usuário→e-mail, nunca papel/permissões.

Nenhuma senha fica no código ou no histórico do git — são criadas
manualmente no Console.

Para publicar as regras de segurança do Firestore (`firestore.rules`) e
os índices, use o Firebase CLI (`firebase deploy --only firestore`)
depois de rodar `firebase init` apontando para o projeto criado no
Console.

## Estrutura

```
src/
  firebase/        # inicialização do app Firebase (config fixa)
  shared/
    auth/           # useAuth (login/logout/estado) + mapa usuário→e-mail
    firestore/       # helpers genéricos de CRUD/subscribe
  types/            # tipos de domínio (Professional, Patient, User, ...)
  modules/
    auth/            # tela de login
    professionals/    # listagem + formulário de profissionais
    patients/         # listagem + formulário de pacientes
```
