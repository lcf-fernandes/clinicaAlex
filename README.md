# clinicaAlex

Sistema de gestão para The Prevention Therapy Center: agenda diária,
pacientes, pagamentos, pacientes fixos, reemplazos e liquidação diária.

## Documentação

- [`docs/especificacao-original.pdf`](docs/especificacao-original.pdf) — especificação funcional original.
- [`docs/arquitetura-app-clinica.md`](docs/arquitetura-app-clinica.md) — arquitetura, modelo de dados (Firestore) e roadmap de fases.

## Status

**Fase 1** concluída: modelo de dados no Firestore, CRUD de
Profissionais e Pacientes (com perfis de facturación), login por
**usuário**/senha (Firebase Auth + lookup usuário→e-mail no Firestore)
e controle de acesso por papel: só `admin` vê o painel **Usuários**,
onde pode bloquear/desbloquear ou apagar o acesso de uma secretária
(uma secretária não vê nem consegue mexer em contas de ninguém — nem
as de outras secretarias).

**Fase 2** concluída: tela de **Agenda** — grade diária com uma coluna
por profissional escalado naquele dia da semana (conforme
`defaultSchedule`), navegação entre dias, clique num horário livre
abre o formulário de nova sessão (busca de paciente, duração 60/120
min, status, pagamento), clique numa sessão existente permite editar
ou remover, bloqueio de horário por profissional, e validação de
conflito (não deixa sobrepor sessão/bloqueio já existente).

**Fase 3** concluída: **histórico do paciente** (botão "Histórico" em
Pacientes — lista todas as sessões já realizadas, canceladas ou
faltadas, de qualquer data, com status e pagamento) e tela de
**Pagamentos pendentes** (lista, em qualquer data, toda sessão com
`payment.method == "pendiente"`, com ação rápida pra marcar como
paga). Sessão realizada conta pra liquidação do profissional
independente do pagamento estar pendente (item 16 da especificação) —
isso já é verdade hoje porque liquidação (Fase 7) ainda não existe;
quando for implementada, ela soma por `status == "asistio"`, não por
`payment.method`.

**Fase 4** concluída: **Pacientes fixos** — regra permanente (dia da
semana + horário + profissional) com exceções pontuais por data
embutidas no mesmo documento (`cancel` / `reassign` / `reschedule`),
sem nunca sobrescrever a regra permanente (item 10/23 da
especificação). "Encerrar" marca `active: false` e guarda a data —
não apaga nada, o histórico de sessões já geradas continua intacto.

> **Decisão de implementação:** a arquitetura original previa um job
> agendado (Cloud Function) rodando todo dia de madrugada pra gerar as
> sessões da semana seguinte. Como o projeto ainda não tem Cloud
> Functions configuradas, a geração acontece de forma preguiçosa: na
> primeira vez que a secretária abre a Agenda para um dia que tem
> paciente(s) fixo(s) programado(s), o app cria a sessão correspondente
> na hora (ver `useAutoGenerateRecurringSessions`), aplicando exceções e
> pulando se o horário já estiver ocupado por outra coisa. É idempotente
> — abrir a mesma data de novo não duplica. Migrar isso pra um job
> real no back-end fica junto com a Cloud Function de exclusão de
> usuário, já documentada acima.

**Fase 5** concluída: **reemplazo de profissionais** (item 11 da
especificação). "+ Profissional ausente" marca alguém ausente num dia
específico, com reemplazo opcional — o reemplazo aparece na grade
daquele dia usando o horário do profissional ausente (ou a união dos
dois horários, se o reemplazo já trabalhava nesse dia por conta
própria). A coluna do ausente some da grade; em vez disso aparece um
banner no topo listando os pacientes que já estavam agendados com
ele(a), paciente por paciente, com três opções — **transferir** pra
qualquer profissional ativo (não só o reemplazo sugerido), **cancelar
a sessão**, ou simplesmente deixar pendente pra decidir depois. Uma
sessão transferida guarda `scheduledProfessionalId`/`Name` (quem era o
profissional habitual) além de `professionalId`/`Name` (quem atendeu
de fato) — ambos os dados ficam preservados pra quando a liquidação
(Fase 7) for implementada.

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
    auth/           # useAuth (login/logout/estado) + lookup usuário→e-mail
    firestore/       # helpers genéricos de CRUD/subscribe
    date.ts           # utilitários de data (ISO, dia da semana, navegação)
  types/            # tipos de domínio (Professional, Patient, Session, User, ...)
  modules/
    auth/            # tela de login
    agenda/           # grade diária, criação/edição de sessão, bloqueios, ausência/reemplazo
    professionals/    # listagem + formulário de profissionais
    patients/         # listagem + formulário + histórico de sessões do paciente
    recurring/         # pacientes fixos: regra + exceções por data
    payments/          # pagamentos pendentes (todas as datas)
    users/            # painel de usuários (admin)
```
