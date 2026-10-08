# clinicaAlex

Sistema de gestão para The Prevention Therapy Center: agenda diária,
pacientes, pagamentos, pacientes fixos, reemplazos e liquidação diária.

## Documentação

- [`docs/especificacao-original.pdf`](docs/especificacao-original.pdf) — especificação funcional original.
- [`docs/arquitetura-app-clinica.md`](docs/arquitetura-app-clinica.md) — arquitetura, modelo de dados (Firestore) e roadmap de fases.
- [`docs/manual-de-usuario.md`](docs/manual-de-usuario.md) — manual de usuário em espanhol, por papel (secretaria, admin, profissional). Rascunho em revisão; depois vira PDF.

## Status

🎉 **As 7 fases do roadmap original (seção 8 do documento de
arquitetura) estão concluídas.** Pendências conhecidas: as duas Cloud
Functions documentadas abaixo (exclusão de usuário via Admin SDK,
geração de paciente fixo por job agendado) e qualquer item da seção
"Pontos em aberto" da arquitetura ainda não decidido. Detalhe por
fase:

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

**Fase 6** concluída: **Lista de espera** (itens 21-22 da
especificação). Nova seção cadastra paciente + preferência de horário
(manhã/tarde/qualquer), profissional preferido (opcional) e dias
preferidos (opcional — vazio = qualquer dia). Ao abrir uma sessão nova
na Agenda, se algum paciente da lista bate com aquele profissional/dia
da semana/período do horário clicado, aparece como sugestão rápida
acima da busca de paciente; escolher um já preenche tudo e, ao salvar,
marca aquela entrada como "convertida" automaticamente. Lista de
espera não reserva horário nenhum — é só um registro de interesse, como
a especificação pede.

**Fase 7** concluída: **Liquidação diária** (itens 17-20 da
especificação) — última fase do roadmap original. Pra cada
profissional com sessão `asistio` naquele dia:

```
sessões (unidades de 1h, 120min = 2 — item 18)
× valor por sessão                    = bruto
− custo de sala
− (sessões × taxa por sessão)         = taxas
− ajustes manuais (item 19)
= a receber
```

Liquida quem **realmente atendeu** (`session.professionalId`), não o
profissional habitual original de um reemplazo
(`scheduledProfessionalId`) — é exatamente o dado que a Fase 5 passou a
preservar pensando nisso. Antes de fechar, os valores são recalculados
ao vivo (se uma presença for corrigida, o número muda na hora); ao
clicar **Fechar** (por profissional ou o dia inteiro de uma vez), o
snapshot final é gravado e passa a ficar travado — mesmo que a agenda
daquele dia seja editada depois, o valor fechado não muda sozinho. Dá
pra **Reabrir** se precisar corrigir. Ajustes manuais (concepto + valor,
ex. "Almuerzo") ficam guardados por profissional/dia e entram no
cálculo antes do fechamento.

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

## Configurações (salas por dia da semana)

Resolve o último ponto em aberto da arquitetura (seção 9): quantas
salas/profissionais simultâneos a clínica aguenta em cada dia. Nova
seção "Configurações" (só admin) tem um número por dia da semana —
começa com os valores da especificação original (8 na maioria dos
dias, 9 às quartas), mas é editável.

É um limite de **referência**, não uma trava: o formulário de
Profissionais mostra "X/Y salas" ao lado de cada dia marcado (contando
quantos outros profissionais ativos já têm aquele dia na escala), e
fica vermelho se passar do configurado — mas não impede salvar. A
clínica pode legitimamente ter um motivo pra passar do número num dia
específico, então a decisão fica com quem está cadastrando.

## Impressão

Botão "🖶 Imprimir" na Agenda chama `window.print()`; não gera PDF
nenhum — usa a função nativa de imprimir/"Salvar como PDF" do
navegador. Um `@media print` em `index.css` esconde a sidebar, os
botões de navegação e os controles interativos do banner de ausência,
e ajusta a grade pra caber em uma folha (sugere paisagem via `@page`).

## Historial de acciones (auditoria)

Seção "Historial de acciones" (só admin) lista as últimas 300 ações
registradas, com filtro por tipo (sessões, pagamentos, liquidações,
usuários) e busca por texto/usuário. Cada entrada guarda **quem**
(`userId`/`username`), **quando** (`createdAt` do servidor) e um
**resumo legível** já em espanhol.

O que é registrado: criar/editar/apagar sessão (inclui mudança de
estado, pagamento e profissional, e as sessões geradas automaticamente
de paciente fixo), marcar pagamento pendente como pago, ajustes/fechar/
reabrir liquidação, e criar/bloquear/desbloquear/apagar usuário.

