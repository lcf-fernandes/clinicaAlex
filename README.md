# clinicaAlex

Sistema de gestão para The Prevention Therapy Center: agenda diária,
pacientes, pagamentos, pacientes fixos, reemplazos e liquidação diária.

## Documentação

- [`docs/especificacao-original.pdf`](docs/especificacao-original.pdf) — especificação funcional original.
- [`docs/arquitetura-app-clinica.md`](docs/arquitetura-app-clinica.md) — arquitetura, modelo de dados (Firestore) e roadmap de fases.

## Status

Fase 1 concluída: modelo de dados no Firestore, CRUD de Profissionais e
Pacientes (com perfis de facturación), e login por e-mail/senha
(Firebase Auth) protegendo o acesso. Falta: deploy num projeto Firebase
real e criação do primeiro usuário (secretária).

## Stack

React + TypeScript (Vite) + Firebase (Firestore, Auth, Cloud Functions).

## Rodando localmente

```bash
npm install
npm run dev
```

As credenciais do Firebase (projeto `clinicaalex-47cf9`) já estão em
`src/firebase/config.ts` — são valores públicos do SDK web, a segurança
real fica nas regras do Firestore e no Auth.

No Firebase Console, ative **Authentication → Sign-in method → E-mail/senha**
e crie manualmente o primeiro usuário (a secretária) em
**Authentication → Users → Add user**. Depois é só entrar com esse
e-mail/senha na tela de login do app.

Para publicar as regras de segurança do Firestore (`firestore.rules`) e
os índices, use o Firebase CLI (`firebase deploy --only firestore`)
depois de rodar `firebase init` apontando para o projeto criado no
Console.

## Estrutura

```
src/
  firebase/        # inicialização do app Firebase (usa .env)
  shared/
    auth/           # hook useAuth (login/logout/estado)
    firestore/       # helpers genéricos de CRUD/subscribe
  types/            # tipos de domínio (Professional, Patient, ...)
  modules/
    auth/            # tela de login
    professionals/    # listagem + formulário de profissionais
    patients/         # listagem + formulário de pacientes
```