Como funciona: `logActivity()` (`src/shared/audit/`) é chamado nos
próprios hooks de cada operação; o "ator" vem de `currentActor`, que o
`useAuth` preenche quando o login muda. Falha de log nunca derruba a
ação principal (só `console.warn`).

**Limitação honesta:** sem Cloud Function no meio, o registro é feito
pelo próprio navegador. As regras do Firestore impedem editar/apagar
entradas (`update, delete: if false`) e só admin lê, mas não dá pra
impedir que um usuário tecnicamente mal-intencionado deixe de gerar a
entrada (ou crie uma falsa). Serve pra dirimir dúvidas do dia a dia
entre secretaria e admin — pra auditoria à prova de adulteração, o log
teria que ser gravado do lado do servidor (mesma pendência das Cloud
Functions, plano Blaze).

Não registrado (por escolha, pra manter o escopo enxuto): CRUD de
profissionais/pacientes, bloqueios de horário, pacientes fixos, lista
de espera. Dá pra estender chamando `logActivity` nesses hooks.

## Agenda: horários livres e cancelamentos

- **Cancelada / falta sem aviso libera o horário** (item 8 da
  especificação): `occupiesSlot()` em `types/session.ts` — só
  `agendado` e `asistio` ocupam. O horário aparece como "Disponible"
  com uma linha pequena mostrando quem cancelou (e um ✎ pra editar o
  registro); outro paciente pode ser agendado ali sem apagar nada, e o
  registro continua no historial do paciente. Se outra sessão ocupa o
  horário, a cancelada deixa de aparecer na grade mas segue no historial.
- **Sessão pode começar em qualquer minuto múltiplo de 5** (ex. 09:15):
  a grade tem uma linha a cada 5 min (6 linhas = uma casinha de 30 min)
  e sessões/bloqueios são posicionados por cima do fundo pelo minuto
  exato, em vez de depender de bater com uma linha de 30 em 30.
- **Mi Liquidación (profissional) só mostra valores quando fechada**:
  o documento aberto só guarda os ajustes, os valores calculados são
  gravados no fechamento.

## Exportar datos (CSV)

Seção "Exportar datos" (só admin) baixa três arquivos CSV pra abrir
no Excel — serve de backup e pra análises que o app não faz (ex.:
total faturado no ano):

- **Pacientes**: lista completa (nome, telefone, facturación nome+RUC,
  observações).
- **Sesiones**: por período (de/até), com profissional, profissional
  habitual em caso de reemplazo, estado, forma e valor de pagamento.
- **Liquidaciones**: por período, só as **fechadas** (as abertas não
  têm valores confiáveis).

Detalhes técnicos que importam: separador `;` (com vírgula, o Excel em
espanhol/português joga tudo numa coluna só) e BOM UTF-8 (senão os
acentos saem quebrados). Valores monetários saem como inteiros, sem
separador de milhar, pra o Excel somar direto. Cada exportação é
registrada no Historial de acciones (`data.export`) — são dados
sensíveis, vale saber quem baixou o quê.

Exportação usa busca única (`fetchRaw` em `crud.ts`), não a assinatura
em tempo real que o resto do app usa.

## Responsividade

Três faixas:
- **Desktop largo**: `.main` fica centralizado (antes ficava colado à
  esquerda com um vão em branco à direita em monitores grandes).
- **≤1024px** (laptop pequeno/tablet): sidebar mais estreita, menos
  padding, formulários com lista ao lado (`layout-split`) empilham em
  vez de ficar espremidos.
- **≤640px** (celular): sidebar vira uma barra horizontal no topo
  (nome do usuário some pra caber mais, o resto continua ali, só mais
  compacto); tabelas ganham scroll horizontal próprio em vez de
  espremer colunas; modais ocupam a largura toda; campos lado a lado
  em formulários empilham.

A grade da Agenda em si não muda de estrutura — ela já tinha scroll
horizontal próprio (`.agenda-scroll`) desde a Fase 2, então continua
funcionando igual em qualquer largura, só rola mais num celular com
muitos profissionais no mesmo dia.

## Reporte mensual

Resolve o que a especificação original (seção 20) deixava preparado
pra depois: uma visão agregada por mês em vez de só dia a dia. Seletor
de mês (`<input type="month">`) soma, por profissional, todas as
liquidações **fechadas** daquele mês — dias ainda em aberto não entram
na soma (os valores deles não são confiáveis até fechar, ver seção
Liquidação diária) e aparecem listados num aviso separado, pra ficar
claro que o total do mês ainda não é definitivo enquanto algum dia
estiver pendente.

## Recuperação de senha

Link "¿Olvidó su contraseña?" na tela de login. Usa
`sendPasswordResetEmail` nativo do Firebase Auth — não depende de
admin nem do Console. Resolve usuário → e-mail do mesmo jeito que o
login (`usernames/{username}`), e sempre mostra a mesma mensagem de
sucesso, exista ou não aquele usuário, pra não revelar quais contas
existem.

Isso usa o e-mail padrão de redefinição de senha que o Firebase já
manda sozinho — não precisa configurar nada extra no projeto pra
funcionar, mas vale testar uma vez pra confirmar que o e-mail chega
(às vezes cai em spam).

## Usuários

Autenticação é por **usuário** (não e-mail) — o app resolve usuário →
e-mail consultando o Firestore em tempo real (`src/shared/auth/usernameMap.ts`),
não um mapa fixo no código.

**Criar usuário é feito dentro do app** — painel Usuários → "+ Novo
usuário" (só admin vê esse painel). Por trás, isso cria os três
registros que antes eram manuais:

1. **Firebase Auth** — via `createAuthAccount` (`src/shared/auth/createAuthAccount.ts`),
   que abre uma segunda instância do Firebase App só pra criar a
   credencial, sem derrubar a sessão de quem está logado (truque
   padrão do client SDK — não precisa de Cloud Function nem do plano
   Blaze).
2. **Firestore `users/{uid}`** — `username`, `role` (`admin`,
   `secretary` ou `professional`), `active: true`, `permissions`
   (default por papel, ver `src/types/user.ts`) e, se for
   `professional`, `professionalId`/`professionalName` (escolhido num
   select com os profissionais já cadastrados).
3. **Firestore `usernames/{username}`** — `{ email, uid }`, checado
   antes pra não deixar duplicar um usuário já existente.

Nenhuma senha fica salva em lugar nenhum do código ou do histórico do
git — a senha inicial só passa pelo formulário na hora da criação.

Criação pelo Console (manual) ainda funciona se precisar — basta
replicar os três registros acima com o mesmo formato.

> Hoje só **admin** vê o painel Usuários e cria contas — secretaria não
> tem esse botão. Se quiser que secretaria também possa criar conta de
> profissional (sem gerenciar outras contas de secretaria/admin), é
> questão de abrir uma exceção na regra do Firestore pra isso; me avisa
> se for o caso.

### Papel "professional"

Pensado pro próprio profissional acompanhar a agenda e a liquidação
dele sem precisar ligar pra secretaria. Ao logar, cai num shell bem
mais simples (`ProfessionalApp.tsx`) com só duas telas — **Minha
Agenda** e **Minha Liquidação** — e tudo **somente leitura**: não edita
sessão, não vê outros profissionais, não vê pacientes, não vê nada de
`professionals`/`patients`/`blocks`/`recurringRules`/`scheduleExceptions`/`waitlist`.
Isso é garantido em duas camadas:

- **UI**: `ProfessionalApp` só importa os dois componentes de leitura
  (`MyAgendaPage`, `MySettlementPage`), que não têm nenhum botão de
  editar/criar.
- **Regras do Firestore**: mesmo que alguém tentasse forçar uma
  chamada direta à API, `sessions` e `dailySettlements` só liberam
  leitura pra um profissional quando o documento retornado tem
  `professionalId` igual ao dele (`role() in ['admin','secretary'] ||
  resource.data.professionalId == myProfessionalId()`) — e nenhuma
  escrita. As outras coleções (`professionals`, `patients`, etc.) ficam
  bloqueadas pra esse papel inteiramente.

A liquidação só aparece pro profissional depois que a secretaria/admin
salvar algo pra aquele dia (ajuste ou fechamento) — o profissional não
tem acesso à coleção `professionals` pra calcular um preview ao vivo
sozinho, então sem o documento ele vê "liquidação ainda não disponível".

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
    waitlist/           # lista de espera, sugestões na Agenda
    payments/          # pagamentos pendentes (todas as datas)
    settlement/          # liquidação diária por profissional, ajustes, fechamento
    reports/              # relatório mensal (soma das liquidações fechadas)
    audit/                 # histórico de ações (só admin lê)
    export/                # exportação de pacientes/sessões/liquidações em CSV (admin)
    settings/             # configuração de salas/profissionais por dia da semana
    myself/                # telas somente-leitura do login de profissional
    users/            # painel de usuários (admin)
```
